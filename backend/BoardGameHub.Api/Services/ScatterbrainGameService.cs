using BoardGameHub.Api.Models; // For Room, Player, GameSettings
using System.Text.Json;
// Assuming ScatterbrainData is available in root or Models namespace based on previous usage

namespace BoardGameHub.Api.Services;

public enum ScatterbrainPhase
{
    Writing,
    Validation,
    Result
}

public class ScatterbrainState
{
    public ScatterbrainPhase Phase { get; set; } = ScatterbrainPhase.Writing;
    public char? CurrentLetter { get; set; }
    public List<string> Categories { get; set; } = new();
    
    // PlayerId -> List of indices (matching Categories) that are flagged/vetoed
    public Dictionary<string, List<int>> Vetoes { get; set; } = new();
}

public class ScatterbrainGameService : IGameService
{
    public GameType GameType => GameType.Scatterbrain;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new ScatterbrainState
        {
            Phase = ScatterbrainPhase.Writing
        };

        // Roll Letter
        state.CurrentLetter = ScatterbrainData.GetLetter(settings.LetterMode);
        
        // Pick List
        if (settings.CustomCategories != null && settings.CustomCategories.Any())
        {
            state.Categories = settings.CustomCategories;
        }
        else if (settings.ListId.HasValue)
        {
            state.Categories = ScatterbrainData.GetList(settings.ListId.Value);
        }
        else
        {
            state.Categories = ScatterbrainData.GetRandomList();
        }

        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room.GameData is not ScatterbrainState state) return Task.CompletedTask;

        var categoryCount = state.Categories.Count;
        var currentLetter = char.ToLowerInvariant(state.CurrentLetter ?? ' ');
        
        // Initialize scores for this round
        foreach(var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

        for (int i = 0; i < categoryCount; i++)
        {
            var answersForCategory = new List<(string PlayerId, string Answer, int Score)>();
            
            // Collect non-empty answers
            foreach (var player in room.Players)
            {
                if (room.PlayerAnswers.TryGetValue(player.ConnectionId, out var pAnswers) && i < pAnswers.Count)
                {
                    var originalAns = pAnswers[i]?.Trim() ?? "";
                    var ans = originalAns.ToLowerInvariant();
                    
                    if (!string.IsNullOrWhiteSpace(ans))
                    {
                        // Check Veto
                        bool isVetoed = state.Vetoes.TryGetValue(player.ConnectionId, out var playerVetoes) && playerVetoes.Contains(i);
                        if (isVetoed) continue;

                        // Check initial letter
                        if (ans[0] != currentLetter) continue;

                        // Calculate points (Alliteration Bonus)
                        // Rule: +1 for each word starting with the letter.
                        // e.g. "Marilyn Monroe" = 2 pts for M.
                        var words = originalAns.Split(new[] { ' ', '-' }, StringSplitOptions.RemoveEmptyEntries);
                        int points = 0;
                        foreach(var word in words)
                        {
                            if (char.ToLowerInvariant(word[0]) == currentLetter) points++;
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
                    room.RoundScores[winner.PlayerId] += winner.Score;
                    
                    var playerObj = room.Players.FirstOrDefault(p => p.ConnectionId == winner.PlayerId);
                    if (playerObj != null) playerObj.Score += winner.Score;
                }
            }
        }

        state.Phase = ScatterbrainPhase.Result;
        return Task.CompletedTask;
    }




    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room.GameData is not ScatterbrainState state) return Task.FromResult(false);

        switch (action.Type)
        {
            case "SUBMIT_ANSWERS":
                if (action.Payload.HasValue && action.Payload.Value.TryGetProperty("answers", out var answersProp) && answersProp.ValueKind == JsonValueKind.Array)
                {
                    var list = new List<string>();
                    foreach (var item in answersProp.EnumerateArray())
                    {
                        list.Add(item.GetString() ?? "");
                    }
                    room.PlayerAnswers[connectionId] = list;

                    // If everyone submitted, move to validation? 
                    // Usually we wait for timer or Host to "End Round".
                    // But if we want auto-transition:
                    if (room.PlayerAnswers.Count == room.Players.Count(p => p.IsConnected))
                    {
                        state.Phase = ScatterbrainPhase.Validation;
                        room.RoundEndTime = null; // Stop timer
                    }
                    return Task.FromResult(true);
                }
                break;

            case "TOGGLE_VETO":
                if (action.Payload.HasValue && 
                    action.Payload.Value.TryGetProperty("targetPlayerId", out var targetIdProp) &&
                    action.Payload.Value.TryGetProperty("categoryIndex", out var indexProp))
                {
                    var targetId = targetIdProp.GetString();
                    var categoryIndex = indexProp.GetInt32();
                    if (targetId == null) return Task.FromResult(false);

                    if (!state.Vetoes.ContainsKey(targetId)) state.Vetoes[targetId] = new List<int>();
                    
                    if (state.Vetoes[targetId].Contains(categoryIndex))
                        state.Vetoes[targetId].Remove(categoryIndex);
                    else
                        state.Vetoes[targetId].Add(categoryIndex);

                    return Task.FromResult(true);
                }
                break;

            case "NEXT_PHASE":
                if (state.Phase == ScatterbrainPhase.Writing)
                {
                    state.Phase = ScatterbrainPhase.Validation;
                    room.RoundEndTime = null;
                }
                else if (state.Phase == ScatterbrainPhase.Validation)
                {
                    return CalculateScores(room).ContinueWith(_ => true);
                }
                return Task.FromResult(true);
        }

        return Task.FromResult(false);
    }
    public async Task EndRound(Room room)
    {
        if (room.GameData is not ScatterbrainState state) return;

        if (state.Phase == ScatterbrainPhase.Writing)
        {
            state.Phase = ScatterbrainPhase.Validation;
            room.RoundEndTime = null;
        }
        else if (state.Phase == ScatterbrainPhase.Validation)
        {
            await CalculateScores(room);
            room.State = GameState.Finished;
        }
    }

    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<ScatterbrainState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new ScatterbrainState();
    }
}
