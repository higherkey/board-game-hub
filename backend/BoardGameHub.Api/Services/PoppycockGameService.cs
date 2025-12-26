using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class PoppycockGameService : IGameService
{
    public GameType GameType => GameType.Poppycock;

    public Task StartRound(Room room, GameSettings settings)
    {
        // 1. Determine Dasher (rotate based on round number)
        var dasher = room.Players[room.RoundNumber % room.Players.Count];
        
        // 2. Select random category
        var category = (PoppycockCategory)new Random().Next(Enum.GetValues<PoppycockCategory>().Length);
        
        // 3. Select random prompt for that category
        var prompt = GetRandomPrompt(category);
        
        var state = new PoppycockState
        {
            Phase = PoppycockPhase.Faking,
            DasherId = dasher.ConnectionId,
            Category = category,
            CurrentPrompt = prompt
        };
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not PoppycockState state) return Task.CompletedTask;

        try
        {
            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            var votesForReal = state.Votes.Values.Count(v => v == "REAL");

            // 1. Scoring for Voters
            foreach (var voteEntry in state.Votes)
            {
                var voterId = voteEntry.Key;
                var votedDefinitionId = voteEntry.Value;

                if (votedDefinitionId == "REAL")
                {
                    AddPoints(room, voterId, 3); // +3 for correct answer
                }
                else
                {
                    // +2 to the author of the lie that fooled you
                    AddPoints(room, votedDefinitionId, 2);
                }
            }

            // 1.5 Scoring for "The Natural" (Correct during faking phase)
            foreach (var id in state.CorrectSubmissions)
            {
                AddPoints(room, id, 3);
            }

            // 2. Scoring for the Dasher
            if (state.DasherId != null)
            {
                // If NO ONE guessed the real answer, Dasher gets +3
                if (votesForReal == 0)
                {
                    AddPoints(room, state.DasherId, 3);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Poppycock CalculateScores: {ex.Message}");
            throw;
        }
        return Task.CompletedTask;
    }

    private void AddPoints(Room room, string playerId, int points)
    {
        if (room.RoundScores.ContainsKey(playerId)) 
            room.RoundScores[playerId] += points;
        else 
            room.RoundScores[playerId] = points;

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player != null)
        {
            player.Score += points;
        }
    }

    public Task SubmitDefinition(Room room, string playerId, string definition)
    {
        if (room == null || room.GameData is not PoppycockState state) return Task.CompletedTask;
        if (state.Phase != PoppycockPhase.Faking) return Task.CompletedTask;
        if (playerId == state.DasherId) return Task.CompletedTask; // Dasher doesn't submit

        // Check for "The Natural" (Exact or close match)
        var realDef = state.CurrentPrompt.RealDefinition?.ToLower().Trim() ?? "";
        var submittedDef = definition.ToLower().Trim();
        
        if (submittedDef == realDef)
        {
            state.CorrectSubmissions.Add(playerId);
            // Score initialization is tricky here because CalculateScores resets it.
            // But "The Natural" happens in-phase. 
            // In Balderdash, you get points immediately. 
            // Let's ensure AddPoints is safe even if RoundScores isn't fully reset yet, 
            // OR we handle "Natural" points in CalculateScores by tracking them.
            // Tracking is safer.
        }
        else
        {
            state.PlayerSubmissions[playerId] = definition;
        }

        // Everyone except Dasher must submit (or get Natural)
        var expectedSubmitters = room.Players.Count - 1;
        var currentSubmissions = state.PlayerSubmissions.Count + state.CorrectSubmissions.Count;

        if (currentSubmissions >= expectedSubmitters)
        {
            state.Phase = PoppycockPhase.Voting;
        }
        return Task.CompletedTask;
    }

    public Task SubmitVote(Room room, string playerId, string votedDefinitionId)
    {
        if (room == null || room.GameData is not PoppycockState state) return Task.CompletedTask;
        if (state.Phase != PoppycockPhase.Voting) return Task.CompletedTask;
        
        if (playerId == state.DasherId) return Task.CompletedTask;

        // Prevent voting for self
        if (votedDefinitionId == playerId) return Task.CompletedTask; 

        // Prevent those who got it right from voting
        if (state.CorrectSubmissions.Contains(playerId)) return Task.CompletedTask;

        state.Votes[playerId] = votedDefinitionId;

        // Expected voters: All players - Dasher - CorrectSubmitters
        var expectedVoters = room.Players.Count - 1 - state.CorrectSubmissions.Count;
        
        if (state.Votes.Count >= expectedVoters)
        {
            _ = CalculateScores(room); // Fire and forget or await? Pattern says Task.
            state.Phase = PoppycockPhase.Result;
        }
        return Task.CompletedTask;
    }

    private void AddScore(Room room, string playerId, int points)
    {
        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player != null)
        {
            player.Score += points;
            
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            if (!room.RoundScores.ContainsKey(playerId)) room.RoundScores[playerId] = 0;
            room.RoundScores[playerId] += points;
        }
    }

    private PoppycockPrompt GetRandomPrompt(PoppycockCategory category)
    {
        var prompts = category switch
        {
            PoppycockCategory.Words => new[] {
                new PoppycockPrompt("Wamble", "To move with a staggering gait.", "Words"),
                new PoppycockPrompt("Groke", "To stare at somebody eating in hope of food.", "Words"),
                new PoppycockPrompt("Biblioklept", "One who steals books.", "Words"),
                new PoppycockPrompt("Acnestis", "The part of the back you cannot scratch.", "Words"),
                new PoppycockPrompt("Gongoozler", "An idle spectator who stares at something for a long time.", "Words"),
                new PoppycockPrompt("Jentacular", "Pertaining to breakfast.", "Words"),
                new PoppycockPrompt("Meldrop", "A drop of mucus at the nose.", "Words")
            },
            PoppycockCategory.Movies => new[] {
                new PoppycockPrompt("Santa Claus Conquers the Martians", "Martians kidnap Santa because their children have no joy.", "Movies"),
                new PoppycockPrompt("The Roller Blade Seven", "A roller-skating samurai searches for his sister in a wasteland.", "Movies"),
                new PoppycockPrompt("Plan 9 from Outer Space", "Aliens resurrect the dead to stop humanity from building a doomsday bomb.", "Movies"),
                new PoppycockPrompt("Birdemic: Shock and Terror", "Global warming causes eagles and vultures to explode and attack a town.", "Movies"),
                new PoppycockPrompt("The Room", "A successful banker's life is torn apart when his fiancée cheats on him with his best friend.", "Movies")
            },
            PoppycockCategory.Laws => new[] {
                new PoppycockPrompt("Switzerland", "It is illegal to keep just one social animal (like a guinea pig).", "Laws"),
                new PoppycockPrompt("Samoa", "It is a crime to forget your wife's birthday.", "Laws"),
                new PoppycockPrompt("Scotland", "You must allow anyone who knocks on your door to use your toilet.", "Laws"),
                new PoppycockPrompt("Georgia (USA)", "It is illegal to keep an ice cream cone in your back pocket on Sundays.", "Laws"),
                new PoppycockPrompt("Singapore", "Chewing gum is banned except for therapeutic or dental reasons.", "Laws")
            },
            PoppycockCategory.Initials => new[] {
                new PoppycockPrompt("NASA", "National Aeronautics and Space Administration", "Initials"),
                new PoppycockPrompt("SCUBA", "Self-Contained Underwater Breathing Apparatus", "Initials"),
                new PoppycockPrompt("LASER", "Light Amplification by Stimulated Emission of Radiation", "Initials"),
                new PoppycockPrompt("GIF", "Graphics Interchange Format", "Initials"),
                new PoppycockPrompt("CAPTCHA", "Completely Automated Public Turing test to tell Computers and Humans Apart", "Initials")
            },
            PoppycockCategory.People => new[] {
                new PoppycockPrompt("Tarrare", "An 18th-century French showman famous for his extreme eating habits.", "People"),
                new PoppycockPrompt("Joshua Abraham Norton", "A man who declared himself 'Emperor of the United States' in 1859.", "People"),
                new PoppycockPrompt("Lina Medina", "The youngest confirmed mother in medical history (at age 5).", "People"),
                new PoppycockPrompt("Victor Lustig", "The con artist who 'sold' the Eiffel Tower twice.", "People")
            },
            _ => new[] { new PoppycockPrompt("Unknown", "Nothing", "Misc") }
        };

        return prompts[new Random().Next(prompts.Length)];
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_DEFINITION" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("definition", out var defProp))
             {
                 SubmitDefinition(room, connectionId, defProp.GetString() ?? "");
                 return Task.FromResult(true);
             }
        }
        else if (action.Type == "SUBMIT_VOTE" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("votedId", out var voteProp))
             {
                 SubmitVote(room, connectionId, voteProp.GetString() ?? "");
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
        return json.Deserialize<PoppycockState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new PoppycockState();
    }
}

