using BoardGameHub.Api.Models;
using System.Collections.Concurrent;
using System.Text.Json;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace BoardGameHub.Api.Services;

public class RoomService : IRoomService, IDisposable
{
    // Concurrent dictionary for thread safety
    private readonly ConcurrentDictionary<string, Room> _rooms = new();
    // Map ConnectionId -> RoomCode for O(1) lookup
    private readonly ConcurrentDictionary<string, string> _connectionRoomMap = new();
    private readonly IEnumerable<IGameService> _gameServices;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.AdminHub> _adminHubContext;
    private readonly Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.GameHub> _gameHubContext;
    private readonly GameStateManager _gameStateManager;
    private readonly ILogger<RoomService> _logger;
    private readonly Microsoft.Extensions.DependencyInjection.IServiceScopeFactory? _scopeFactory;
    private readonly IRoomPersistenceService? _persistenceService;
    private readonly IRoomStateSerializer? _serializer;

    private readonly Timer _statsTimer;
    private int _statsDirty = 0;
    private int _isBroadcasting = 0;

    public RoomService(
        IEnumerable<IGameService> gameServices,
        Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.AdminHub> adminHubContext,
        Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.GameHub> gameHubContext,
        GameStateManager gameStateManager,
        ILogger<RoomService> logger)
        : this(gameServices, adminHubContext, gameHubContext, gameStateManager, logger, null, null, null)
    {
    }

    public RoomService(
        IEnumerable<IGameService> gameServices,
        Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.AdminHub> adminHubContext,
        Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.GameHub> gameHubContext,
        GameStateManager gameStateManager,
        ILogger<RoomService> logger,
        Microsoft.Extensions.DependencyInjection.IServiceScopeFactory? scopeFactory,
        IRoomPersistenceService? persistenceService,
        IRoomStateSerializer? serializer)
    {
        _gameServices = gameServices;
        _adminHubContext = adminHubContext;
        _gameHubContext = gameHubContext;
        _gameStateManager = gameStateManager;
        _logger = logger;
        _scopeFactory = scopeFactory;
        _persistenceService = persistenceService;
        _serializer = serializer;
        
        // Broadcast stats at most every 2 seconds
        _statsTimer = new Timer(static state =>
        {
            if (state is RoomService self)
            {
                _ = self.BroadcastStatsIfNeeded();
            }
        }, this, 2000, 2000);
    }

    private async Task BroadcastStatsIfNeeded()
    {
        try
        {
            if (Interlocked.CompareExchange(ref _statsDirty, 0, 1) == 1)
            {
                if (Interlocked.CompareExchange(ref _isBroadcasting, 1, 0) != 0)
                {
                    Interlocked.Exchange(ref _statsDirty, 1);
                    return;
                }

                try
                {
                    if (_adminHubContext?.Clients?.All != null)
                    {
                        await _adminHubContext.Clients.All.SendAsync("StatsUpdated", GetServerStats());
                    }
                }
                finally
                {
                    Interlocked.Exchange(ref _isBroadcasting, 0);
                }
            }
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to broadcast server stats to AdminHub");
        }
    }

    public void Dispose()
    {
        _statsTimer?.Dispose();
        GC.SuppressFinalize(this);
    }

    public T? GetGameService<T>(GameType type) where T : class
    {
        return _gameServices.FirstOrDefault(s => s.GameType == type) as T;
    }



