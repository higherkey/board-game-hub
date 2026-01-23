using BoardGameHub.Api.Models; // For Room, Player, GameSettings
using Microsoft.Extensions.Logging;
using System.Text.Json;
// Assuming ScatterbrainData is available in root or Models namespace based on previous usage

namespace BoardGameHub.Api.Services;

public enum ScatterbrainPhase
{
    Writing,
    Validation,
    Result
}

public class ChallengeRequest
{
    public string TargetPlayerId { get; set; } = string.Empty;
    public int CategoryIndex { get; set; }
}

public class ChallengeState
{
    public string TargetPlayerId { get; set; } = string.Empty;
    public int CategoryIndex { get; set; }
    public string ChallengerId { get; set; } = string.Empty;
    public Dictionary<string, bool> Votes { get; set; } = new(); // PlayerId -> Approve (True = Keep, False = Reject)
}

public class ScatterbrainState
{
    public ScatterbrainPhase Phase { get; set; } = ScatterbrainPhase.Writing;
    public char? CurrentLetter { get; set; }
    public List<string> Categories { get; set; } = new();
    
    // PlayerId -> List of indices (matching Categories) that are flagged/vetoed
    public Dictionary<string, List<int>> Vetoes { get; set; } = new();

    public ChallengeState? ActiveChallenge { get; set; }
}

public class ScatterbrainGameService : IGameService
{
    private readonly ILogger<ScatterbrainGameService> _logger;
    public GameType GameType => GameType.Scatterbrain;

    public ScatterbrainGameService(ILogger<ScatterbrainGameService> logger)
    {
        _logger = logger;
    }

    public Task StartRound(Room room, GameSettings settings)
    {
        _logger.LogInformation("Starting Scatterbrain round in room {Code}", room.Code);
        // Pick random letter based on mode
        room.GameData = new ScatterbrainState
        {
            CurrentLetter = ScatterbrainData.GetLetter(room.Settings.LetterMode),
            Categories = room.Settings.IsGenerative && !string.IsNullOrEmpty(room.Settings.GenerativeSeed)
                ? ScatterbrainData.GenerateList(room.Settings.GenerativeSeed).Take(12).ToList()
                : room.Settings.ListId.HasValue 
                    ? ScatterbrainData.GetList(room.Settings.ListId.Value).Take(12).ToList()
                    : ScatterbrainData.GetRandomList().Take(12).ToList()
        };

        room.State = GameState.Playing;
        room.RoundEndTime = DateTime.UtcNow.AddSeconds(room.Settings.TimerDurationSeconds);
        room.RoundNumber++;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not ScatterbrainState state) return Task.CompletedTask;

