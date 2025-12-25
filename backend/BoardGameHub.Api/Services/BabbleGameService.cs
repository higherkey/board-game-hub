using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class BabbleState
{
    public List<char> Grid { get; set; } = new();
    public List<BabbleResult> LastRoundResults { get; set; } = new();
}

public class BabbleResult
{
    public string Word { get; set; } = "";
    public bool IsOnGrid { get; set; }
    public bool IsInDictionary { get; set; } = true; // Default true for now
    public bool IsDuplicate { get; set; }
    public List<string> FoundBy { get; set; } = new(); // Player Ids
    public int Points { get; set; }
}

public class BabbleGameService : IGameService
{
    private readonly IBabbleService _babbleService;

    public BabbleGameService(IBabbleService babbleService)
    {
        _babbleService = babbleService;
    }

    public GameType GameType => GameType.Babble;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new BabbleState
        {
            Grid = _babbleService.GenerateGrid(settings.BoardSize)
        };
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null) return Task.CompletedTask;

        try 
        {
            // Must use JSON element conversion because GameData is generic object
            BabbleState state;
            if (room.GameData is JsonElement element)
            {
                state = (DeserializeState(element) as BabbleState) ?? new BabbleState();
            }
            else if (room.GameData is BabbleState typedState)
            {
                state = typedState;
            }
            else 
            {
                state = new BabbleState();
            }

            // Final safety: ensure Grid and Results are not null
            state.Grid ??= new List<char>();
            state.LastRoundResults ??= new List<BabbleResult>();

            // Ensure RoundScores is initialized for all players
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach(var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            var allFoundWords = new List<(string PlayerId, string Word)>();

            // 1. Collect all words with null safety
            foreach (var player in room.Players)
            {
                if (player == null || player.IsHost) continue;

                if (room.PlayerAnswers.TryGetValue(player.ConnectionId, out var pAnswers) && pAnswers != null)
                {
                    foreach (var word in pAnswers)
                    {
                        if (word == null) continue;
                        var cleanWord = word.Trim().ToUpperInvariant();
                        if (!string.IsNullOrWhiteSpace(cleanWord))
                        {
                            // Prevent duplicates from same player
                            if (!allFoundWords.Any(x => x.PlayerId == player.ConnectionId && x.Word == cleanWord))
                            {
                                allFoundWords.Add((player.ConnectionId, cleanWord));
                            }
                        }
                    }
                }
            }

            var results = new List<BabbleResult>();
            var grouped = allFoundWords.GroupBy(x => x.Word).OrderBy(g => g.Key);

            // 2. Process words
            foreach (var group in grouped)
            {
                var word = group.Key;
                var playerIds = group.Select(x => x.PlayerId).Distinct().ToList();
                bool onGrid = _babbleService.IsWordOnGrid(word, state.Grid);
                bool duplicate = playerIds.Count > 1;
                int points = 0;

                if (onGrid && !duplicate)
                {
                    points = _babbleService.CalculateScore(word);
                    // Award points
                    foreach(var pid in playerIds)
                    {
                        if (room.RoundScores.ContainsKey(pid)) 
                        {
                            room.RoundScores[pid] += points;
                        }
                        var pl = room.Players.FirstOrDefault(p => p.ConnectionId == pid);
                        if (pl != null) pl.Score += points;
                    }
                }

                results.Add(new BabbleResult
                {
                    Word = word,
                    IsOnGrid = onGrid,
                    IsDuplicate = duplicate,
                    FoundBy = playerIds,
                    Points = points
                });
            }

            state.LastRoundResults = results;
            room.GameData = state; // Update room state
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Babble CalculateScores: {ex.Message}");
            throw;
        }

        return Task.CompletedTask;
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_ANSWERS" && action.Payload.HasValue)
        {
             // Host is NOT allowed to submit answers
             var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
             if (player == null || player.IsHost) return Task.FromResult(false);

             if (action.Payload.Value.TryGetProperty("answers", out var answersProp) && answersProp.ValueKind == System.Text.Json.JsonValueKind.Array)
             {
                 var list = new List<string>();
                 foreach(var item in answersProp.EnumerateArray())
                 {
                     list.Add(item.GetString() ?? "");
                 }
                 room.PlayerAnswers[connectionId] = list;
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
        try 
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, IncludeFields = true };
            return json.Deserialize<BabbleState>(options) ?? new BabbleState();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deserializing BabbleState: {ex.Message}");
            return new BabbleState();
        }
    }
}