public class PoppycockState
{
    public PoppycockPhase Phase { get; set; }
    public PoppycockPrompt CurrentPrompt { get; set; } = new();
    
    // The player who sees the real answer and doesn't submit a lie (unless they want to?)
    // In Balderdash, the Dasher is the one who reads the card.
    public string? DasherId { get; set; }
    public PoppycockCategory Category { get; set; }

    // PlayerId -> Fake Definition
    public Dictionary<string, string> PlayerSubmissions { get; set; } = new();
    
    // VoterId -> TargetSubmissionId (PlayerId of author, or "REAL")
    public Dictionary<string, string> Votes { get; set; } = new();

    // Players who guessed the real answer during the "Faking" phase
    public List<string> CorrectSubmissions { get; set; } = new();
}

public class PoppycockPrompt
{
    public string Word { get; set; } = string.Empty;
    public string RealDefinition { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;

    public PoppycockPrompt() { }
    public PoppycockPrompt(string w, string d, string c) { Word = w; RealDefinition = d; Category = c; }
}

public enum PoppycockPhase
{
    Faking,
    Voting,
    Result
}

public enum PoppycockCategory
{
    Words,    // Dasher's Choice (Obscure Words)
    Movies,   // Movie Night
    Laws,     // Legal Eagle
    Initials, // Inner Circle
    People    // Life Stories
}
