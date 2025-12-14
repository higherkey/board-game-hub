using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class UniversalTranslatorService : IGameService
{
    public GameType GameType => GameType.UniversalTranslator;

    public void StartRound(Room room, GameSettings settings)
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
        state.TargetWord = GetRandomWord();
        state.Phase = UniversalTranslatorPhase.Day;
        
        // Timer handled by room.RoundEndTime in RoomService generally, 
        // but we can track specific phase end here if we want sub-phases.
        // For now rely on Room Timer (Day Phase).
        
        room.GameData = state;
    }

    public void CalculateScores(Room room)
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
                 // Extend timer for voting? RoomService doesn't auto-extend.
                 // We might need to handle this via a "CheckTimer" or "PhaseTransition" call.
                 // For MVP, we'll let the frontend trigger "EndRound" which calls this, 
                 // OR we handle transitions explicitly via actions.
                 
                 // If "CalculateScores" is called by "EndRound", it implies game over.
                 // So if we are here at timeout, J Wins (unless we implement the Voting phase mechanic).
                 // Let's say Timeout = J Wins (standard Werewords rule is Timeout = Vote, but let's simplify for now or implement Vote).
                 
                 // Let's implement Vote on Timeout.
                 // We can't easily change the Room Timer from here without access to Room proper setters or returning state.
                 // But we have Reference to Room.
                 // So we can say:
                 // room.State is still Playing.
                 // But we need to switch phase.
             }
        }
    }

    // --- Game Actions ---

    public bool SubmitToken(Room room, string playerId, string token)
    {
        if (room.GameData is not UniversalTranslatorState state) return false;
        if (state.Phase != UniversalTranslatorPhase.Day) return false;
        
        // Only Main Computer can submit
        if (!state.Roles.TryGetValue(playerId, out var role) || role != UniversalTranslatorRole.MainComputer) return false;

        state.TokenHistory.Add(new TokenEntry 
        { 
            Token = token, 
            Timestamp = DateTime.UtcNow 
        });

        // "Correct" token ends game immediately
        if (token == "Correct")
        {
            state.Winner = "Crew"; // Tentative, J gets to guess Empath
            state.EndReason = GameEndReason.WordGuessed;
            
            // If Empath exists, J gets a chance
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

        return true;
    }

    public bool SubmitVote(Room room, string voterId, string accusedId)
    {
        if (room.GameData is not UniversalTranslatorState state) return false;
        
        // Voting for J (after timeout)
        if (state.Phase == UniversalTranslatorPhase.VotingForJ)
        {
            state.Votes[voterId] = accusedId;
            // Check if everyone voted (except Main Computer? usually everyone votes including MC)
            var voters = room.Players.Count; 
            if (state.Votes.Count >= voters)
            {
                ResolveVoteForJ(state, room);
            }
            return true;
        }
        
        // J Guessing Empath (after word found)
        if (state.Phase == UniversalTranslatorPhase.JGuessingEmpath)
        {
            // Only J handles this
             if (state.Roles.TryGetValue(voterId, out var role) && role == UniversalTranslatorRole.J)
             {
                 // J guesses 'accusedId' is Empath
                 var accusedRole = state.Roles.GetValueOrDefault(accusedId, UniversalTranslatorRole.Crew); // Default to crew if not found
                 if (accusedRole == UniversalTranslatorRole.Empath)
                 {
                     state.Winner = "J";
                     state.EndReason = GameEndReason.EmpathAssassinated;
                 }
                 else
                 {
                     state.Winner = "Crew";
                     state.EndReason = GameEndReason.JEscaped; // J failed to find Empath
                 }
                 state.Phase = UniversalTranslatorPhase.Result;
                 return true;
             }
        }

        return false;
    }
    
    private void ResolveVoteForJ(UniversalTranslatorState state, Room room)
    {
        // Tally votes
        var counts = state.Votes.Values.GroupBy(x => x).ToDictionary(g => g.Key, g => g.Count());
        var max =0;
        string? target = null;
        
        foreach(var kvp in counts)
        {
            if (kvp.Value > max)
            {
                max = kvp.Value;
                target = kvp.Key;
            }
        }
        
        // Logic: Majority wins? 
        if (target != null && state.Roles.TryGetValue(target, out var role))
        {
            if (role == UniversalTranslatorRole.J)
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
        else
        {
            state.Winner = "J"; // Tie or no vote?
        }
        state.Phase = UniversalTranslatorPhase.Result;
    }
    
    public void ForcePhase(Room room, UniversalTranslatorPhase phase)
    {
        if (room.GameData is UniversalTranslatorState state)
        {
            state.Phase = phase;
        }
    }

    private string GetRandomWord()
    {
        var words = new[] { "Robot", "Laser", "Spaceship", "Alien", "Planet", "Star", "Galaxy", "Portal", "Time Machine", "Asteroid" };
        var r = new Random();
        return words[r.Next(words.Length)];
    }
}
