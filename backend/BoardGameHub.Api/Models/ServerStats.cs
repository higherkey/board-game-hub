namespace BoardGameHub.Api.Models;

public class ServerStats
{
    public int ActiveRooms { get; set; }
    public int TotalOnlinePlayers { get; set; }
    public TimeSpan Uptime { get; set; }
    public List<RoomSummary> Rooms { get; set; } = new();
}

public class RoomSummary
{
    public string Code { get; set; } = string.Empty;
    public string GlobalState { get; set; } = string.Empty; 
    public string GameType { get; set; } = string.Empty;
    public int PlayerCount { get; set; }
    public bool IsPublic { get; set; }
    public string HostName { get; set; } = string.Empty;
    // Details
    public int RoundNumber { get; set; }
    public int SettingsTimer { get; set; }
    public List<PlayerSummary> Players { get; set; } = new();
}

public class PlayerSummary
{
    public string Name { get; set; } = string.Empty;
    public bool IsHost { get; set; }
    public int Score { get; set; }
    public string? UserId { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
}
