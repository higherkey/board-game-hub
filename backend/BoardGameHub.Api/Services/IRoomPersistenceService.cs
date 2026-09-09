using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class RoomSnapshot
{
    public string RoomCode { get; init; } = string.Empty;
    public string GameType { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    public int SchemaVersion { get; init; } = 1;
    public long Revision { get; init; }
    public string RoomEnvelopeJson { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; init; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; init; } = DateTime.UtcNow.AddHours(4);
}

public enum RoomPersistenceAction
{
    Upsert,
    Delete
}

public class RoomPersistenceMessage
{
    public RoomPersistenceAction Action { get; init; }
    public string RoomCode { get; init; } = string.Empty;
    public RoomSnapshot? Snapshot { get; init; }

    public static RoomPersistenceMessage Upsert(RoomSnapshot snapshot) => new()
    {
        Action = RoomPersistenceAction.Upsert,
        RoomCode = snapshot.RoomCode,
        Snapshot = snapshot
    };

    public static RoomPersistenceMessage Delete(string roomCode) => new()
    {
        Action = RoomPersistenceAction.Delete,
        RoomCode = roomCode
    };
}

public interface IRoomPersistenceService
{
    bool QueueSave(RoomSnapshot snapshot);
    bool QueueDelete(string roomCode);
    Task RehydrateActiveRoomsAsync(CancellationToken cancellationToken = default);
    Task CleanupExpiredRoomsAsync(CancellationToken cancellationToken = default);
    Task FlushAsync(CancellationToken cancellationToken = default);
}
