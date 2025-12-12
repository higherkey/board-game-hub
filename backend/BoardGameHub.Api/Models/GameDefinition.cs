using System.ComponentModel.DataAnnotations;

namespace BoardGameHub.Api.Models;

public enum GameStatus
{
    Deployed,
    Testing,
    Backlog
}

public class GameDefinition
{
    [Key]
    public string Id { get; set; } = string.Empty; // e.g. "Scatterbrain"
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty; // Emoji or URL
    public string Description { get; set; } = string.Empty;
    public GameStatus Status { get; set; }
    
    // This maps to the GameType enum used in Room logic, but stored as string or int? 
    // For simplicity, let's keep it as string ID matching the Room GameType, 
    // or we can add a specific property if needed. 
    // The 'Id' itself can serve as the unique key used in code.
}
