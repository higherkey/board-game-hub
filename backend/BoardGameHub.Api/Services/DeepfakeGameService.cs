using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class DeepfakeState
{
    public string Prompt { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string AiConnectionId { get; set; } = string.Empty;
    public List<DeepfakeStroke> Strokes { get; set; } = new();
    
    // Turn Management
    public List<string> PlayerOrder { get; set; } = new(); // ConnectionIds
    public int CurrentTurnIndex { get; set; } = 0;
    public int TotalRounds { get; set; } = 2; // How many times we cycle through everyone
    
    public DeepfakePhase Phase { get; set; } = DeepfakePhase.Drawing;
    
    // Voting
    // PlayerId -> Voted PlayerId (Who they think is AI)
    public Dictionary<string, string> Votes { get; set; } = new(); 
    public bool AiCaught { get; set; } = false;
    public bool AiWon { get; set; } = false;
}

public class DeepfakeStroke
{
    public string OwnerId { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    // Basic representation of a path: "M 10 10 L 20 20 ..." or similar JSON string
    // Or a list of points. Let's send raw SVG path data or Point list JSON string.
    public string PathData { get; set; } = string.Empty; 
}

public enum DeepfakePhase
{
    Drawing,
    Voting,
    Results
}

public class DeepfakeGameService : IGameService
{
    public GameType GameType => GameType.Deepfake;

    private readonly Random _random = new();

    // In a real app, database of prompts
    private readonly List<(string Category, string Prompt)> _prompts = new()
    {
        ("Animals", "Giraffe"),
        ("Animals", "Elephant"),
        ("Animals", "Penguin"),
        ("Landmarks", "Eiffel Tower"),
        ("Landmarks", "Pyramids"),
        ("Landmarks", "Statue of Liberty"),
        ("Objects", "Bicycle"),
        ("Objects", "Guitar"),
        ("Objects", "Chair"),
        ("Food", "Pizza"),
        ("Food", "Ice Cream"),
        ("Food", "Burger")
    };

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new DeepfakeState();
        
        // 1. Assign "Faker"
        // Random player
        if (room.Players.Any())
        {
            var fakerIndex = new Random().Next(room.Players.Count);
            state.AiConnectionId = room.Players[fakerIndex].ConnectionId;
        }

        // 2. Select Prompt (Category + Item)
        state.Prompt = GetRandomPrompt();

        state.Phase = DeepfakePhase.Drawing;
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        // Handled via "SubmitVote" really, but here we can finalize
        // Points already added during voting resolution.
        return Task.CompletedTask;
    }

    private string GetRandomPrompt()
    {
        var promptData = _prompts[_random.Next(_prompts.Count)];
        return promptData.Prompt;
    }

    public bool SubmitStroke(Room room, string connectionId, string pathData, string color)
    {
        if (room.GameData is not DeepfakeState state) return false;
        if (state.Phase != DeepfakePhase.Drawing) return false;

        // Check it's this player's turn
        var currentPlayerId = state.PlayerOrder[state.CurrentTurnIndex % state.PlayerOrder.Count];
        if (currentPlayerId != connectionId) return false;

        // Add Stroke
        state.Strokes.Add(new DeepfakeStroke
        {
            OwnerId = connectionId,
            Color = color,
            PathData = pathData
        });

        // Advance Turn
        state.CurrentTurnIndex++;

        // Check if Game Over (Round Limit Reached)
        // Total turns = Players * 2
        var totalTurns = state.PlayerOrder.Count * state.TotalRounds;
        if (state.CurrentTurnIndex >= totalTurns)
        {
            state.Phase = DeepfakePhase.Voting;
        }

        return true;
    }

    public bool SubmitVote(Room room, string voterId, string accusedId)
    {
        if (room.GameData is not DeepfakeState state) return false;
        if (state.Phase != DeepfakePhase.Voting) return false;

        // AI can vote too (to bluff), or maybe not? 
        // Typically everyone votes.
        state.Votes[voterId] = accusedId;

        // Check if everyone has voted
        if (state.Votes.Count >= room.Players.Count)
        {
            DetermineVoteResult(state, room);
        }

        return true;
    }

    private void DetermineVoteResult(DeepfakeState state, Room room)
    {
        // Count votes
        var voteCounts = state.Votes.GroupBy(v => v.Value)
                                    .ToDictionary(g => g.Key, g => g.Count());
        
        // Find most voted
        var maxVotes = voteCounts.Values.Max();
        var mostVotedIds = voteCounts.Where(x => x.Value == maxVotes).Select(x => x.Key).ToList();

        // If tie, or AI not caught?
        // Simplest Rule: Majority required. If tie, AI escapes? 
        // Or if ANY of the top voted is AI, they are caught?
        // Let's say: If the AI has the strictly highest votes (or tied for highest), they are caught.
        
        if (mostVotedIds.Contains(state.AiConnectionId))
        {
            // AI Caught!
            state.AiCaught = true;
            // Now AI has a chance to guess (handled in client by showing input)
            // Phase stays Voting? Or move to Results but allow Guest input?
            // Actually, if AI Caught, we wait for their guess.
            // If AI NOT Caught, Game Over -> AI Wins.
        }
        else
        {
            // AI Escaped!
            state.AiCaught = false;
            state.AiWon = true; 
            state.Phase = DeepfakePhase.Results;
        }
    }

    public bool SubmitAiGuess(Room room, string connectionId, string guess)
    {
        if (room.GameData is not DeepfakeState state) return false;
        // Must be AI
        if (connectionId != state.AiConnectionId) return false;
        // Must be caught
        if (!state.AiCaught) return false; // Or maybe they can guess anytime? Design says "If caught".

        // Verify Guess (Exact match or loose?)
        // Simple case-insensitive
        if (string.Equals(guess.Trim(), state.Prompt, StringComparison.OrdinalIgnoreCase))
        {
            state.AiWon = true; // AI snatched victory!
        }
        else
        {
            state.AiWon = false; // Humans win!
        }
        
        state.Phase = DeepfakePhase.Results;
        return true;
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_STROKE" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("pathData", out var pathProp) && 
                 action.Payload.Value.TryGetProperty("color", out var colorProp))
             {
                 if(SubmitStroke(room, connectionId, pathProp.GetString() ?? "", colorProp.GetString() ?? ""))
                    return Task.FromResult(true);
             }
        }
        else if (action.Type == "SUBMIT_VOTE" && action.Payload.HasValue)
        {
            if (action.Payload.Value.TryGetProperty("accusedId", out var prop))
            {
                if(SubmitVote(room, connectionId, prop.GetString() ?? ""))
                    return Task.FromResult(true);
            }
        }
        else if (action.Type == "SUBMIT_AI_GUESS" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("guess", out var prop))
            {
                if(SubmitAiGuess(room, connectionId, prop.GetString() ?? ""))
                    return Task.FromResult(true);
            }
        }
        return Task.FromResult(false);
    }
    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<DeepfakeState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new DeepfakeState();
    }
}
