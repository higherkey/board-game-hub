namespace BoardGameHub.Api.Models;

public class ActiveRoom
{
    public string RoomCode { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public int SchemaVersion { get; set; } = 1;
    public long Revision { get; set; } = 0;
    public string RoomEnvelopeJson { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(4);
}