        try
        {
            var categoryCount = state.Categories.Count;
            var currentLetter = char.ToLowerInvariant(state.CurrentLetter ?? ' ');

            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            for (int i = 0; i < categoryCount; i++)
            {
                var answersForCategory = new List<(string PlayerId, string Answer, int Score)>();

                // Collect non-empty answers
                foreach (var player in room.Players)
                {
                    if (player == null) continue;
                    if (room.PlayerAnswers.TryGetValue(player.ConnectionId, out var pAnswers) && pAnswers != null && i < pAnswers.Count)
                    {
                        var originalAns = pAnswers[i]?.Trim() ?? "";
                        var ans = originalAns.ToLowerInvariant();

                        if (!string.IsNullOrWhiteSpace(ans))
                        {
                            // Check Veto
                            bool isVetoed = state.Vetoes.TryGetValue(player.ConnectionId, out var playerVetoes) && playerVetoes != null && playerVetoes.Contains(i);
                            if (isVetoed) continue;

                            // Check initial letter
                            if (ans.Length > 0 && ans[0] != currentLetter) continue;

                            // Calculate points (Alliteration Bonus)
                            var words = originalAns.Split(new[] { ' ', '-' }, StringSplitOptions.RemoveEmptyEntries);
                            int points = 0;
                            foreach (var word in words)
                            {
                                if (word.Length > 0 && char.ToLowerInvariant(word[0]) == currentLetter) points++;
                            }

                            if (points > 0)
                            {
                                answersForCategory.Add((player.ConnectionId, ans, points));
                            }
                        }
                    }
                }

                // Group by answer text to find duplicates
                var grouped = answersForCategory.GroupBy(x => x.Answer);

                foreach (var group in grouped)
                {
                    // Unique answer!
                    if (group.Count() == 1)
                    {
                        var winner = group.First();
                        if (room.RoundScores.ContainsKey(winner.PlayerId))
                        {
                            room.RoundScores[winner.PlayerId] += winner.Score;
                        }

                        var playerObj = room.Players.FirstOrDefault(p => p.ConnectionId == winner.PlayerId);
                        if (playerObj != null) playerObj.Score += winner.Score;
                    }
                }
            }

            state.Phase = ScatterbrainPhase.Result;
            room.GameData = state;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Scatterbrain CalculateScores: {ex.Message}");
            throw;
        }
        return Task.CompletedTask;
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room.GameData is not ScatterbrainState state) return Task.FromResult(false);

        switch (action.Type)
        {
            case "SUBMIT_ANSWER":
                if (action.Payload.HasValue)
                {
                    try
                    {
                        var answers = action.Payload.Value.Deserialize<List<string>>();
                        if (answers != null)
                        {
                            room.PlayerAnswers[connectionId] = answers;
                            return Task.FromResult(true);
                        }
                    }
                    catch
                    {
                        return Task.FromResult(false);
                    }
                }
                break;

            case "TOGGLE_VETO":
                if (action.Payload.HasValue)
                {
                    try
                    {
                        var data = action.Payload.Value.Deserialize<ChallengeRequest>(); // Reuse same model
                        if (data != null)
                        {
                            if (!state.Vetoes.ContainsKey(data.TargetPlayerId))
                            {
                                state.Vetoes[data.TargetPlayerId] = new List<int>();
                            }

                            var list = state.Vetoes[data.TargetPlayerId];
                            if (list.Contains(data.CategoryIndex))
                            {
                                list.Remove(data.CategoryIndex);
                            }
                            else
                            {
                                list.Add(data.CategoryIndex);
                            }
                            return Task.FromResult(true);
                        }
                    }
                    catch { }
                }
                break;
            case "CHALLENGE_WORD":
                if (action.Payload.HasValue && state.Phase == ScatterbrainPhase.Validation)
                {
                    try
                    {
                        var data = action.Payload.Value.Deserialize<ChallengeRequest>();
                        if (data != null)
                        {
                            state.ActiveChallenge = new ChallengeState
                            {
                                TargetPlayerId = data.TargetPlayerId,
                                CategoryIndex = data.CategoryIndex,
                                ChallengerId = connectionId
                            };
                            return Task.FromResult(true);
                        }
                    }
                    catch { }
                }
                break;

            case "VOTE_WORD":
                if (action.Payload.HasValue && state.ActiveChallenge != null)
                {
                    bool approve = action.Payload.Value.GetProperty("approve").GetBoolean();
                    state.ActiveChallenge.Votes[connectionId] = approve;

                    // If everyone has voted (except maybe the target if we want to exclude them, 
                    // but usually everyone can vote)
                    var playersToVote = room.Players.Count;
                    if (state.ActiveChallenge.Votes.Count >= playersToVote)
                    {
                        // Resolve Challenge
                        int yesCount = state.ActiveChallenge.Votes.Values.Count(v => v);
                        int noCount = state.ActiveChallenge.Votes.Values.Count(v => !v);

                        // Official rule tie-break: challenged player's vote doesn't count if tie? 
                        // Let's just do simple majority. Tie = Approved (Keep).
                        if (noCount > yesCount)
                        {
                            // REJECTED
                            if (!state.Vetoes.ContainsKey(state.ActiveChallenge.TargetPlayerId))
                                state.Vetoes[state.ActiveChallenge.TargetPlayerId] = new List<int>();
                            
                            if (!state.Vetoes[state.ActiveChallenge.TargetPlayerId].Contains(state.ActiveChallenge.CategoryIndex))
                                state.Vetoes[state.ActiveChallenge.TargetPlayerId].Add(state.ActiveChallenge.CategoryIndex);
                        }
                        else
                        {
                            // ACCEPTED (or Tie) -> Ensure it's not vetoed
                            if (state.Vetoes.ContainsKey(state.ActiveChallenge.TargetPlayerId))
                                state.Vetoes[state.ActiveChallenge.TargetPlayerId].Remove(state.ActiveChallenge.CategoryIndex);
                        }

                        state.ActiveChallenge = null;
                    }
                    return Task.FromResult(true);
                }
                break;

            case "NEXT_PHASE":
                if (state.Phase == ScatterbrainPhase.Writing)
                {
                    state.Phase = ScatterbrainPhase.Validation;
                    return Task.FromResult(true);
                }
                else if (state.Phase == ScatterbrainPhase.Validation)
                {
                    // Transition to Result -> This is effectively EndRound
                    // Use the standardized logic
                    // We can't await EndRound easily here because HandleAction returns Task<bool> and EndRound is Task.
                    // But we can just call it and return true, letting it run. Await is better though.
                    // Actually, simpler: Set phase to Result?
                    // CalculateScores sets phase to Result. 
                    // Let's call EndRound.
                    // Warning: We need to fire the state update. RoomService usually does this after HandleAction returns true.
                    // If we call EndRound, it modifies state.
                    
                    // We need to execute the async EndRound.
                    _ = EndRound(room); 
                    return Task.FromResult(true);
                }
                break;
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
        return json.Deserialize<ScatterbrainState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new ScatterbrainState();
    }
}
