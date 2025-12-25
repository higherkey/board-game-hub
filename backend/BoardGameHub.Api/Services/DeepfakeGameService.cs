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
        ("Animals", "Kangaroo"),
        ("Animals", "Octopus"),
        ("Animals", "Peacock"),
        ("Landmarks", "Eiffel Tower"),
        ("Landmarks", "Pyramids"),
        ("Landmarks", "Statue of Liberty"),
        ("Landmarks", "Great Wall of China"),
        ("Landmarks", "Colosseum"),
        ("Objects", "Bicycle"),
        ("Objects", "Guitar"),
        ("Objects", "Chair"),
        ("Objects", "Toaster"),
        ("Objects", "Headphones"),
        ("Objects", "Microscope"),
        ("Food", "Pizza"),
        ("Food", "Ice Cream"),
        ("Food", "Burger"),
        ("Food", "Sushi"),
        ("Food", "Taco"),
        ("Food", "Croissant"),
        ("Fantasy", "Dragon"),
        ("Fantasy", "Unicorn"),
        ("Fantasy", "Wizard"),
        ("Fantasy", "Castle")
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

    public async Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not DeepfakeState state) return;

        try
        {
            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            // Deepfake scoring logic
            // Humans get points for catching AI.
            // AI gets points for escaping.
            // These are usually handled when the phase ends. 
            // We can finalize them here to be certain.

            if (state.Phase == DeepfakePhase.Results)
            {
                if (state.AiWon)
                {
                    AddPoints(room, state.AiConnectionId, 500); // AI wins big
                }
                else if (state.AiCaught)
                {
                    // Humans who voted correctly get points
                    foreach (var vote in state.Votes)
                    {
                        if (vote.Value == state.AiConnectionId)
                        {
                            AddPoints(room, vote.Key, 100);
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Deepfake CalculateScores: {ex.Message}");
        }
    }

    private void AddPoints(Room room, string playerId, int points)
    {
        if (string.IsNullOrEmpty(playerId)) return;
        
        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player != null) player.Score += points;

        if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
        if (!room.RoundScores.ContainsKey(playerId)) room.RoundScores[playerId] = 0;
        room.RoundScores[playerId] += points;
    }

    private string GetRandomPrompt()
    {
        var promptData = _prompts[_random.Next(_prompts.Count)];
        return promptData.Prompt;
    }

    public bool SubmitStroke(Room room, string connectionId, string pathData, string color)
    {
        if (room == null || room.GameData is not DeepfakeState state) return false;
        if (state.Phase != DeepfakePhase.Drawing) return false;

        // Check it's this player's turn (with safety)
        if (state.PlayerOrder == null || !state.PlayerOrder.Any())
        {
            // Auto-initialize order if empty
            state.PlayerOrder = room.Players.Select(p => p.ConnectionId).OrderBy(x => Guid.NewGuid()).ToList();
        }

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
        var totalTurns = state.PlayerOrder.Count * state.TotalRounds;
        if (state.CurrentTurnIndex >= totalTurns)
        {
            state.Phase = DeepfakePhase.Voting;
        }

        return true;
    }

    public bool SubmitVote(Room room, string voterId, string accusedId)
    {
        if (room == null || room.GameData is not DeepfakeState state) return false;
        if (state.Phase != DeepfakePhase.Voting) return false;

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
        if (state.Votes.Count == 0) return;

        // Count votes
        var voteCounts = state.Votes.GroupBy(v => v.Value)
                                    .ToDictionary(g => g.Key, g => g.Count());
        
        // Find most voted
        var maxVotes = voteCounts.Values.Max();
        var mostVotedIds = voteCounts.Where(x => x.Value == maxVotes).Select(x => x.Key).ToList();
        
        if (mostVotedIds.Contains(state.AiConnectionId))
        {
            // AI Caught!
            state.AiCaught = true;
        }
        else
        {
            // AI Escaped!
            state.AiCaught = false;
            state.AiWon = true; 
            state.Phase = DeepfakePhase.Results;
            _ = CalculateScores(room);
        }
    }

    public bool SubmitAiGuess(Room room, string connectionId, string guess)
    {
        if (room == null || room.GameData is not DeepfakeState state) return false;
        // Must be AI
        if (connectionId != state.AiConnectionId) return false;
        // Must be caught
        if (!state.AiCaught) return false;

        // Verify Guess
        if (string.Equals(guess.Trim(), state.Prompt, StringComparison.OrdinalIgnoreCase))
        {
            state.AiWon = true; // AI snatched victory!
        }
        else
        {
            state.AiWon = false; // Humans win!
        }
        
        state.Phase = DeepfakePhase.Results;
        _ = CalculateScores(room);
        return true;
    }

    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
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
