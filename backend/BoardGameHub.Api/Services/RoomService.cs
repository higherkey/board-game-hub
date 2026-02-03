using BoardGameHub.Api.Models;
using System.Collections.Concurrent;
using System.Text.Json;
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace BoardGameHub.Api.Services;

public class RoomService : IRoomService
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

    private readonly Timer _statsTimer;
    private bool _statsDirty = false;

    public RoomService(
        IEnumerable<IGameService> gameServices,
        Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.AdminHub> adminHubContext,
        Microsoft.AspNetCore.SignalR.IHubContext<BoardGameHub.Api.Hubs.GameHub> gameHubContext,
        GameStateManager gameStateManager,
        ILogger<RoomService> logger)
    {
        _gameServices = gameServices;
        _adminHubContext = adminHubContext;
        _gameHubContext = gameHubContext;
        _gameStateManager = gameStateManager;
        _logger = logger;
        
        // Broadcast stats at most every 2 seconds
        _statsTimer = new Timer(async _ => await BroadcastStatsIfNeeded(), null, 2000, 2000);
    }

    private async Task BroadcastStatsIfNeeded()
    {
        if (_statsDirty)
        {
            _statsDirty = false;
            await _adminHubContext.Clients.All.SendAsync("StatsUpdated", GetServerStats());
        }
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

    public Room CreateRoom(string hostConnectionId, string hostName, bool isPublic, GameType gameType = GameType.Scatterbrain, string? userId = null, string? avatarUrl = null, bool isScreen = false)
    {
        var code = GenerateRoomCode();
        var room = new Room
        {
            Code = code,
            GameType = gameType,
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
            HostPlayerId = hostConnectionId
        };

        if (_rooms.TryAdd(code, room))
        {
            _logger.LogInformation("Room created: {Code} by {Host} (Type: {GameType})", code, hostName, gameType);
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

    public Room? JoinRoom(string code, string connectionId, string playerName, string? userId = null, string? avatarUrl = null, bool isScreen = false)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room))
        {
            _logger.LogWarning("Player {Player} failed to join room {Code}: Room not found", playerName, code);
            return null;
        }

        // 1. RECONNECTION LOGIC: Check if player exists by ID (UserId or GuestId)
        var existingPlayer = room.Players.FirstOrDefault(p => userId != null && p.UserId == userId);
        if (existingPlayer != null)
        {
            room.StateLock.Wait();
            try
            {
                if (existingPlayer.ConnectionId != connectionId)
                {
                    // If this player was the host, update the room's host pointers to the new connection ID
                    if (room.HostPlayerId == existingPlayer.ConnectionId) room.HostPlayerId = connectionId;
                    if (room.HostScreenId == existingPlayer.ConnectionId) room.HostScreenId = connectionId;

                    _connectionRoomMap.TryRemove(existingPlayer.ConnectionId, out _);
                }
                
                existingPlayer.ConnectionId = connectionId;
                existingPlayer.IsConnected = true; // Mark as connected
                existingPlayer.Name = playerName; // Update name in case it changed
                
                if (userId != null) existingPlayer.UserId = userId;
                if (avatarUrl != null) existingPlayer.AvatarUrl = avatarUrl;
                existingPlayer.IsScreen = isScreen;
            }
            finally
            {
                room.StateLock.Release();
            }

            _connectionRoomMap.TryAdd(connectionId, code);
            _gameStateManager.MarkDirty(room.Code);
            NotifyStatsChanged();
            return room;
        }

        // 2. NEW PLAYER LOGIC
        // If no Host Player or Screen Player, this player might fill the gap?
        // Actually, if a room exists, it already had a creator (HostScreen/Player).
        // But if they disconnected and the room is still alive, maybe we need to reassign?
        // Let's stick to the core requirement: creator starts as both.
        bool assignHost = false;
        
        room.StateLock.Wait();
        try
        {
            assignHost = !room.Players.Any(p => p.IsHost);
            
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
                UserId = userId,
                AvatarUrl = avatarUrl,
                IsScreen = isScreen
            };

            room.Players.Add(newPlayer);
        }
        finally
        {
            room.StateLock.Release();
        }
        _connectionRoomMap.TryAdd(connectionId, code);
        _logger.LogInformation("New player {Player} joined room {Code} (Host: {IsHost})", playerName, code, assignHost);
        
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
        _rooms.TryGetValue(code.ToUpper(), out var room);
        return room;
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
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (player != null)
                {
                    // SOFT DELETE: Just mark as disconnected
                    room.StateLock.Wait();
                    try
                    {
                        player.IsConnected = false;
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
            player.IsReady = forcedState ?? !player.IsReady;
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

        await room.StateLock.WaitAsync();
        try
        {
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

        if (actionType != "SUBMIT_STROKE") 
        {
            SaveState(room);
        }

        var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        if (service != null)
        {
            var action = new GameAction(actionType, payload);
            bool success = false;
            
            await room.StateLock.WaitAsync();
            try
            {
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
        _statsDirty = true;
    }

    private string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        var random = new Random();
        return new string(Enumerable.Repeat(chars, 4)
            .Select(s => s[random.Next(s.Length)]).ToArray());
    }

    // --- UNDO SYSTEM ---

    private void SaveState(Room room)
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

    public Room? RequestUndo(string code, string connectionId)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
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

             return PerformUndo(code); 
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

        return null;
    }

    public Room? SubmitUndoVote(string code, string connectionId, bool vote)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
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
            return PerformUndo(code);
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

    private Room? PerformUndo(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var currentRoom)) return null;
        if (currentRoom.StateHistory.Count == 0) return null;

        var snapshot = currentRoom.StateHistory.Pop();
        try 
        {
            var options = new JsonSerializerOptions { IncludeFields = true };
            var oldState = JsonSerializer.Deserialize<Room>(snapshot, options);
            
            if (oldState == null) return null;

            // RESTORE CRITICAL STATE
            // We want to keep the *current* network connections if possible, 
            // OR we assume the snapshot Players are the same people. 
            // The safest bet for "Game State" undo is to restore GameData, State, RoundNumber, Scores.
            // But KEEP the current Players list (so nobody gets kicked out connectivity-wise).
            // BUT, if the undo involves "Undo Player Joining", then we SHOULD restore Players list.
            // Given the complexity, let's restore EVERYTHING but try to merge ConnectionIds?
            // Actually, for a MVP local/friends game, restoring the whole object is fine. 
            // If a player joined AFTER the snapshot, and we undo, they effectively "un-join" in logic,
            // but their socket is still connected. They might get an error next time they try to act.
            // That's acceptable for "Undo". 
            
            var existingPlayers = currentRoom.Players; // Keep ref to current sockets

            // Overwrite properties
            currentRoom.GameType = oldState.GameType;
            currentRoom.State = oldState.State;
            currentRoom.RoundNumber = oldState.RoundNumber;
            currentRoom.GameData = oldState.GameData; // This is the big one (JsonElement or Object)
            currentRoom.RoundScores = oldState.RoundScores;
            currentRoom.PlayerAnswers = oldState.PlayerAnswers;
            
            // Re-assign generic GameData requires careful deserialization if it became JsonElement
            // The JsonSerializer might have turned `object` GameData into `JsonElement`.
            // We need to re-deserialize it to the specific type (JustOneState, ScatterbrainState, etc.).
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
            Console.WriteLine($"Undo Failed: {ex.Message}");
            return null;
        }
    }





}
