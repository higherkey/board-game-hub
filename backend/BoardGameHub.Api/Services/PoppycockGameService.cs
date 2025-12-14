using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class PoppycockGameService : IGameService
{
    public GameType GameType => GameType.Poppycock;

    public void StartRound(Room room, GameSettings settings)
    {
        var wordData = GetRandomWord();
        var state = new PoppycockState
        {
            Phase = PoppycockPhase.Faking,
            CurrentPrompt = wordData
        };
        
        room.GameData = state;
    }

    public void CalculateScores(Room room)
    {
        if (room.GameData is not PoppycockState state) return;

        // Ensure we are in Result phase or moving to it
        // Check votes
        foreach (var voteEntry in state.Votes)
        {
            var voterId = voteEntry.Key;
            var votedDefinitionId = voteEntry.Value;

            // 1. Did they vote for the Real Definition?
            if (votedDefinitionId == "REAL")
            {
                AddScore(room, voterId, 2); // 2 points for correct answer
            }
            else
            {
                // 2. Did they vote for another player's fake definition?
                // The voted ID is the PlayerId of the faker
                AddScore(room, votedDefinitionId, 1); // 1 point for deceiving someone
            }
        }
        
        // Host points? Optional variant -> Dasher gets points if no one guesses real.
        // Skipping for MVP simplicity.
    }

    public void SubmitDefinition(Room room, string playerId, string definition)
    {
        if (room.GameData is not PoppycockState state) return;
        if (state.Phase != PoppycockPhase.Faking) return;

        state.PlayerSubmissions[playerId] = definition;

        // Check if all players have submitted
        // Note: The "Dasher" is the System in this version, or we can treat one player as Dasher.
        // Design says: "System (or a rotating Dasher)... The System has the Real Definition."
        // So everyone submits a fake.
        
        if (state.PlayerSubmissions.Count == room.Players.Count)
        {
            state.Phase = PoppycockPhase.Voting;
            // We don't shuffle here, the frontend can shuffle or we can create a projected list.
            // But simple to just let frontend shuffle for display to keep state clean.
        }
    }

    public void SubmitVote(Room room, string playerId, string votedDefinitionId)
    {
        if (room.GameData is not PoppycockState state) return;
        if (state.Phase != PoppycockPhase.Voting) return;
        
        // Improve: Prevent voting for self?
        if (votedDefinitionId == playerId) return; 

        state.Votes[playerId] = votedDefinitionId;

        // Check if all players have voted
        if (state.Votes.Count == room.Players.Count)
        {
            CalculateScores(room);
            state.Phase = PoppycockPhase.Result;
        }
    }

    private void AddScore(Room room, string playerId, int points)
    {
        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player != null)
        {
            player.Score += points;
            
            if (!room.RoundScores.ContainsKey(playerId)) room.RoundScores[playerId] = 0;
            room.RoundScores[playerId] += points;
        }
    }

    private PoppycockPrompt GetRandomWord()
    {
        var prompts = new[]
        {
            new PoppycockPrompt("Wamble", "To move with a staggering or rolling gait.", "Verbs"),
            new PoppycockPrompt("Groke", "To stare at somebody while they are eating in the hope that they will give you some of their food.", "Verbs"),
            new PoppycockPrompt("Crapulence", "Sickness or indisposition resulting from excess in drinking or eating.", "Nouns"),
            new PoppycockPrompt("Agastopia", "Admiration of a particular part of someone's body.", "Nouns"),
            new PoppycockPrompt("Biblioklept", "One who steals books.", "Nouns"),
            new PoppycockPrompt("Acnestis", "The part of the back (or backbone) between the shoulder blades and the loins which an animal cannot reach to scratch.", "Anatomy"),
            new PoppycockPrompt("Gongoozler", "An idle spectator who stares at something for a long time.", "Nouns"),
            new PoppycockPrompt("Jentacular", "Pertaining to breakfast.", "Adjectives"),
            new PoppycockPrompt("Kakorrhaphiophobia", "Abnormal fear of failure.", "Phobias"),
            new PoppycockPrompt("Meldrop", "A drop of mucus at the nose, whether produced by cold or otherwise.", "Nouns")
        };
        
        return prompts[new Random().Next(prompts.Length)];
    }
}

public class PoppycockState
{
    public PoppycockPhase Phase { get; set; }
    public PoppycockPrompt CurrentPrompt { get; set; } = new();
    
    // PlayerId -> Fake Definition
    public Dictionary<string, string> PlayerSubmissions { get; set; } = new();
    
    // VoterId -> TargetSubmissionId (PlayerId of author, or "REAL")
    public Dictionary<string, string> Votes { get; set; } = new();
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
