namespace BoardGameHub.Api.Models;

using BoardGameHub.Api.Services;

public class Player
{
    public string ConnectionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool IsHost { get; set; }
    public bool IsConnected { get; set; } = true;
    
    // Optional Auth Info
    public string? UserId { get; set; }
    public string? AvatarUrl { get; set; }
}


public class Room
{
    public string Code { get; set; } = string.Empty;
    public List<Player> Players { get; set; } = new();
    public GameState State { get; set; } = GameState.Lobby;
    public GameSettings Settings { get; set; } = new();

    public GameType GameType { get; set; } = GameType.None; 
    public bool IsPublic { get; set; } = false;

    public string? HostScreenId { get; set; }
    public string? HostPlayerId { get; set; }

    // Generic Game State
    public object? GameData { get; set; }
    public int RoundNumber { get; set; } = 0;
    
    // Voting
    // PlayerId -> Voted GameType
    public Dictionary<string, GameType> NextGameVotes { get; set; } = new();

    // Timer State
    public DateTime? RoundEndTime { get; set; }
    public bool IsPaused { get; set; }
    public TimeSpan? TimeRemainingWhenPaused { get; set; }

    // Scoring & Answers
    // PlayerId -> List of Answers (index matches Categories)
    public Dictionary<string, List<string>> PlayerAnswers { get; set; } = new();
    
    // PlayerId -> Round Score
    // PlayerId -> Round Score
    public Dictionary<string, int> RoundScores { get; set; } = new();

    // Undo System
    // Stack of JSON snapshots to revert to. Restrict to last 10?
    [System.Text.Json.Serialization.JsonIgnore]
    public Stack<string> StateHistory { get; set; } = new();
    public UndoSettings UndoSettings { get; set; } = new();
    
    public UndoVote? CurrentVote { get; set; }
}

public class UndoSettings
{
    public bool AllowVoting { get; set; } = true;    // If true, players can request undo -> vote
    public bool HostOnly { get; set; } = false;      // If true, only host can undo (no vote needed)
}

public class UndoVote
{
    public string InitiatorId { get; set; } = string.Empty;
    public string InitiatorName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // PlayerId -> Bool (True=Yes, False=No)
    public Dictionary<string, bool> Votes { get; set; } = new();
}

public class GameSettings
{
    public int TimerDurationSeconds { get; set; } = 60;
    public int BoardSize { get; set; } = 4;
    public ScatterbrainData.LetterMode LetterMode { get; set; } = ScatterbrainData.LetterMode.Normal;
    public int? ListId { get; set; } // Null = Random
    public List<string> CustomCategories { get; set; } = new(); // If populated, use this
}

public enum GameState
{
    Lobby,
    Playing,
    Finished
}

public enum GameType
{
    None = 0,
    Scatterbrain = 1,
    Babble = 2,
    OneAndOnly = 3,
    BreakingNews = 4,
    Deepfake = 5,
    Poppycock = 6,
    Pictophone = 7,
    UniversalTranslator = 8,
    Symbology = 9,
    Wisecrack = 10,
    SushiTrain = 11,
    GreatMinds = 12,
    NomDeCode = 13,
    Warships = 14,
    FourInARow = 15,
    Checkers = 16
}
