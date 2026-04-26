using System.Text.Json.Serialization;

namespace BoardGameHub.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum FarklePhase
{
    Rolling,    // Dice are rolling (animation state)
    Picking,    // Waiting for player to select scoring dice
    Farkled,    // No scoring dice, turn ending automatically
    Banked,     // Player decided to bank, turn ending
    GameOver    // Someone reached 10,000 and the final round is over
}

public class FarkleDie
{
    public int Value { get; set; }
    public bool IsHeld { get; set; }      // Dice that were scoring in PREVIOUS rolls of this turn
    public bool IsScoring { get; set; }   // Dice that are scoring in the CURRENT roll
    public bool IsReserved { get; set; }  // Player has selected these to keep
}

public class FarklePlayerState
{
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public int LastTurnScore { get; set; }
    public bool IsFinalTurn { get; set; } // Set when a player reaches 10,000
}

public class FarkleState
{
    public string RoomCode { get; set; } = string.Empty;
    public string ActivePlayerId { get; set; } = string.Empty;
    public int CurrentTurnScore { get; set; }
    public List<FarkleDie> Dice { get; set; } = new();
    public FarklePhase Phase { get; set; } = FarklePhase.Picking;
    
    // ConnectionId -> PlayerState
    public Dictionary<string, FarklePlayerState> PlayerStates { get; set; } = new();

    public string? WinningPlayerId { get; set; }
}
