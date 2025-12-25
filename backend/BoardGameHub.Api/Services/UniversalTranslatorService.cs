using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class UniversalTranslatorService : IGameService
{
    public GameType GameType => GameType.UniversalTranslator;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new UniversalTranslatorState();
        
        // 1. Assign Roles
        // Roles: 1 "Main Computer", 1 "J", 1 "Empath", Rest "Crew"
        // Need at least 4 players for full experience, but for < 4 adapt:
        // 3 players: Computer, J, Crew (No Empath)
        // 2 players: Computer, Crew (Co-op practice? or Computer, J) -> Let's force minimum 3 for now or just random.
        
        var players = room.Players.ToList();
        var count = players.Count;
        var r = new Random();
        
        // Shuffle
        players = players.OrderBy(x => r.Next()).ToList();
        
        var roles = new Dictionary<string, UniversalTranslatorRole>();
        
        if (count >= 1) roles[players[0].ConnectionId] = UniversalTranslatorRole.MainComputer;
        if (count >= 2) roles[players[1].ConnectionId] = UniversalTranslatorRole.J;
        if (count >= 3) roles[players[2].ConnectionId] = UniversalTranslatorRole.Crew; // Should be Empath if >= 4?
        // Let's refine:
        // Index 0: Computer
        // Index 1: J
        // Index 2: Empath (if >= 4 players), else Crew
        // Rest: Crew
        
        for (int i = 0; i < count; i++)
        {
            var pid = players[i].ConnectionId;
            if (i == 0) roles[pid] = UniversalTranslatorRole.MainComputer;
            else if (i == 1) roles[pid] = UniversalTranslatorRole.J;
            else if (i == 2 && count >= 4) roles[pid] = UniversalTranslatorRole.Empath;
            else roles[pid] = UniversalTranslatorRole.Crew;
        }
        
        state.Roles = roles;
        state.WordChoices = GetRandomWords(3);
        state.Phase = UniversalTranslatorPhase.Setup;
        
        // Token Limits (Typical Werewords config)
        state.TokenLimits = new Dictionary<string, int>
        {
             { "Yes", 30 },
             { "No", 30 },
             { "Maybe", 5 },
             { "So Close", 1 },
             { "Way Off", 1 },
             { "Correct", 1 }
        };
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    private List<string> GetRandomWords(int count)
    {
        var pool = new[] { "Robot", "Laser", "Spaceship", "Alien", "Planet", "Star", "Galaxy", "Portal", "Time Machine", "Asteroid", "Black Hole", "Supernova", "Satellite", "Astronaut", "Comet", "Nebula", "Telescope", "Mars", "Pluto", "Rocket" };
        var r = new Random();
        return pool.OrderBy(x => r.Next()).Take(count).ToList();
    }

    public Task<bool> PickWord(Room room, string playerId, string word)
    {
        if (room == null || room.GameData is not UniversalTranslatorState state) return Task.FromResult(false);
        if (state.Phase != UniversalTranslatorPhase.Setup) return Task.FromResult(false);

        // Only Main Computer can pick
        if (!state.Roles.TryGetValue(playerId, out var role) || role != UniversalTranslatorRole.MainComputer) return Task.FromResult(false);
        if (state.WordChoices == null || !state.WordChoices.Contains(word)) return Task.FromResult(false);

        state.TargetWord = word;
        state.Phase = UniversalTranslatorPhase.Day;
        
        room.RoundEndTime = DateTime.UtcNow.AddMinutes(4);

        return Task.FromResult(true);
    }

    public Task CalculateScores(Room room)
    {
        // Scores are binary: Crew Win vs J Win.
        // Usually handled at game end moment. 
        // If we reach here, it might be timeout.
        if (room.GameData is UniversalTranslatorState state)
        {
             if (state.Phase == UniversalTranslatorPhase.Day)
             {
                 // Time ran out -> Vote Phase
                 state.Phase = UniversalTranslatorPhase.VotingForJ;
                 
                 // Extensions or Phase logic here
             }
        }
        return Task.CompletedTask;
    }

    // --- Game Actions ---

    public Task<bool> SubmitToken(Room room, string playerId, string token)
    {
        if (room == null || room.GameData is not UniversalTranslatorState state) return Task.FromResult(false);
        if (state.Phase != UniversalTranslatorPhase.Day) return Task.FromResult(false);
        
        // Only Main Computer can submit
        if (!state.Roles.TryGetValue(playerId, out var role) || role != UniversalTranslatorRole.MainComputer) return Task.FromResult(false);

        // Check Token Limits
        if (state.TokenLimits.TryGetValue(token, out var remaining))
        {
            if (remaining <= 0) return Task.FromResult(false);
            state.TokenLimits[token] = remaining - 1;
        }
        else
        {
            return Task.FromResult(false); 
        }

        state.TokenHistory.Add(new TokenEntry 
        { 
            Token = token, 
            Timestamp = DateTime.UtcNow 
        });

        // "Correct" token ends game immediately
        if (token == "Correct")
        {
            state.Winner = "Crew";
            state.EndReason = GameEndReason.WordGuessed;
            
            bool empathExists = state.Roles.Values.Any(r => r == UniversalTranslatorRole.Empath);
            if (empathExists)
            {
                state.Phase = UniversalTranslatorPhase.JGuessingEmpath;
            }
            else
            {
                state.Phase = UniversalTranslatorPhase.Result;
            }
        }
        else if (state.TokenLimits.Values.Sum() <= 0)
        {
            state.Phase = UniversalTranslatorPhase.VotingForJ;
            state.EndReason = GameEndReason.TimeExpired;
        }

        return Task.FromResult(true);
    }

    public Task<bool> SubmitVote(Room room, string playerId, string target)
    {
        if (room == null || room.GameData is not UniversalTranslatorState state) return Task.FromResult(false);

        if (state.Phase == UniversalTranslatorPhase.VotingForJ)
        {
            state.Votes[playerId] = target;
            
            // Trigger resolution when all non-MC players have voted
            var votersCount = state.Roles.Values.Count(r => r != UniversalTranslatorRole.MainComputer);
            if (state.Votes.Count >= votersCount)
            {
                ResolveVoteForJ(state, room);
            }
            return Task.FromResult(true);
        }
        else if (state.Phase == UniversalTranslatorPhase.JGuessingEmpath)
        {
             var accusedRole = state.Roles.GetValueOrDefault(target, UniversalTranslatorRole.Crew);
             if (accusedRole == UniversalTranslatorRole.Empath)
             {
                 state.Winner = "J";
                 state.EndReason = GameEndReason.EmpathAssassinated;
             }
             else
             {
                 state.Winner = "Crew";
                 state.EndReason = GameEndReason.JEscaped; 
             }
             state.Phase = UniversalTranslatorPhase.Result;
             return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }
    
    public void ResolveVoteForJ(UniversalTranslatorState state, Room room)
    {
        if (state == null) return;

        // Tally votes
        var counts = state.Votes.Values.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
        
        if (!counts.Any())
        {
            state.Winner = "J";
            state.EndReason = GameEndReason.JEscaped;
            state.Phase = UniversalTranslatorPhase.Result;
            return;
        }

        var maxVotes = counts.Values.Max();
        var topCandidates = counts.Where(x => x.Value == maxVotes).Select(x => x.Key).ToList();

        if (topCandidates.Count > 1)
        {
            state.Winner = "J";
            state.EndReason = GameEndReason.JEscaped;
        }
        else
        {
            var target = topCandidates.First();
            if (state.Roles.TryGetValue(target, out var role) && role == UniversalTranslatorRole.J)
            {
                state.Winner = "Crew";
                state.EndReason = GameEndReason.JFound;
            }
            else
            {
                state.Winner = "J";
                state.EndReason = GameEndReason.JEscaped;
            }
        }
        state.Phase = UniversalTranslatorPhase.Result;
    }
    
    public void ForcePhase(Room room, UniversalTranslatorPhase phase)
    {
        if (room != null && room.GameData is UniversalTranslatorState state)
        {
            state.Phase = phase;
        }
    }

    public async Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room == null || action == null) return false;

        if (action.Type == "SUBMIT_TOKEN" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("token", out var tokenProp))
             {
                 return await SubmitToken(room, connectionId, tokenProp.GetString() ?? "");
             }
        }
        else if (action.Type == "SUBMIT_VOTE" && action.Payload.HasValue)
        {
            if (action.Payload.Value.TryGetProperty("accusedId", out var prop))
            {
                return await SubmitVote(room, connectionId, prop.GetString() ?? "");
            }
        }
        else if (action.Type == "PICK_WORD" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("word", out var wordProp))
             {
                 return await PickWord(room, connectionId, wordProp.GetString() ?? "");
             }
        }
        else if (action.Type == "FORCE_PHASE" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("phase", out var phaseProp))
             {
                 if (Enum.TryParse<UniversalTranslatorPhase>(phaseProp.GetString(), out var phase))
                 {
                     ForcePhase(room, phase);
                     return true;
                 }
             }
        }
        return false;
    }

    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
    }

    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<UniversalTranslatorState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new UniversalTranslatorState();
    }
}
