using BoardGameHub.Api.Models;

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

    public void StartRound(Room room, GameSettings settings)
    {
        var state = new BabbleState
        {
            Grid = _babbleService.GenerateGrid(settings.BoardSize)
        };
        room.GameData = state;
    }

    public void CalculateScores(Room room)
    {
        if (room.GameData is not BabbleState state) return;

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
    }
}
