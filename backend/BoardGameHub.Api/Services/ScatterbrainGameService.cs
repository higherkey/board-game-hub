using BoardGameHub.Api.Models; // For Room, Player, GameSettings
// Assuming ScatterbrainData is available in root or Models namespace based on previous usage

namespace BoardGameHub.Api.Services;

public class ScatterbrainState
{
    public char? CurrentLetter { get; set; }
    public List<string> Categories { get; set; } = new();
}

public class ScatterbrainGameService : IGameService
{
    public GameType GameType => GameType.Scatterbrain;

    public void StartRound(Room room, GameSettings settings)
    {
        var state = new ScatterbrainState();

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
    }

    public void CalculateScores(Room room)
    {
        if (room.GameData is not ScatterbrainState state) return;

        var categoryCount = state.Categories.Count;
        
        // Initialize scores for this round
        foreach(var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

        for (int i = 0; i < categoryCount; i++)
        {
            var answersForCategory = new List<(string PlayerId, string Answer)>();
            
            // Collect non-empty answers
            foreach (var player in room.Players)
            {
                if (room.PlayerAnswers.TryGetValue(player.ConnectionId, out var pAnswers) && i < pAnswers.Count)
                {
                    var ans = pAnswers[i]?.Trim().ToLowerInvariant();
                    if (!string.IsNullOrWhiteSpace(ans))
                    {
                        answersForCategory.Add((player.ConnectionId, ans));
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
                    room.RoundScores[winner.PlayerId]++;
                    
                    var playerObj = room.Players.FirstOrDefault(p => p.ConnectionId == winner.PlayerId);
                    if (playerObj != null) playerObj.Score++;
                }
            }
        }
    }
}
