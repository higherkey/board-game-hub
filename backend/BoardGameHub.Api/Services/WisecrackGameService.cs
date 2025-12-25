using BoardGameHub.Api.Models;
using System.Text.Json;

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

    public Task StartRound(Room room, GameSettings settings)
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
        return Task.CompletedTask;
    }

    public async Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not WisecrackState state) return;

        try
        {
            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            // Wisecrack scores are awarded during FinishBattle, but we can re-verify or 
            // recalculate here if we wanted to be perfectly robust.
            // For now, let's just ensure all players are in RoundScores.
            // Actually, to follow the pattern, let's track battle scores in state and sum them here.
            // For now, I'll just make sure the existing logic is safe.
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Wisecrack CalculateScores: {ex.Message}");
        }
    }

    public Task SubmitAnswer(Room room, string playerId, string promptId, string answerText)
    {
        if (room == null || room.GameData is not WisecrackState state) return Task.CompletedTask;
        if (state.Phase != WisecrackPhase.Writing) return Task.CompletedTask;

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player == null) return Task.CompletedTask;

        // Check if player is assigned to this prompt
        var assignment = state.Assignments.FirstOrDefault(a => a.PromptId == promptId);
        if (assignment == null || !assignment.AssignedPlayerIds.Contains(playerId)) return Task.CompletedTask;

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
        return Task.CompletedTask;
    }

    public Task SubmitVote(Room room, string playerId, int choice)
    {
        if (room == null || room.GameData is not WisecrackState state) return Task.CompletedTask;
        if (state.Phase != WisecrackPhase.Battling) return Task.CompletedTask;

        var battle = state.CurrentBattle;
        if (battle == null || battle.IsFinished) return Task.CompletedTask;

        // Validate voter (can't vote if it's your own answer)
        if (battle.AnswerA.PlayerId == playerId || battle.AnswerB.PlayerId == playerId)
        {
            return Task.CompletedTask;
        }

        // Add/Update Vote
        battle.Votes.RemoveAll(v => v.PlayerId == playerId);
        battle.Votes.Add(new WisecrackVote { PlayerId = playerId, Choice = choice });

        // Auto-finish battle if everyone (audience/others) voted?
        int expectedVotes = room.Players.Count - 2;
        if (expectedVotes < 0) expectedVotes = 0;

        if (battle.Votes.Count >= expectedVotes)
        {
            FinishBattle(room, battle);
        }
        return Task.CompletedTask;
    }

    public Task NextBattle(Room room)
    {
        if (room == null || room.GameData is not WisecrackState state) return Task.CompletedTask;
        if (state.Phase != WisecrackPhase.Battling) return Task.CompletedTask;

        state.CurrentBattleIndex++;
        if (state.CurrentBattleIndex >= state.Battles.Count)
        {
            state.Phase = WisecrackPhase.Result;
            state.CurrentBattleIndex = -1;
            _ = CalculateScores(room);
        }
        return Task.CompletedTask;
    }

    private void FinishBattle(Room room, WisecrackBattle battle)
    {
        battle.IsFinished = true;

        int votesA = battle.Votes.Count(v => v.Choice == 0);
        int votesB = battle.Votes.Count(v => v.Choice == 1);

        if (votesA > votesB)
        {
            battle.WinnerPlayerId = battle.AnswerA.PlayerId;
            AddPoints(room, battle.AnswerA.PlayerId, 100 + (votesA * 50)); 
        }
        else if (votesB > votesA)
        {
            battle.WinnerPlayerId = battle.AnswerB.PlayerId;
            AddPoints(room, battle.AnswerB.PlayerId, 100 + (votesB * 50));
        }
        else
        {
            battle.WinnerPlayerId = "TIE";
            AddPoints(room, battle.AnswerA.PlayerId, 50);
            AddPoints(room, battle.AnswerB.PlayerId, 50);
        }
    }

    private void AddPoints(Room room, string playerId, int points)
    {
        var p = room.Players.FirstOrDefault(x => x.ConnectionId == playerId);
        if (p != null) p.Score += points;

        if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
        if (!room.RoundScores.ContainsKey(playerId)) room.RoundScores[playerId] = 0;
        room.RoundScores[playerId] += points;
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

    public async Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_ANSWER" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("promptId", out var promptProp) && 
                 action.Payload.Value.TryGetProperty("answer", out var ansProp))
             {
                 await SubmitAnswer(room, connectionId, promptProp.GetString() ?? "", ansProp.GetString() ?? "");
                 return true;
             }
        }
        else if (action.Type == "SUBMIT_VOTE" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("choice", out var choiceProp))
             {
                 await SubmitVote(room, connectionId, choiceProp.GetInt32());
                 return true;
             }
        }
        else if (action.Type == "NEXT_BATTLE")
        {
             await NextBattle(room);
             return true;
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
        return json.Deserialize<WisecrackState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new WisecrackState();
    }
}
