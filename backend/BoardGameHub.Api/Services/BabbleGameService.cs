using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class BabbleState
{
    public List<char> Grid { get; set; } = new();
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
        if (room.GameData is not BabbleState state) return Task.CompletedTask;

        foreach(var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

        var allFoundWords = new List<(string PlayerId, string Word)>();

        foreach (var player in room.Players)
        {
            if (room.PlayerAnswers.TryGetValue(player.ConnectionId, out var pAnswers))
            {
                foreach (var word in pAnswers)
                {
                    var cleanWord = word.Trim().ToUpperInvariant();
                    if (!string.IsNullOrWhiteSpace(cleanWord))
                    {
                        if (!allFoundWords.Any(x => x.PlayerId == player.ConnectionId && x.Word == cleanWord))
                        {
                            allFoundWords.Add((player.ConnectionId, cleanWord));
                        }
                    }
                }
            }
        }

        var grouped = allFoundWords.GroupBy(x => x.Word);

        foreach (var group in grouped)
        {
            var word = group.Key;
            
            if (!_babbleService.IsWordOnGrid(word, state.Grid))
            {
                continue; 
            }

            if (group.Count() == 1)
            {
                var winner = group.First();
                int points = _babbleService.CalculateScore(word);
                
                room.RoundScores[winner.PlayerId] += points;
                
                var playerObj = room.Players.FirstOrDefault(p => p.ConnectionId == winner.PlayerId);
                if (playerObj != null) playerObj.Score += points;
            }
        }
        return Task.CompletedTask;
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_ANSWERS" && action.Payload.HasValue)
        {
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
        return json.Deserialize<BabbleState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new BabbleState();
    }
}
