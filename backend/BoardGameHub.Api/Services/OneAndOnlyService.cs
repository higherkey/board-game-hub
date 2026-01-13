using BoardGameHub.Api.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class OneAndOnlyService : IGameService
{
    private readonly ILogger<OneAndOnlyService> _logger;
    public GameType GameType => GameType.OneAndOnly;

    public OneAndOnlyService(ILogger<OneAndOnlyService> logger)
    {
        _logger = logger;
    }

    public Task StartRound(Room room, GameSettings settings)
    {
        _logger.LogInformation("Starting One and Only round in room {Code}", room.Code);
        // Initialize OneAndOnly State if needed
        var state = new OneAndOnlyState
        {
            Phase = OneAndOnlyPhase.ClueGiving,
            TargetWord = GetRandomWord(), // In real app, might come from a DB or list
            GuesserId = SelectGuesser(room)
        };
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not OneAndOnlyState state) return Task.CompletedTask;

        try
        {
            // Ensure RoundScores is initialized for all players (Reset to 0)
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            // One and Only implemention of scoring is currently minimal for cooperative rounds.
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in OneAndOnly CalculateScores: {ex.Message}");
        }
        return Task.CompletedTask;
    }

    // Additional methods specific to One & Only that will be called by GameHub/RoomService (genericized or casted)
    public void SubmitClue(Room room, string playerId, string clue)
    {
        if (room.GameData is not OneAndOnlyState state) return;
        if (state.Phase != OneAndOnlyPhase.ClueGiving) return;
        if (playerId == state.GuesserId) return; // Guesser can't give clues

        state.Clues[playerId] = clue.Trim().ToUpper();

        // Check if all (non-guesser) players have submitted
        var nonGuesserCount = room.Players.Count(p => p.ConnectionId != state.GuesserId);
        if (state.Clues.Count >= nonGuesserCount)
        {
             EliminateClues(state);
             state.Phase = OneAndOnlyPhase.Guessing;
        }
    }

    public void SubmitGuess(Room room, string? guess, bool isPass = false)
    {
        if (room.GameData is not OneAndOnlyState state) return;
        if (state.Phase != OneAndOnlyPhase.Guessing) return;

        if (isPass)
        {
            state.GuesserResponse = "[PASSED]";
            state.Result = "Passed";
            state.Phase = OneAndOnlyPhase.Result;
            state.TotalRoundsPlayed++;
            return;
        }

        state.GuesserResponse = guess;
        bool isCorrect = string.Equals(guess?.Trim() ?? "", state.TargetWord.Trim(), StringComparison.OrdinalIgnoreCase);
        
        state.Result = isCorrect ? "Success" : "Failure";
        state.Phase = OneAndOnlyPhase.Result;

        // Session Scoring
        if (isCorrect) state.CorrectRounds++;
        else state.FailedRounds++;
        
        state.TotalRoundsPlayed++;
    }

    private void EliminateClues(OneAndOnlyState state)
    {
        // 1. Image clues are never eliminated by text-logic (unless we had AI vision, but for now they are unique by nature usually or not handled)
        // Actually, we should probably only compare text clues.
        
        var textClues = state.Clues.Where(c => !c.Value.StartsWith("data:image")).ToList();
        
        // Group by Normalized Clue (Robust logic: trim, lowercase, plurals-ish)
        // Simple plural logic: if both "Apple" and "Apples" exist, eliminate both.
        
        var normalizedClues = textClues.Select(c => new { 
            Original = c.Value, 
            Normalized = NormalizeClue(c.Value),
            Key = c.Key
        }).ToList();

        var groups = normalizedClues.GroupBy(c => c.Normalized).ToList();
        
        foreach(var group in groups)
        {
            if (group.Count() > 1)
            {
                foreach(var item in group)
                {
                    state.InvalidClues.Add(item.Original);
                }
            }
        }
    }

    private string NormalizeClue(string clue)
    {
        var normalized = clue.Trim().ToLowerInvariant();
        // Very basic plural handling: remove trailing 's'
        if (normalized.Length > 3 && normalized.EndsWith("s"))
        {
            normalized = normalized.Substring(0, normalized.Length - 1);
        }
        return normalized;
    }

    private string SelectGuesser(Room room)
    {
        // Simple rotation or random
        // For simplicity: Random or Round robin based on RoundNumber
        if (room.Players.Count == 0) return "";
        int index = room.RoundNumber % room.Players.Count;
        return room.Players[index].ConnectionId; 
    }

    private string GetRandomWord()
    {
        var words = new[] { "Apple", "Beach", "Computer", "Doctor", "Elephant", "Football", "Guitar", "House", "Igloo", "Jungle" };
        return words[new Random().Next(words.Length)];
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room == null || action == null) return Task.FromResult(false);

        if (action.Type == "SUBMIT_CLUE" && action.Payload.HasValue)
        {
            if (action.Payload.Value.TryGetProperty("clue", out var prop))
            {
                SubmitClue(room, connectionId, prop.GetString() ?? "");
                return Task.FromResult(true);
            }
        }
        else if (action.Type == "SUBMIT_GUESS" && action.Payload.HasValue)
        {
            if (action.Payload.Value.TryGetProperty("guess", out var prop))
            {
                if (room.GameData is OneAndOnlyState state && state.GuesserId != connectionId) return Task.FromResult(false);
                
                bool isPass = action.Payload.Value.TryGetProperty("isPass", out var passProp) && passProp.GetBoolean();
                SubmitGuess(room, prop.GetString(), isPass);
                return Task.FromResult(true);
            }
        }
        return Task.FromResult(false);
    }

    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
    }

    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<OneAndOnlyState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new OneAndOnlyState();
    }
}

public class OneAndOnlyState
{
    public OneAndOnlyPhase Phase { get; set; }
    public string TargetWord { get; set; } = string.Empty;
    public string GuesserId { get; set; } = string.Empty;
    public Dictionary<string, string> Clues { get; set; } = new(); // PlayerId -> Clue
    public List<string> InvalidClues { get; set; } = new(); // Clues that were duplicates
    public string? GuesserResponse { get; set; }
    public string? Result { get; set; }

    // Session Stats
    public int CorrectRounds { get; set; }
    public int FailedRounds { get; set; }
    public int TotalRoundsPlayed { get; set; }
}

public enum OneAndOnlyPhase
{
    ClueGiving,
    Guessing,
    Result
}
