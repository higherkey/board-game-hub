using BoardGameHub.Api.Models;
using System.Collections.Concurrent;

namespace BoardGameHub.Api.Services;

public class RoomService
{
    // Concurrent dictionary for thread safety
    private readonly ConcurrentDictionary<string, Room> _rooms = new();
    private readonly IEnumerable<IGameService> _gameServices;

    public RoomService(IEnumerable<IGameService> gameServices)
    {
        _gameServices = gameServices;
    }

    private JustOneService? GetJustOneService() => _gameServices.FirstOrDefault(s => s.GameType == GameType.JustOne) as JustOneService;

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

        _rooms.TryAdd(code, room);
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
        return room;
    }

    public Room? GetRoom(string code)
    {
        _rooms.TryGetValue(code.ToUpper(), out var room);
        return room;
    }

    public void RemovePlayer(string connectionId)
    {
        // Inefficient for large scale, but fine for POC
        foreach (var room in _rooms.Values)
        {
            var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (player != null)
            {
                room.Players.Remove(player);
                if (room.Players.Count == 0)
                {
                    _rooms.TryRemove(room.Code, out _);
                }
                break;
            }
        }
    }

    public void TerminateRoom(string code)
    {
        _rooms.TryRemove(code.ToUpper(), out _);
    }

    public Room? StartGame(string code, GameSettings? settings = null)
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
            service.StartRound(room, room.Settings);
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

    public Room? SubmitAnswers(string code, string connectionId, List<string> answers)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        // Store answers
        room.PlayerAnswers[connectionId] = answers;
        
        return room;
    }

    public Room? SubmitClue(string code, string connectionId, string clue)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;
        
        var service = GetJustOneService();
        service?.SubmitClue(room, connectionId, clue);
        
        return room;
    }

    public Room? SubmitGuess(string code, string connectionId, string guess)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var service = GetJustOneService();
        service?.SubmitGuess(room, guess);

        return room;
    }

    // Call this entering the "Review" phase
    public Room? CalculateRoundScores(string code)
    {
        if (!_rooms.TryGetValue(code.ToUpper(), out var room)) return null;

        var service = _gameServices.FirstOrDefault(s => s.GameType == room.GameType);
        if (service != null)
        {
            service.CalculateScores(room);
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
        // Only allow updating settings in Lobby? Or anytime?
        room.Settings = settings;
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
                    UserId = p.UserId
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
}
