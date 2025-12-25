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

    public async Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not ScatterbrainState state) return;

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

            case "VETO":
                if (action.Payload.HasValue && action.Payload.Value.ValueKind == JsonValueKind.Number)
                {
                    int index = action.Payload.Value.GetInt32();
                    if (!state.Vetoes.ContainsKey(connectionId))
                    {
                        state.Vetoes[connectionId] = new List<int>();
                    }

                    var list = state.Vetoes[connectionId];
                    if (list.Contains(index))
                    {
                        list.Remove(index);
                    }
                    else
                    {
                        list.Add(index);
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
