using BoardGameHub.Api.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class WisecrackGameService : IGameService
{
    private readonly ILogger<WisecrackGameService> _logger;
    public GameType GameType => GameType.Wisecrack;

    public WisecrackGameService(ILogger<WisecrackGameService> logger)
    {
        _logger = logger;
    }

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
        _logger.LogInformation("Starting Wisecrack round in room {Code}", room.Code);
        // 1. Determine Phase based on Round Number
        // Fix: Use room.RoundNumber directly instead of resetting to 1
        int currentRound = room.RoundNumber;

        var state = new WisecrackState
        {
            Phase = WisecrackPhase.Writing,
            RoundNumber = currentRound
        };

        // 2. Assign Prompts
        if (currentRound < 3)
        {
            // Standard Rounds (1 & 2)
            AssignPrompts(room.Players, state, currentRound);
        }
        else
        {
            // Round 3: The Final Crack (Common Prompt)
            AssignFinalCrack(room.Players, state);
        }

        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not WisecrackState state) return Task.CompletedTask;

        try
        {
            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;
            
            // Sync Session Score
            // (Scores are added incrementally during battles, so just ensure synchronization if needed)
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Wisecrack CalculateScores: {ex.Message}");
        }
        return Task.CompletedTask;
    }

    public Task SubmitAnswer(Room room, string playerId, string promptId, string answerText)
    {
        if (room == null || room.GameData is not WisecrackState state) return Task.CompletedTask;
        if (state.Phase != WisecrackPhase.Writing) return Task.CompletedTask;

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == playerId);
        if (player == null) return Task.CompletedTask;

        // Check availability
        var assignment = state.Assignments.FirstOrDefault(a => a.PromptId == promptId);
        if (assignment == null || !assignment.AssignedPlayerIds.Contains(playerId)) return Task.CompletedTask;

        // Add/Update
        state.Answers.RemoveAll(a => a.PromptId == promptId && a.PlayerId == playerId);
        state.Answers.Add(new WisecrackAnswer
        {
            PromptId = promptId,
            PlayerId = playerId,
            PlayerName = player.Name,
            Text = answerText
        });

        // Check Completion
        int expectedAnswers;
        if (state.RoundNumber < 3)
        {
            // Rounds 1-2: 2 prompts per player
            expectedAnswers = room.Players.Count * 2;
        }
        else
        {
            // Round 3: 1 answer per player
            expectedAnswers = room.Players.Count;
        }

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

        // Validation: Cannot vote for yourself
        if (battle.AnswerA.PlayerId == playerId || battle.AnswerB.PlayerId == playerId)
        {
            return Task.CompletedTask;
        }

        state.Battles.FirstOrDefault(b => b.Id == battle.Id)?.Votes.RemoveAll(v => v.PlayerId == playerId);
        state.Battles.FirstOrDefault(b => b.Id == battle.Id)?.Votes.Add(new WisecrackVote { PlayerId = playerId, Choice = choice });

        // Check if all audience voted
        // voters = AllPlayers - 2 (Combatants)
        int combatantCount = 2; 
        int possibleVoters = room.Players.Count - combatantCount; 
        if (possibleVoters < 0) possibleVoters = 0;

        if (battle.Votes.Count >= possibleVoters)
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
            // End of Battles
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

        // Score Multiplier for Round 3? (Usually tripled)
        int multiplier = (room.GameData is WisecrackState s && s.RoundNumber == 3) ? 3 : 1;

        if (votesA > votesB)
        {
            battle.WinnerPlayerId = battle.AnswerA.PlayerId;
            AddPoints(room, battle.AnswerA.PlayerId, (100 + (votesA * 25)) * multiplier); 
        }
        else if (votesB > votesA)
        {
            battle.WinnerPlayerId = battle.AnswerB.PlayerId;
            AddPoints(room, battle.AnswerB.PlayerId, (100 + (votesB * 25)) * multiplier);
        }
        else
        {
            battle.WinnerPlayerId = "TIE";
            AddPoints(room, battle.AnswerA.PlayerId, 50 * multiplier);
            AddPoints(room, battle.AnswerB.PlayerId, 50 * multiplier);
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

    private void AssignPrompts(List<Player> players, WisecrackState state, int roundNumber)
    {
        var rnd = new Random();
        var shuffledPrompts = _prompts.OrderBy(x => rnd.Next()).ToList();
        
        int playerCount = players.Count;
        // Offset prompt index by round so we don't reuse prompts immediately
        int promptIndex = (roundNumber - 1) * playerCount; 

        for (int i = 0; i < playerCount; i++)
        {
            var pA = players[i];
            var pB = players[(i + 1) % playerCount];

            var promptText = (promptIndex < shuffledPrompts.Count) 
                ? shuffledPrompts[promptIndex] 
                : $"Prompt {promptIndex}";
            promptIndex++;

            var assignment = new WisecrackPromptAssignment
            {
                Text = promptText,
                AssignedPlayerIds = new List<string> { pA.ConnectionId, pB.ConnectionId }
            };
            state.Assignments.Add(assignment);
        }
    }

    private void AssignFinalCrack(List<Player> players, WisecrackState state)
    {
        // One common prompt for everyone
        var rnd = new Random();
        var prompt = _prompts[rnd.Next(_prompts.Count)]; 

        var assignment = new WisecrackPromptAssignment
        {
            Text = $"THE FINAL CRACK: {prompt}",
            AssignedPlayerIds = players.Select(p => p.ConnectionId).ToList()
        };
        state.Assignments.Add(assignment);
    }

    private void GenerateBattles(WisecrackState state)
    {
        state.Battles.Clear();
        var rnd = new Random();

        if (state.RoundNumber < 3)
        {
            // Standard Logic: 1 Battle per Assignment
            foreach (var assignment in state.Assignments)
            {
                var promptAnswers = state.Answers.Where(a => a.PromptId == assignment.PromptId).ToList();
                if (promptAnswers.Count < 2) continue;

                state.Battles.Add(new WisecrackBattle
                {
                    PromptText = assignment.Text,
                    AnswerA = promptAnswers[0],
                    AnswerB = promptAnswers[1]
                });
            }
            // Shuffle order
            state.Battles = state.Battles.OrderBy(x => rnd.Next()).ToList();
        }
        else
        {
            // Final Crack Logic
            // We have 1 assignment, N answers.
            var allAnswers = state.Answers.OrderBy(x => rnd.Next()).ToList();
            var promptText = state.Assignments.FirstOrDefault()?.Text ?? "The Final Crack";

            // Pair them up
            for (int i = 0; i < allAnswers.Count; i += 2)
            {
                if (i + 1 < allAnswers.Count)
                {
                    // Pair A vs B
                    state.Battles.Add(new WisecrackBattle
                    {
                        PromptText = promptText,
                        AnswerA = allAnswers[i],
                        AnswerB = allAnswers[i+1]
                    });
                }
                else
                {
                    // Odd one out. Pair with the first answer again.
                    // This ensures everyone battles at least once.
                    if (allAnswers.Count > 0)
                    {
                        state.Battles.Add(new WisecrackBattle
                        {
                            PromptText = promptText,
                            AnswerA = allAnswers[i], // The odd one
                            AnswerB = allAnswers[0]  // The first one (Repeats)
                        });
                    }
                }
            }
        }
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
