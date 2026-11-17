namespace BoardGameHub.Api.Models;

public class YachtState
{
    public string Phase { get; set; } = "Playing";
    public List<string> PlayerOrder { get; set; } = new();
    public Dictionary<string, YachtScorecard> Scorecards { get; set; } = new();
    public string ActivePlayerId { get; set; } = string.Empty;
    public int TurnNumber { get; set; } = 1;
    public int RollsUsed { get; set; }
    public int[] Dice { get; set; } = new int[5];
    public bool[] Held { get; set; } = new bool[5];
    // Server-calculated legal choices and scores; clients never submit point values.
    public Dictionary<string, int> AvailableScores { get; set; } = new();
    public List<string> WinnerIds { get; set; } = new();
    public string LastMove { get; set; } = string.Empty;
}

public class YachtScorecard
{
    public string PlayerName { get; set; } = string.Empty;
    public Dictionary<string, int> Categories { get; set; } = new();
    public int YachtBonus { get; set; }
    public int UpperSubtotal { get; set; }
    public int UpperBonus { get; set; }
    public int Total { get; set; }
}
