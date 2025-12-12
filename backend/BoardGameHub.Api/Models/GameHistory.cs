namespace BoardGameHub.Api.Models;

public class GameSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RoomCode { get; set; } = string.Empty;
    public string GameType { get; set; } = string.Empty; // e.g., "Scatterbrain", "Boggle"
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    
    // Determining if it was a public room
    public bool IsPublic { get; set; }
    
    // Navigation Property
    public List<GameSessionPlayer> Players { get; set; } = new();
}

public class GameSessionPlayer
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    
    public string GameSessionId { get; set; } = string.Empty;
    public GameSession? GameSession { get; set; }
    
    public string? UserId { get; set; } // Nullable for guest players
    public User? User { get; set; }
    
    public string DisplayName { get; set; } = string.Empty; // Snapshot of name used
    public int Score { get; set; }
    public int Rank { get; set; } // 1st, 2nd, etc.
}
