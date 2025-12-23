using BoardGameHub.Api.Models;
using System.Collections.Concurrent;

using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class RoomService
{
    // Concurrent dictionary for thread safety
    private readonly ConcurrentDictionary<string, Room> _rooms = new();
    // Map ConnectionId -> RoomCode for O(1) lookup
    private readonly ConcurrentDictionary<string, string> _connectionRoomMap = new();
    private readonly IEnumerable<IGameService> _gameServices;

    public RoomService(IEnumerable<IGameService> gameServices)
    {
        _gameServices = gameServices;
    }

    public T? GetGameService<T>(GameType type) where T : class
    {
        return _gameServices.FirstOrDefault(s => s.GameType == type) as T;
    }

    private OneAndOnlyService? GetOneAndOnlyService() => _gameServices.FirstOrDefault(s => s.GameType == GameType.OneAndOnly) as OneAndOnlyService;

    public Room? PromoteToHost(string code, string connectionId)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var newHost = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (newHost == null) return null;

        foreach (var p in room.Players) p.IsHost = false;
        newHost.IsHost = true;

        return room;
    }

    public Room CreateRoom(string hostConnectionId, string hostName, bool isPublic, GameType gameType = GameType.Scatterbrain, string? userId = null, string? avatarUrl = null)
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
                    AvatarUrl = avatarUrl
                }
            },
            IsPublic = isPublic
        };

        if (_rooms.TryAdd(code, room))
        {
            _connectionRoomMap.TryAdd(hostConnectionId, code);
        }
        return room;
    }

    public List<Room> GetPublicRooms()
    {
        return _rooms.Values
            .Where(r => r.IsPublic && r.State == GameState.Lobby)
            .ToList();
    }

    public Room? JoinRoom(string code, string connectionId, string playerName, string? userId = null, string? avatarUrl = null)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room))
        {
            return null;
        }

        // Removed strict State check to allow rejoining or verifying in-game joining if desired, 
        // but for now keeping basic check if needed. 
        // Actually, let's allow joining if it's lobby, or maybe handle reconnects later.
        if (room.State != GameState.Lobby)
        {
             // Optional: Block joining mid-game for now
             return null;
        }

        var newPlayer = new Player
        {
            ConnectionId = connectionId,
            Name = playerName,
            IsHost = false,
            UserId = userId,
            AvatarUrl = avatarUrl
        };

        room.Players.Add(newPlayer);
        _connectionRoomMap.TryAdd(connectionId, code);
        
        return room;
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
                    player.Name = newName;
                    return room;
                }
            }
        }
        return null;
    }

    public void RemovePlayer(string connectionId)
    {
        if (_connectionRoomMap.TryRemove(connectionId, out var roomCode))
        {
            if (_rooms.TryGetValue(roomCode, out var room))
            {
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (player != null)
                {
                    room.Players.Remove(player);
                    if (room.Players.Count == 0)
                    {
                        _rooms.TryRemove(room.Code, out _);
                        // Room died, cleanup?
                        // The map entries for other players will be "orphaned" if we don't clean them or if they strictly disconnect.
                        // Ideally we loop and remove them, but they might already be gone.
                        // For now this is fine.
                    }
                }
            }
        }
    }

    public void TerminateRoom(string code)
    {
        _rooms.TryRemove(code.ToUpper(), out _);
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

        var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        if (service != null)
        {
            await service.StartRound(room, room.Settings);
        }

        // Set Timer
        room.RoundEndTime = DateTime.UtcNow.AddSeconds(room.Settings.TimerDurationSeconds);
        
        return room;
    }

    public Room? PauseGame(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        if (room.IsPaused || !room.RoundEndTime.HasValue) return null;

        room.IsPaused = true;
        room.TimeRemainingWhenPaused = room.RoundEndTime.Value - DateTime.UtcNow;
        return room;
    }

    public Room? ResumeGame(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        if (!room.IsPaused || !room.TimeRemainingWhenPaused.HasValue) return null;

        room.IsPaused = false;
        room.RoundEndTime = DateTime.UtcNow.Add(room.TimeRemainingWhenPaused.Value);
        room.TimeRemainingWhenPaused = null;
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
            bool success = await service.HandleAction(room, action, connectionId);
            if (success) return room;
        }
        return null;
    }

    public async Task<Room?> CalculateRoundScores(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        if (service != null)
        {
            await service.CalculateScores(room);
        }
        
        // Change state to Finished
        room.State = GameState.Finished; 
        
        return room;
    }

    public Room? SetGameType(string code, GameType gameType)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        // Only allow changing game type in Lobby or Finished state?
        // if (room.State != GameState.Lobby && room.State != GameState.Finished) return null;

        room.GameType = gameType;
        // Clear votes if game type is manually force set? 
        room.NextGameVotes.Clear();
        
        return room;
    }

    public Room? UpdateSettings(string code, GameSettings settings)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        room.Settings = settings;
        return room;
    }

    public Room? UpdateUndoSettings(string code, UndoSettings settings)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        room.UndoSettings = settings;
        return room;
    }

    public Room? VoteNextGame(string code, string playerId, GameType vote)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        room.NextGameVotes[playerId] = vote;
        
        // Check if everyone voted? Or just let them vote and host decides? 
        // For now, logic: if everyone voted and majority wins, OR just store votes.
        // User request: "vote on which game to play next".
        // Let's just store it for now. The Frontend can show the tally. 
        // The host or the system can trigger the switch.
        
        // Auto-switch if unanimous? Maybe later.
        return room;
    }

    public ServerStats GetServerStats()
    {
        var activeRooms = _rooms.Values.ToList();
        var stats = new ServerStats
        {
            ActiveRooms = activeRooms.Count,
            TotalOnlinePlayers = activeRooms.Sum(r => r.Players.Count),
            Uptime = DateTime.UtcNow - System.Diagnostics.Process.GetCurrentProcess().StartTime.ToUniversalTime(),
            Rooms = activeRooms.Select(r => new RoomSummary
            {
                Code = r.Code,
                GlobalState = r.State.ToString(),
                GameType = r.GameType.ToString(),
                PlayerCount = r.Players.Count,
                IsPublic = r.IsPublic,
                HostName = r.Players.FirstOrDefault(p => p.IsHost)?.Name ?? "Unknown",
                RoundNumber = r.RoundNumber,
                SettingsTimer = r.Settings?.TimerDurationSeconds ?? 0,
                Players = r.Players.Select(p => new PlayerSummary 
                {
                    Name = p.Name,
                    IsHost = p.IsHost,
                    Score = p.Score,
                    UserId = p.UserId,
                    ConnectionId = p.ConnectionId
                }).ToList()
            }).ToList()
        };

        return stats;
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
            // Return room to update UI (remove vote modal)
        }

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
            // We need to re-deserialize it to the specific type (JustOneState, BoggleState).
            if (currentRoom.GameData is JsonElement jsonElement)
            {
                 var service = _gameServices.FirstOrDefault(s => s.GameType == currentRoom.GameType);
                 if (service != null)
                 {
                     currentRoom.GameData = service.DeserializeState(jsonElement);
                 }
            }

            return currentRoom;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Undo Failed: {ex.Message}");
            return null;
        }
    }





}
