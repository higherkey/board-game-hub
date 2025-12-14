using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class SymbologyState
{
    public string CurrentWord { get; set; } = string.Empty;
    public string ActivePlayerId { get; set; } = string.Empty;
    public List<SymbologyMarker> Markers { get; set; } = new();
    public Dictionary<string, int> Scores { get; set; } = new();
    
    // For verifying guesses
    public bool IsRoundActive { get; set; } = false;
    public List<string> GuessLog { get; set; } = new();
}

public class SymbologyMarker
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Icon { get; set; } = string.Empty; // The Emoji char or ID
    public string MarkerType { get; set; } = "Main"; // Main, Sub, etc.
    public string Color { get; set; } = "green"; 
}

public class SymbologyGameService : IGameService
{
    public GameType GameType => GameType.Symbology;

    private readonly Random _random = new();
    
    // Basic word list for now
    private readonly List<string> _words = new()
    {
        "The Avengers", "Titanic", "Harry Potter", "Star Wars", "The Lion King",
        "Coffee", "Smartphone", "Airplane", "Library", "Hospital",
        "Soccer", "Basketball", "Swimming", "Chess", "Video Games",
        "Elvis Presley", "Albert Einstein", "Marilyn Monroe", "Michael Jackson",
        "New York", "Paris", "Tokyo", "London", "Sydney"
    };

    public void StartRound(Room room, GameSettings settings)
    {
        // 1. Setup State
        var state = new SymbologyState();
        
        // 2. Select Word
        state.CurrentWord = _words[_random.Next(_words.Count)];
        
        // 3. Assign Active Player
        // Determine round robin or random? Let's go Round Robin based on existing player order if tracked, 
        // OR just random/next for simplicity in this MVP.
        // Let's use RoundNumber to cycle through players.
        if (room.Players.Any())
        {
            var playerIndex = room.RoundNumber % room.Players.Count;
            state.ActivePlayerId = room.Players[playerIndex].ConnectionId;
        }

        state.IsRoundActive = true;
        room.GameData = state;
    }

    public void CalculateScores(Room room)
    {
        // Scores are updated in real-time during correct guess usually, 
        // but this method is called at round end.
        // We can finalize things here if needed.
    }

    public bool PlaceMarker(Room room, string playerId, string icon, string markerType, string color)
    {
        if (room.GameData is not SymbologyState state) return false;
        if (!state.IsRoundActive) return false;
        if (state.ActivePlayerId != playerId) return false;

        var marker = new SymbologyMarker
        {
            Icon = icon,
            MarkerType = markerType,
            Color = color
        };
        state.Markers.Add(marker);
        
        return true;
    }

    public bool RemoveMarker(Room room, string playerId, string markerId)
    {
        if (room.GameData is not SymbologyState state) return false;
        if (!state.IsRoundActive) return false;
        if (state.ActivePlayerId != playerId) return false;

        var marker = state.Markers.FirstOrDefault(m => m.Id == markerId);
        if (marker != null)
        {
            state.Markers.Remove(marker);
            return true;
        }
        return false;
    }
    
    public bool SubmitGuess(Room room, string playerId, string guess)
    {
        if (room.GameData is not SymbologyState state) return false;
        if (!state.IsRoundActive) return false;
        if (state.ActivePlayerId == playerId) return false; // Active player can't guess

        // Log guess
        state.GuessLog.Add($"{room.Players.FirstOrDefault(p => p.ConnectionId == playerId)?.Name ?? "Unknown"}: {guess}");

        // Check guess (Clean up comparison)
        if (string.Equals(guess.Trim(), state.CurrentWord, StringComparison.OrdinalIgnoreCase))
        {
            // Correct!
            // Award points
            AddScore(state, playerId, 10);
            AddScore(state, state.ActivePlayerId, 10); // Active player also gets points

            state.IsRoundActive = false; // End round logic triggered by this result
            return true;
        }

        return false;
    }

    private void AddScore(SymbologyState state, string playerId, int points)
    {
        if (!state.Scores.ContainsKey(playerId))
            state.Scores[playerId] = 0;
        state.Scores[playerId] += points;
    }
}
