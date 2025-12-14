using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class WisecrackGameService : IGameService
{
    public GameType GameType => GameType.Wisecrack;

    private readonly List<string> _prompts = new()
    {
        "The worst thing to say at a funeral",
        "A rejected crayon color",
        "What dogs really think about",
        "The worst name for a new planet",
        "Something you shouldn't say to a police officer",
        "The most useless superpower",
        "A bad reason to break up with someone",
        "What you don't want to find in your burrito",
        "A terrible theme for a high school prom",
        "The worst thing to hear from your pilot",
        "A tweet from a caveman",
        "Something you’d find in a dollar store focused on luxury goods",
        "The worst ice cream flavor",
        "An unwise thing to bring to a gunfight",
        "A rejected Disney Princess",
        "The worst sequel to 'Titanic'",
        "Bad advice for a job interview",
        "Something you shouldn't whisper in a movie theater",
        "Real reason the dinosaurs went extinct",
        "A terrible name for a rock band"
    };

    public void StartRound(Room room, GameSettings settings)
    {
        var state = new WisecrackState
        {
            Phase = WisecrackPhase.Writing,
            RoundNumber = 1
        };

        // Assign prompts logic
        // Rule: Each player gets 2 prompts. Each prompt is shared by 2 players.
        // N players -> N prompts needed (since each prompt has 2 players, total slots = 2*N. Total prompts = N).
        // Example: 3 Players (A, B, C). Prompts needed: 3.
        // P1: A, B.
        // P2: B, C.
        // P3: C, A.
        AssignPrompts(room.Players, state);

        room.GameData = state;
    }

    public void CalculateScores(Room room)
    {
        // Scores are calculated per battle, so maybe just ensure final tally is correct?
        // This is usually called at the VERY END or end of a "round" (set of battles).
        // For Wisecrack, let's say end of all battles is end of round.
    }

    public void SubmitAnswer(Room room, string playerId, string promptId, string answerText)
    {
        if (room.GameData is not WisecrackState state) return;
        if (state.Phase != WisecrackPhase.Writing) return;

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player == null) return;

        // Check if player is assigned to this prompt
        var assignment = state.Assignments.FirstOrDefault(a => a.PromptId == promptId);
        if (assignment == null || !assignment.AssignedPlayerIds.Contains(playerId)) return;

        // Add or Update answer
        state.Answers.RemoveAll(a => a.PromptId == promptId && a.PlayerId == playerId);
        state.Answers.Add(new WisecrackAnswer
        {
            PromptId = promptId,
            PlayerId = playerId,
            PlayerName = player.Name,
            Text = answerText
        });

        // Check if all needed answers are present
        // Total expected answers = Players.Count * 2
        int expectedAnswers = room.Players.Count * 2;
        if (state.Answers.Count >= expectedAnswers)
        {
            GenerateBattles(state);
            state.Phase = WisecrackPhase.Battling;
            state.CurrentBattleIndex = 0;
        }
    }

    public void SubmitVote(Room room, string playerId, int choice)
    {
        if (room.GameData is not WisecrackState state) return;
        if (state.Phase != WisecrackPhase.Battling) return;

        var battle = state.CurrentBattle;
        if (battle == null || battle.IsFinished) return;

        // Validate voter (can't vote if it's your own answer? Design says players vote on others)
        // Check if player is one of the answerers
        if (battle.AnswerA.PlayerId == playerId || battle.AnswerB.PlayerId == playerId)
        {
            // Usually in Quiplash, answerers DO NOT vote on their own battle.
            return;
        }

        // Add/Update Vote
        battle.Votes.RemoveAll(v => v.PlayerId == playerId);
        battle.Votes.Add(new WisecrackVote { PlayerId = playerId, Choice = choice });

        // Auto-finish battle if everyone (audience/others) voted?
        // Audience = All Players - 2 Answerers.
        int expectedVotes = room.Players.Count - 2;
        if (expectedVotes < 0) expectedVotes = 0; // Should not happen with >=3 players

        if (battle.Votes.Count >= expectedVotes)
        {
            FinishBattle(room, battle);
        }
    }

    public void NextBattle(Room room)
    {
        if (room.GameData is not WisecrackState state) return;
        if (state.Phase != WisecrackPhase.Battling) return;

        state.CurrentBattleIndex++;
        if (state.CurrentBattleIndex >= state.Battles.Count)
        {
            state.Phase = WisecrackPhase.Result;
            state.CurrentBattleIndex = -1;
        }
    }

    private void FinishBattle(Room room, WisecrackBattle battle)
    {
        battle.IsFinished = true;

        int votesA = battle.Votes.Count(v => v.Choice == 0);
        int votesB = battle.Votes.Count(v => v.Choice == 1);

        if (votesA > votesB)
        {
            battle.WinnerPlayerId = battle.AnswerA.PlayerId;
            AddScore(room, battle.AnswerA.PlayerId, 100 + (votesA * 50)); 
            // example scoring
        }
        else if (votesB > votesA)
        {
            battle.WinnerPlayerId = battle.AnswerB.PlayerId;
            AddScore(room, battle.AnswerB.PlayerId, 100 + (votesB * 50));
        }
        else
        {
            battle.WinnerPlayerId = "TIE";
            AddScore(room, battle.AnswerA.PlayerId, 50);
            AddScore(room, battle.AnswerB.PlayerId, 50);
        }
    }

    private void AddScore(Room room, string playerId, int points)
    {
        var p = room.Players.FirstOrDefault(x => x.ConnectionId == playerId);
        if (p != null) p.Score += points;
    }

    private void AssignPrompts(List<Player> players, WisecrackState state)
    {
        // Shuffle prompts
        var rnd = new Random();
        var shuffledPrompts = _prompts.OrderBy(x => rnd.Next()).ToList();
        
        int playerCount = players.Count;
        int promptIndex = 0;

        // Logic: P1 assigned to Player 0 and Player 1
        // P2 assigned to Player 1 and Player 2
        // ...
        // P_Last assigned to Player Last and Player 0
        
        for (int i = 0; i < playerCount; i++)
        {
            var pA = players[i];
            var pB = players[(i + 1) % playerCount];

            var promptText = (promptIndex < shuffledPrompts.Count) 
                ? shuffledPrompts[promptIndex++] 
                : $"Prompt {promptIndex++}"; // fallback

            var assignment = new WisecrackPromptAssignment
            {
                Text = promptText,
                AssignedPlayerIds = new List<string> { pA.ConnectionId, pB.ConnectionId }
            };
            state.Assignments.Add(assignment);
        }
    }

    private void GenerateBattles(WisecrackState state)
    {
        state.Battles.Clear();
        foreach (var assignment in state.Assignments)
        {
            // Find answers for this prompt
            var promptAnswers = state.Answers.Where(a => a.PromptId == assignment.PromptId).ToList();
            
            // Should have 2
            if (promptAnswers.Count < 2) continue; // Should not happen if check passed

            var battle = new WisecrackBattle
            {
                PromptText = assignment.Text,
                AnswerA = promptAnswers[0],
                AnswerB = promptAnswers[1]
            };
            state.Battles.Add(battle);
        }
        
        // Shuffle battles
        var rnd = new Random();
        state.Battles = state.Battles.OrderBy(x => rnd.Next()).ToList();
    }
}