    public Room? SetHostPlayer(string code, string connectionId)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        room.StateLock.Wait();
        try
        {
            var newHost = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (newHost == null) return null;

            // Logic Change: Allow multiple hosts / Co-hosts. 
            // We do NOT clear existing hosts. We just promote the new one.
            // Also ensure Creator is always host.
            newHost.IsHost = true;

            if (!string.IsNullOrEmpty(room.CreatorConnectionId))
            {
                var creator = room.Players.FirstOrDefault(p => p.ConnectionId == room.CreatorConnectionId);
                if (creator != null) creator.IsHost = true;
            }
            
            // Update the "Primary" host pointer (for backwards compatibility or single-owner logic)
            room.HostPlayerId = connectionId;
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? RemoveHostPlayer(string code, string requesterConnectionId, string targetConnectionId)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        // Only the room creator can remove host status
        if (room.CreatorConnectionId != requesterConnectionId) return null;

        // Cannot demote the creator
        if (room.CreatorConnectionId == targetConnectionId) return null;

        room.StateLock.Wait();
        try
        {
            var target = room.Players.FirstOrDefault(p => p.ConnectionId == targetConnectionId);
            if (target == null) return null;

            target.IsHost = false;

            // If the primary host pointer was this player, clear it
            if (room.HostPlayerId == targetConnectionId)
            {
                room.HostPlayerId = room.CreatorConnectionId;
            }
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room CreateRoom(string hostConnectionId, string hostName, bool isPublic, GameType gameType = GameType.Scatterbrain, string? userId = null, string? avatarUrl = null, bool isScreen = false)
    {
        var code = GenerateRoomCode();
        var room = new Room
        {
            Code = code,
            GameType = gameType,
            Revision = 1,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4),
            Players = new List<Player>
            {
                new Player { 
                    ConnectionId = hostConnectionId, 
                    Name = hostName, 
                    IsHost = true,
                    UserId = userId,
                    AvatarUrl = avatarUrl,
                    IsScreen = isScreen
                }
            },
            IsPublic = isPublic,
            HostScreenId = hostConnectionId,
            HostPlayerId = hostConnectionId,
            CreatorConnectionId = hostConnectionId // Set the creator
        };

        if (_rooms.TryAdd(code, room))
        {
            var sanitizedHostName = System.Text.RegularExpressions.Regex.Replace(hostName ?? string.Empty, @"[\r\n\x00-\x1F\x7F]", " ");
            _logger.LogInformation("Room created: {Code} by {Host} (Type: {GameType})", code, sanitizedHostName, gameType);
            _connectionRoomMap.TryAdd(hostConnectionId, code);
            
            // Start State Tracking
            _gameStateManager.TrackRoom(room);
            
            NotifyStatsChanged();
        }
        return room;
    }

    public List<Room> GetPublicRooms()
    {
        return _rooms.Values
            .Where(r => r.IsPublic && r.State == GameState.Lobby)
            .ToList();
    }

    public void RebindPlayerConnection(Room room, string oldConnectionId, string newConnectionId)
    {
        if (room == null || string.IsNullOrWhiteSpace(oldConnectionId) || string.IsNullOrWhiteSpace(newConnectionId) || oldConnectionId == newConnectionId)
            return;

        if (room.HostPlayerId == oldConnectionId) room.HostPlayerId = newConnectionId;
        if (room.HostScreenId == oldConnectionId) room.HostScreenId = newConnectionId;
        if (room.CreatorConnectionId == oldConnectionId) room.CreatorConnectionId = newConnectionId;

        room.RoundScores.RebindKey(oldConnectionId, newConnectionId);
        room.PlayerAnswers.RebindKey(oldConnectionId, newConnectionId);
        room.NextGameVotes.RebindKey(oldConnectionId, newConnectionId);

        // Rebind game-specific service state
        var gameService = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        gameService?.RebindPlayer(room, oldConnectionId, newConnectionId);
    }

    public Room? JoinRoom(string code, string connectionId, string playerName, string? userId = null, string? avatarUrl = null, bool isScreen = false, string? sessionId = null)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room))
        {
            HydrateRoomFromDatabase(code.ToUpper());
            _rooms.TryGetValue(code.ToUpper(), out room);
        }

        if (room == null)
        {
            var sanitizedCode = System.Text.RegularExpressions.Regex.Replace(code ?? string.Empty, @"[\r\n\x00-\x1F\x7F]", " ");
            _logger.LogWarning("Player attempted to join room {Code}: Room not found", sanitizedCode);
            return null;
        }

        var cleanUserId = string.IsNullOrWhiteSpace(userId) ? null : userId.Trim();
        // Validate sessionId is a well-formed GUID to prevent arbitrary string injection as a bearer token
        var cleanSessionId = Guid.TryParse(sessionId, out var parsedSessionId) ? parsedSessionId.ToString("N") : null;

        room.StateLock.Wait();
        try
        {
            // 1. RECONNECTION LOGIC: Check if player exists by ID (UserId or SessionId)
            var existingPlayer = room.Players.FirstOrDefault(p => 
                (cleanUserId != null && p.UserId == cleanUserId) || 
                (cleanSessionId != null && p.SessionId == cleanSessionId));

            if (existingPlayer != null)
            {
                var oldConnectionId = existingPlayer.ConnectionId;
                if (oldConnectionId != connectionId)
                {
                    RebindPlayerConnection(room, oldConnectionId, connectionId);
                    _connectionRoomMap.TryRemove(oldConnectionId, out _);
                }
                
                existingPlayer.ConnectionId = connectionId;
                existingPlayer.IsConnected = true; // Mark as connected
                existingPlayer.Name = playerName; // Update name in case it changed
                
                if (cleanUserId != null) existingPlayer.UserId = cleanUserId;
                if (avatarUrl != null) existingPlayer.AvatarUrl = avatarUrl;
                // existingPlayer.IsScreen = isScreen; // KEEP EXISTING ROLE ON RECONNECT

                // Rotate the session token on reconnect to limit exposure window if a prior token was leaked.
                // GameHub will re-emit the new token via the existing SessionAssigned flow.
                existingPlayer.SessionId = Guid.NewGuid().ToString("N");

                _connectionRoomMap.TryAdd(connectionId, code);
                _gameStateManager.MarkDirty(room.Code);
                NotifyStatsChanged();
                return room;
            }

            // 2. NEW PLAYER LOGIC
            bool assignHost = !room.Players.Any(p => p.IsHost);
            
            if (assignHost && string.IsNullOrEmpty(room.HostPlayerId))
            {
                room.HostPlayerId = connectionId;
            }

            var newPlayer = new Player
            {
                ConnectionId = connectionId,
                Name = playerName,
                IsHost = assignHost,
                IsConnected = true,
                UserId = cleanUserId,
                AvatarUrl = avatarUrl,
                IsScreen = isScreen
            };

            room.Players.Add(newPlayer);
            _connectionRoomMap.TryAdd(connectionId, code);
            _logger.LogInformation("New player {Player} joined room {Code} (Host: {IsHost})", playerName, code, assignHost);
        }
        finally
        {
            room.StateLock.Release();
        }

        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? ChangeRole(string connectionId, bool isScreen)
    {
        if (_connectionRoomMap.TryGetValue(connectionId, out var roomCode))
        {
            if (_rooms.TryGetValue(roomCode, out var room))
            {
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (player != null)
                {
                    room.StateLock.Wait();
                    try
                    {
                        player.IsScreen = isScreen;
                    }
                    finally
                    {
                        room.StateLock.Release();
                    }
                    _gameStateManager.MarkDirty(room.Code);
                    NotifyStatsChanged();
                    return room;
                }
            }
        }
        return null;
    }

    public Room? GetRoom(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var upperCode = code.ToUpperInvariant();
        if (_rooms.TryGetValue(upperCode, out var room))
        {
            return room;
        }

        return HydrateRoomFromDatabase(upperCode);
    }

    public void RehydrateRoom(Room room)
    {
        if (room == null || string.IsNullOrWhiteSpace(room.Code)) return;
        _rooms.AddOrUpdate(room.Code.ToUpperInvariant(), room, (_, _) => room);
        NotifyStatsChanged();
    }

    public void EvictRoom(string code)
    {
        if (string.IsNullOrWhiteSpace(code)) return;
        var upperCode = code.ToUpperInvariant();
        _rooms.TryRemove(upperCode, out _);
        _gameStateManager.UntrackRoom(upperCode);
        NotifyStatsChanged();
    }

    private Room? HydrateRoomFromDatabase(string code)
    {
        if (_scopeFactory == null) return null;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<BoardGameHub.Api.Data.AppDbContext>();
            var now = DateTime.UtcNow;
            var entity = db.ActiveRooms.AsNoTracking().FirstOrDefault(r => r.RoomCode == code && r.ExpiresAt > now);
            if (entity == null) return null;

            var serializer = _serializer ?? new RoomStateSerializer(_gameServices);
            var room = serializer.Deserialize(entity.RoomEnvelopeJson, _gameServices);
            room.Revision = entity.Revision;
            room.CreatedAt = entity.CreatedAt;
            room.UpdatedAt = entity.UpdatedAt;
            room.ExpiresAt = entity.ExpiresAt;

            foreach (var player in room.Players)
            {
                player.IsConnected = false;
            }

            if (_rooms.TryAdd(room.Code.ToUpperInvariant(), room))
            {
                _gameStateManager.TrackRoom(room);
                NotifyStatsChanged();
                return room;
            }

            return _rooms.GetValueOrDefault(room.Code.ToUpperInvariant());
        }
        catch (Exception ex)
        {
            var sanitizedCode = System.Text.RegularExpressions.Regex.Replace(code ?? string.Empty, @"[\r\n\x00-\x1F\x7F]", " ");
            _logger.LogError(ex, "Failed on-demand rehydration for room {RoomCode} from database.", sanitizedCode);
            return null;
        }
    }

    public Room? RenamePlayer(string connectionId, string newName)
    {
        if (_connectionRoomMap.TryGetValue(connectionId, out var roomCode))
        {
            if (_rooms.TryGetValue(roomCode, out var room))
            {
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (player != null)
                {
                    room.StateLock.Wait();
                    try
                    {
                        player.Name = newName;
                    }
                    finally
                    {
                        room.StateLock.Release();
                    }
                    _gameStateManager.MarkDirty(room.Code);
                    NotifyStatsChanged();
                    return room;
                }
            }
        }
        return null;
    }

    public Room? RemovePlayer(string connectionId)
    {
        if (_connectionRoomMap.TryRemove(connectionId, out var roomCode))
        {
            if (_rooms.TryGetValue(roomCode, out var room))
            {
                room.StateLock.Wait();
                try
                {
                    var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                    if (player != null)
                    {
                        // SOFT DELETE: Just mark as disconnected
                        player.IsConnected = false;
                    }
                    else
                    {
                        return null;
                    }
                }
                finally
                {
                    room.StateLock.Release();
                }
                
                // Trigger cleanup check
                CheckRoomLifecycle(room);
                _gameStateManager.MarkDirty(room.Code);
                NotifyStatsChanged();
                return room;
            }
        }
        return null;
    }

    private void CheckRoomLifecycle(Room room)
    {
        bool isEmpty = false;
        room.StateLock.Wait();
        try
        {
            isEmpty = room.Players.All(p => !p.IsConnected);
        }
        finally
        {
            room.StateLock.Release();
        }

        // If everyone is disconnected, schedule destruction
        if (isEmpty)
        {
            Task.Run(() => ScheduleRoomDestruction(room.Code));
        }
    }

    private async Task ScheduleRoomDestruction(string code)
    {
        // Wait 60 seconds
        await Task.Delay(TimeSpan.FromSeconds(60));

        if (_rooms.TryGetValue(code, out var room))
        {
            // If still everyone disconnected, kill it
            bool isEmpty = false;
            await room.StateLock.WaitAsync();
            try
            {
                 isEmpty = room.Players.All(p => !p.IsConnected);
            }
            finally
            {
                room.StateLock.Release();
            }

            if (isEmpty)
            {
                 // Terminate
                 _rooms.TryRemove(code, out _);
                 
                 // Notify anyone who might still be listening (though unlikely if all disconnected)
                 await _gameHubContext.Clients.Group(code).SendAsync("RoomTerminated", "Room closed due to inactivity");
                 
                 // Notify all clients that this room is gone (for Active Tables list)
                 await _gameHubContext.Clients.All.SendAsync("RoomDeleted", code);

                 _gameStateManager.UntrackRoom(code);
                 _persistenceService?.QueueDelete(code);
                 NotifyStatsChanged();
            }
        }
    }

    public void TerminateRoom(string code)
    {
        _rooms.TryRemove(code.ToUpper(), out _);
        _ = _gameHubContext.Clients.Group(code.ToUpper()).SendAsync("RoomTerminated", "Room terminated by administrator");
        _ = _gameHubContext.Clients.All.SendAsync("RoomDeleted", code.ToUpper());
        _gameStateManager.UntrackRoom(code.ToUpper());
        _persistenceService?.QueueDelete(code.ToUpper());
        NotifyStatsChanged();
    }

    public Room? ToggleReady(string code, string connectionId, bool? forcedState = null)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null) return null;

        room.StateLock.Wait();
        try
        {
            // If forcedState is set and requester is HOST, set the room-level override
            if (forcedState != null && player.IsHost)
            {
                room.IsHostOverride = forcedState.Value;
            }
            else
            {
                // Personal toggle: flip the individual player's ready state
                player.IsReady = forcedState ?? !player.IsReady;

                // Auto-compute: if all non-screen players are now ready, no action needed on IsHostOverride
                // The frontend/start logic will check both IsHostOverride and individual states
            }
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code, "Players");
        return room;
    }

    public async Task<Room?> StartGame(string code, GameSettings? settings = null)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        await room.StateLock.WaitAsync();
        try
        {
            // Apply settings if provided (Start of Game)
            if (settings != null)
            {
                room.Settings = settings;
                room.RoundNumber = 0;
                // Reset Total Scores on new game
                foreach(var p in room.Players) p.Score = 0;
            }

            room.RoundNumber++;
            room.State = GameState.Playing;
            room.IsPaused = false;
            room.TimeRemainingWhenPaused = null;
            
            // Reset Round Data
            room.PlayerAnswers.Clear();
            room.RoundScores.Clear();

            var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
            if (service != null)
            {
                await service.StartRound(room, room.Settings);
            }

            // Set Timer
            room.RoundEndTime = DateTime.UtcNow.AddSeconds(room.Settings.TimerDurationSeconds);
        }
        finally
        {
            room.StateLock.Release();
        }
        
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? PauseGame(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        room.StateLock.Wait();
        try
        {
             if (!room.IsPaused && room.RoundEndTime.HasValue)
             {
                 room.IsPaused = true;
                 room.TimeRemainingWhenPaused = room.RoundEndTime.Value - DateTime.UtcNow;
             }
             else
             {
                 return null;
             }
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? ResumeGame(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        room.StateLock.Wait();
        try
        {
            if (room.IsPaused && room.TimeRemainingWhenPaused.HasValue)
            {
                room.IsPaused = false;
                room.RoundEndTime = DateTime.UtcNow.Add(room.TimeRemainingWhenPaused.Value);
                room.TimeRemainingWhenPaused = null;
            }
            else
            {
                return null;
            }
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? EndGame(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        // Already finished?
        if (room.State == GameState.Finished) return room;

        room.StateLock.Wait();
        try
        {
            room.State = GameState.Finished;
            room.IsPaused = false;
            room.RoundEndTime = null; // Clear timer
        }
        finally
        {
            room.StateLock.Release();
        }
        
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public async Task<Room?> SubmitAction(string code, string connectionId, string actionType, System.Text.Json.JsonElement? payload)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        if (service != null)
        {
            var action = new GameAction(actionType, payload);
            bool success = false;
            
            await room.StateLock.WaitAsync();
            try
            {
                if (actionType != "SUBMIT_STROKE") 
                {
                    SaveStateLocked(room);
                }

                success = await service.HandleAction(room, action, connectionId);
            }
            finally
            {
                room.StateLock.Release();
            }

            if (success) 
            {
                // Action could change anything. Usually GameData, Scores, Players.
                // For safety on generic actions, we might need full diff? 
                // Or GameService tells us what changed?
                // Generic Action -> Assume GameData changed.
                _gameStateManager.MarkDirty(room.Code, "GameData");
                // Some actions change scores
                _gameStateManager.MarkDirty(room.Code, "RoundScores");
                _gameStateManager.MarkDirty(room.Code, "PlayerAnswers");
                // And Players (e.g. ready state?)
                _gameStateManager.MarkDirty(room.Code, "Players");

                NotifyStatsChanged();
                return room;
            }
        }
        return null;
    }

    public async Task<Room?> CalculateRoundScores(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        if (service != null)
        {
            await room.StateLock.WaitAsync();
            try
            {
                await service.EndRound(room);
            }
            finally
            {
                room.StateLock.Release();
            }
        }
        
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? SetGameType(string code, GameType gameType)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        // Only allow changing game type in Lobby or Finished state?
        // if (room.State != GameState.Lobby && room.State != GameState.Finished) return null;

        room.StateLock.Wait();
        try
        {
            room.GameType = gameType;
            room.State = GameState.Lobby; // Reset to Lobby so clients switch view
            // Clear votes if game type is manually force set? 
            room.NextGameVotes.Clear();
        }
        finally
        {
            room.StateLock.Release();
        }
        
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? UpdateSettings(string code, GameSettings settings)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        room.StateLock.Wait();
        try
        {
            room.Settings = settings;
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? UpdateUndoSettings(string code, UndoSettings settings)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        room.StateLock.Wait();
        try
        {
            room.UndoSettings = settings;
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public Room? VoteNextGame(string code, string playerId, GameType vote)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        room.StateLock.Wait();
        try
        {
            room.NextGameVotes[playerId] = vote;
        }
        finally
        {
            room.StateLock.Release();
        }
        _gameStateManager.MarkDirty(room.Code);
        NotifyStatsChanged();
        return room;
    }

    public List<string> ValidateRooms(List<string> codes)
    {
        return codes
            .Where(c => _rooms.ContainsKey(c.ToUpper()))
            .Select(c => c.ToUpper())
            .ToList();
    }

    public ServerStats GetServerStats()
    {
        var activeRooms = _rooms.Values.ToList();
        var stats = new ServerStats
        {
            ActiveRooms = activeRooms.Count,
            TotalOnlinePlayers = activeRooms.Sum(r => r.Players.Count),
            Uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime(),
            Rooms = activeRooms.Select(r => 
            {
                // We must lock to read Players list safely
                r.StateLock.Wait();
                try 
                {
                    return new RoomSummary
                    {
                        Code = r.Code,
                        GlobalState = r.State.ToString(),
                        GameType = r.GameType.ToString(),
                        PlayerCount = r.Players.Count,
                        IsPublic = r.IsPublic,
                        HostName = r.Players.FirstOrDefault(p => p.IsHost)?.Name ?? "Unknown",
                        RoundNumber = r.RoundNumber,
                        SettingsTimer = r.Settings?.TimerDurationSeconds ?? 0,
                        Settings = r.Settings ?? new GameSettings(),
                        Players = r.Players.Select(p => new PlayerSummary 
                        {
                            Name = p.Name,
                            IsHost = p.IsHost,
                            Score = p.Score,
                            UserId = p.UserId,
                            ConnectionId = p.ConnectionId
                        }).ToList()
                    };
                }
                finally
                {
                    r.StateLock.Release();
                }
            }).ToList()
        };

        return stats;
    }

    public void NotifyStatsChanged()
    {
        // Mark dirty, handled by timer
        Interlocked.Exchange(ref _statsDirty, 1);
    }

    private string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 4)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    // --- UNDO SYSTEM ---
    // Note: All Save/Undo methods MUST be called within a room.StateLock context.

    private void SaveStateLocked(Room room)
    {
        // Snapshot the State, RoundNumber, and GameData
        // We serialize the specific properties relevant to gameplay restore
        // For simplicity, we can serialize the whole Room but exclude transient things like Connections if possible.
        // But Connections (Players) might change too? 
        // Let's stick to GameData + State + RoundNumber + Scores? 
        // Actually, easiest to serialize the whole object, but keep `Players` connectivity out of it?
        // Players list needs to stay current (connectivity), but their Scores/Attributes are part of state.
        // Let's rely on JSON serialization of the Room, but when restoring, we MUST preserve the *current* ConnectionIds 
        // if we want to avoid breaking active sockets. 
        // However, mapping old state to current connections is hard if players left/joined.
        // BETTER APPROACH for MVP: Serialize the whole Room. When restoring, logic handles connection mapping if needed.
        // But wait, if I restore an old Room object, the `Players` list inside it has old Connection IDs.
        // This is fine. The client will just see the old state. 
        // The Service `_rooms` Dictionary holds the reference. We will update the reference's properties.
        try 
        {
            var options = new JsonSerializerOptions { IncludeFields = true };
            var snapshot = JsonSerializer.Serialize(room, options);
            room.StateHistory.Push(snapshot);
            
            // Limit history
            if (room.StateHistory.Count > 10)
            {
                var list = room.StateHistory.ToList();
                list.RemoveAt(list.Count - 1); // Remove oldest
                list.Reverse(); // Stack to List is reversed
                room.StateHistory = new Stack<string>(list);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving state: {ex.Message}");
        }
    }

    public async Task<Room?> RequestUndo(string code, string connectionId)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        await room.StateLock.WaitAsync();
        try
        {
            // If no history, can't undo
            if (room.StateHistory.Count == 0) return null;

            var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (player == null) return null;

            // 1. Host Only Mode (or Host is requesting)
            if (room.UndoSettings.HostOnly || player.IsHost)
            {
                 // Host can bypass vote? Or if HostOnly is TRUE.
                 // If HostOnly=True and Player isn't Host -> Deny.
                 if (room.UndoSettings.HostOnly && !player.IsHost) return null;

                 return PerformUndoLocked(room); 
            }

            // 2. Default Voting Mode (and player is not host, or Voting is ON)
            if (room.UndoSettings.AllowVoting)
            {
                // Start a Vote
                room.CurrentVote = new UndoVote
                {
                    InitiatorId = connectionId,
                    InitiatorName = player.Name,
                    CreatedAt = DateTime.UtcNow
                };
                // Implicit "Yes" from initiator
                room.CurrentVote.Votes[connectionId] = true;
                
                _gameStateManager.MarkDirty(room.Code);
                NotifyStatsChanged();
                return room; // Caller will broadcast "UndoVoteStarted"
            }
        }
        finally
        {
            room.StateLock.Release();
        }

        return null;
    }

    public async Task<Room?> SubmitUndoVote(string code, string connectionId, bool vote)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        await room.StateLock.WaitAsync();
        try
        {
            if (room.CurrentVote == null) return null;

            room.CurrentVote.Votes[connectionId] = vote;
            
            // Check for Majority
            var totalPlayers = room.Players.Count;
            var castVotes = room.CurrentVote.Votes.Count;
            var yesVotes = room.CurrentVote.Votes.Values.Count(v => v);

            // If simple majority reached ( > 50% of TOTAL players)
            if (yesVotes > totalPlayers / 2.0)
            {
                room.CurrentVote = null; // Vote passed
                return PerformUndoLocked(room);
            }
            
            // If impossible to win (No votes >= 50%)
            // or everyone voted
            if (castVotes == totalPlayers)
            {
                // Vote Finished, failed
                room.CurrentVote = null;
            }

            _gameStateManager.MarkDirty(room.Code);
            NotifyStatsChanged();
            return room;
        }
        finally
        {
            room.StateLock.Release();
        }
    }

    private Room? PerformUndoLocked(Room currentRoom)
    {
        if (currentRoom.StateHistory.Count == 0) return null;

        var snapshot = currentRoom.StateHistory.Pop();
        try 
        {
            var options = new JsonSerializerOptions { IncludeFields = true };
            var oldState = JsonSerializer.Deserialize<Room>(snapshot, options);
            
            if (oldState == null) return null;
            
            // Overwrite properties
            currentRoom.GameType = oldState.GameType;
            currentRoom.State = oldState.State;
            currentRoom.RoundNumber = oldState.RoundNumber;
            currentRoom.GameData = oldState.GameData; // This is the big one (JsonElement or Object)
            currentRoom.RoundScores = oldState.RoundScores;
            currentRoom.PlayerAnswers = oldState.PlayerAnswers;
            
            // Re-assign generic GameData requires careful deserialization if it became JsonElement
            if (currentRoom.GameData is JsonElement jsonElement)
            {
                 var service = _gameServices.FirstOrDefault(s => s.GameType == currentRoom.GameType);
                 if (service != null)
                 {
                     currentRoom.GameData = service.DeserializeState(jsonElement);
                 }
            }

            _gameStateManager.MarkDirty(currentRoom.Code);
            NotifyStatsChanged();
            return currentRoom;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Undo Failed for room {RoomCode}", currentRoom.Code);
            return null;
        }
    }





}
