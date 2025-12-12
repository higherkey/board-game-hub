namespace BoardGameHub.Api.Models;

using BoardGameHub.Api.Services;

public class Player
{
    public string ConnectionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public bool IsHost { get; set; }
    
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

    // Generic Game State (Holds ScatterbrainState or BoggleState)
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
    public Dictionary<string, int> RoundScores { get; set; } = new();
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
    Boggle = 2,
    JustOne = 3
}
