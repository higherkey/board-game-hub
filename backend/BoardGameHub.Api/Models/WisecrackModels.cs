using System.Text.Json.Serialization;

namespace BoardGameHub.Api.Models;

public enum WisecrackPhase
{
    Lobby,
    Writing,  // Players answering prompts
    Battling, // Head-to-head voting
    Result    // Final scores
}

public class WisecrackState
{
    public WisecrackPhase Phase { get; set; } = WisecrackPhase.Lobby;
    public int RoundNumber { get; set; } = 1;

    // The prompts assigned in the current game
    public List<WisecrackPromptAssignment> Assignments { get; set; } = new();

    // The answers submitted by players
    // Key: PromptId (or AssignmentId), Value: List of Answers (usually 2)
    public List<WisecrackAnswer> Answers { get; set; } = new();

    // Battles generated after answers are in
    public List<WisecrackBattle> Battles { get; set; } = new();
    public int CurrentBattleIndex { get; set; } = -1;

    public WisecrackBattle? CurrentBattle => 
        (CurrentBattleIndex >= 0 && CurrentBattleIndex < Battles.Count) ? Battles[CurrentBattleIndex] : null;
}

public class WisecrackPromptAssignment
{
    public string PromptId { get; set; } = Guid.NewGuid().ToString();
    public string Text { get; set; } = string.Empty;
    public List<string> AssignedPlayerIds { get; set; } = new(); // The 2 players who must answer this
}

public class WisecrackAnswer
{
    public string PromptId { get; set; } = string.Empty;
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty; // Cache name for display
    public string Text { get; set; } = string.Empty;
}

public class WisecrackBattle
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PromptText { get; set; } = string.Empty;
    
    public WisecrackAnswer AnswerA { get; set; } = new();
    public WisecrackAnswer AnswerB { get; set; } = new();

    public List<WisecrackVote> Votes { get; set; } = new();
    
    public bool IsFinished { get; set; }
    public string WinnerPlayerId { get; set; } = string.Empty; // "TIE" or PlayerId
}

public class WisecrackVote
{
    public string PlayerId { get; set; } = string.Empty;
    public int Choice { get; set; } // 0 for A, 1 for B
}
