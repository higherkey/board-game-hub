using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class JustOneService : IGameService
{
    public GameType GameType => GameType.JustOne;

    public void StartRound(Room room, GameSettings settings)
    {
        // Initialize JustOne State if needed
        var state = new JustOneState
        {
            Phase = JustOnePhase.ClueGiving,
            TargetWord = GetRandomWord(), // In real app, might come from a DB or list
            GuesserId = SelectGuesser(room)
        };
        room.GameData = state;
    }

    public void CalculateScores(Room room)
    {
        // Logic handled during game flow mostly, but can finalize here
        if (room.GameData is JustOneState state)
        {
            // If success, add score? Just One is cooperative usually.
            // We can track a global score or individual "successes".
            // For now, let's just mark it done.
        }
    }

    // Additional methods specific to Just One that will be called by GameHub/RoomService (genericized or casted)
    public void SubmitClue(Room room, string playerId, string clue)
    {
        if (room.GameData is not JustOneState state) return;
        if (state.Phase != JustOnePhase.ClueGiving) return;
        if (playerId == state.GuesserId) return; // Guesser can't give clues

        state.Clues[playerId] = clue.Trim().ToUpper();

        // Check if all (non-guesser) players have submitted
        var nonGuesserCount = room.Players.Count(p => p.ConnectionId != state.GuesserId);
        if (state.Clues.Count >= nonGuesserCount)
        {
             EliminateClues(state);
             state.Phase = JustOnePhase.Guessing;
        }
    }

    public void SubmitGuess(Room room, string guess)
    {
        if (room.GameData is not JustOneState state) return;
        if (state.Phase != JustOnePhase.Guessing) return;

        state.GuesserResponse = guess;
        bool isCorrect = string.Equals(guess, state.TargetWord, StringComparison.OrdinalIgnoreCase);
        
        state.Result = isCorrect ? "Success" : "Failure";
        state.Phase = JustOnePhase.Result;
    }

    private void EliminateClues(JustOneState state)
    {
        // Group by Normalized Clue
        var groups = state.Clues.GroupBy(c => c.Value).Where(g => g.Count() > 1);
        
        foreach(var group in groups)
        {
            state.InvalidClues.Add(group.Key);
        }
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
}

public class JustOneState
{
    public JustOnePhase Phase { get; set; }
    public string TargetWord { get; set; } = string.Empty;
    public string GuesserId { get; set; } = string.Empty;
    public Dictionary<string, string> Clues { get; set; } = new(); // PlayerId -> Clue
    public List<string> InvalidClues { get; set; } = new(); // Clues that were duplicates
    public string? GuesserResponse { get; set; }
    public string? Result { get; set; }
}

public enum JustOnePhase
{
    ClueGiving,
    Guessing,
    Result
}
