using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

/// <summary>
/// Envelope persisted to PostgreSQL for room state hydration across process restarts.
/// Kept separate from the EF <c>ActiveRoom</c> entity to avoid leaking the DB schema into the domain.
/// </summary>
public class RoomStateEnvelope
{
    public int SchemaVersion { get; set; } = 1;
    public string Code { get; set; } = string.Empty;
    public long Revision { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(4);
    public GameType GameType { get; set; } = GameType.None;
    public GameState State { get; set; } = GameState.Lobby;
    public GameSettings Settings { get; set; } = new();
    public bool IsPublic { get; set; }
    public string? HostScreenId { get; set; }
    public string? HostPlayerId { get; set; }
    public string? CreatorConnectionId { get; set; }
    public bool IsHostOverride { get; set; }
    public int RoundNumber { get; set; }
    public Dictionary<string, GameType> NextGameVotes { get; set; } = new();
    public DateTime? RoundEndTime { get; set; }
    public bool IsPaused { get; set; }
    public TimeSpan? TimeRemainingWhenPaused { get; set; }
    public Dictionary<string, List<string>> PlayerAnswers { get; set; } = new();
    public Dictionary<string, int> RoundScores { get; set; } = new();
    public List<PersistedPlayer> Players { get; set; } = new();
    public UndoSettings UndoSettings { get; set; } = new();
    public UndoVote? CurrentVote { get; set; }
    public JsonElement? RawGameData { get; set; }
}

/// <summary>
/// Persistence projection of <see cref="Player"/> that captures <c>SessionId</c>
/// without leaking it into SignalR broadcast JSON (where <c>Player.SessionId</c> carries <c>[JsonIgnore]</c>).
/// </summary>
public class PersistedPlayer
{
    public string ConnectionId { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool IsHost { get; set; }
    public bool IsConnected { get; set; } = true;
    public bool IsReady { get; set; }
    public bool IsScreen { get; set; }
    public string? UserId { get; set; }
    public string? AvatarUrl { get; set; }
}

/// <summary>
/// Serializes and deserializes <see cref="Room"/> to/from the JSON envelope stored in <c>ActiveRooms.RoomEnvelopeJson</c>.
/// </summary>
public interface IRoomStateSerializer
{
    string Serialize(Room room);
    Room Deserialize(string json);
    Room Deserialize(string json, IEnumerable<IGameService> gameServices);
}
