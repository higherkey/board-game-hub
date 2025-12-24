namespace BoardGameHub.Api.Models;

public class UniversalTranslatorState
{
    public List<string> WordChoices { get; set; } = new();
    public Dictionary<string, int> TokenLimits { get; set; } = new(); // TokenName -> Count
    public string TargetWord { get; set; } = string.Empty;
    public Dictionary<string, UniversalTranslatorRole> Roles { get; set; } = new(); // ConnectionId -> Role
    public List<TokenEntry> TokenHistory { get; set; } = new();
    public UniversalTranslatorPhase Phase { get; set; } = UniversalTranslatorPhase.Setup;
    public DateTime? TimerEndTime { get; set; }
    public DateTime? PhaseEndTime { get; set; }
    
    // Votes for "Who is J" or "Who is Empath"
    public Dictionary<string, string> Votes { get; set; } = new(); // VoterId -> AccusedId
    public string? Winner { get; set; } // "Crew" or "J"
    public GameEndReason EndReason { get; set; }
}

public class TokenEntry
{
    public string Token { get; set; } = string.Empty; // "Yes", "No", "Maybe", "Way Off", "So Close"
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public enum UniversalTranslatorRole
{
    Crew,
    MainComputer,
    J,
    Empath
}

public enum UniversalTranslatorPhase
{
    Setup,
    Day,          // Asking questions
    VotingForJ,   // Time ran out, Crew votes for J
    JGuessingEmpath, // Crew guessed word, J gets one shot at Empath
    Result
}

public enum GameEndReason
{
    None,
    WordGuessed,
    TimeExpired,
    JFound,
    JEscaped,
    EmpathAssassinated
}
