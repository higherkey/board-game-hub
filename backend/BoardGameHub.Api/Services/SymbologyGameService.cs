using BoardGameHub.Api.Models;
using System.Text.Json;

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

    public Task StartRound(Room room, GameSettings settings)
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
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not SymbologyState state) return Task.CompletedTask;

        try
        {
            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            // Sync state scores to room player scores and round scores
            foreach (var scoreEntry in state.Scores)
            {
                var playerId = scoreEntry.Key;
                var points = scoreEntry.Value;

                if (room.RoundScores.ContainsKey(playerId)) 
                    room.RoundScores[playerId] += points;

                var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
                if (player != null) player.Score += points;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Symbology CalculateScores: {ex.Message}");
        }
        return Task.CompletedTask;
    }

    public Task<bool> PlaceMarker(Room room, string playerId, string icon, string markerType, string color)
    {
        if (room == null || room.GameData is not SymbologyState state) return Task.FromResult(false);
        if (!state.IsRoundActive) return Task.FromResult(false);
        if (state.ActivePlayerId != playerId) return Task.FromResult(false);

        var marker = new SymbologyMarker
        {
            Icon = icon,
            MarkerType = markerType,
            Color = color
        };
        state.Markers.Add(marker);
        
        return Task.FromResult(true);
    }

    public Task<bool> RemoveMarker(Room room, string playerId, string markerId)
    {
        if (room == null || room.GameData is not SymbologyState state) return Task.FromResult(false);
        if (!state.IsRoundActive) return Task.FromResult(false);
        if (state.ActivePlayerId != playerId) return Task.FromResult(false);

        var marker = state.Markers.FirstOrDefault(m => m.Id == markerId);
        if (marker != null)
        {
            state.Markers.Remove(marker);
            return Task.FromResult(true);
        }
        return Task.FromResult(false);
    }
    
    public Task<bool> SubmitGuess(Room room, string playerId, string guess)
    {
        if (room == null || room.GameData is not SymbologyState state) return Task.FromResult(false);
        if (!state.IsRoundActive) return Task.FromResult(false);
        if (state.ActivePlayerId == playerId) return Task.FromResult(false);

        // Log guess
        state.GuessLog.Add($"{room.Players.FirstOrDefault(p => p.ConnectionId == playerId)?.Name ?? "Unknown"}: {guess}");

        // Check guess
        if (string.Equals(guess.Trim(), state.CurrentWord, StringComparison.OrdinalIgnoreCase))
        {
            // Correct!
            AddScore(state, playerId, 10);
            AddScore(state, state.ActivePlayerId, 10);

            state.IsRoundActive = false;
            return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }

    private void AddScore(SymbologyState state, string playerId, int points)
    {
        if (!state.Scores.ContainsKey(playerId))
            state.Scores[playerId] = 0;
        state.Scores[playerId] += points;
    }

    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
    }

    public async Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room == null || action == null) return false;

        if (action.Type == "PLACE_MARKER" && action.Payload.HasValue)
        {
             var p = action.Payload.Value;
             if (p.TryGetProperty("icon", out var icon) && 
                  p.TryGetProperty("markerType", out var type) &&
                  p.TryGetProperty("color", out var color))
             {
                 if(await PlaceMarker(room, connectionId, icon.GetString()??"", type.GetString()??"", color.GetString()??""))
                     return true;
             }
        }
        else if (action.Type == "REMOVE_MARKER" && action.Payload.HasValue)
        {
             if(action.Payload.Value.TryGetProperty("markerId", out var id))
             {
                 if(await RemoveMarker(room, connectionId, id.GetString()??""))
                    return true;
             }
        }
        else if (action.Type == "SUBMIT_GUESS" && action.Payload.HasValue)
        {
             if(action.Payload.Value.TryGetProperty("guess", out var guess))
             {
                 if(await SubmitGuess(room, connectionId, guess.GetString()??""))
                    return true;
             }
        }
        return false;
    }
    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<SymbologyState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new SymbologyState();
    }
}
