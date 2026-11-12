using System.Text.Json;
using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services.Games;

/// <summary>Server-authoritative 13-category dice game. RoomService owns the state lock.</summary>
public class YachtGameService : BaseGameService<YachtState>
{
    public static readonly string[] Categories =
    ["Ones", "Twos", "Threes", "Fours", "Fives", "Sixes", "ThreeOfAKind", "FourOfAKind",
     "FullHouse", "SmallStraight", "LargeStraight", "Yacht", "Chance"];

    public override GameType GameType => GameType.Yacht;

    public override Task StartRound(Room room, GameSettings settings)
    {
        var players = room.Players.Where(p => !p.IsScreen).ToList();
        if (players.Count is < 1 or > 8)
            throw new InvalidOperationException("Yacht requires 1–8 Hand players.");

        var state = new YachtState { PlayerOrder = players.Select(p => p.ConnectionId).ToList() };
        foreach (var player in players)
        {
            state.Scorecards[player.ConnectionId] = new YachtScorecard { PlayerName = player.Name };
            player.Score = 0;
        }
        state.ActivePlayerId = state.PlayerOrder[0];
        room.GameData = state;
        room.RoundScores.Clear();
        // One complete match is one platform round; all 13 turns are managed by this service.
        settings.TotalRounds = 1;
        settings.TimerDurationSeconds = 0;
        return Task.CompletedTask;
    }

    public override Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        var state = GetState(room);
        if (state == null || room.State != GameState.Playing || room.IsPaused || state.Phase != "Playing" ||
            state.ActivePlayerId != connectionId || !state.Scorecards.ContainsKey(connectionId) ||
            !room.Players.Any(p => p.ConnectionId == connectionId && !p.IsScreen))
            return Task.FromResult(false);

        var accepted = action.Type switch
        {
            "ROLL" => Roll(state),
            "TOGGLE_DIE" => ToggleDie(state, action.Payload),
            "SCORE" => Score(room, state, action.Payload),
            _ => false
        };
        return Task.FromResult(accepted);
    }

    private static bool Roll(YachtState state)
    {
        if (state.RollsUsed >= 3 || (state.RollsUsed > 0 && state.Held.All(held => held))) return false;
        for (var i = 0; i < 5; i++)
            if (!state.Held[i]) state.Dice[i] = Random.Shared.Next(1, 7);
        state.RollsUsed++;
        UpdateAvailableScores(state);
        return true;
    }

    private static bool ToggleDie(YachtState state, JsonElement? payload)
    {
        if (state.RollsUsed is < 1 or >= 3 || !TryProperty(payload, "index", out var indexElement) ||
            indexElement.ValueKind != JsonValueKind.Number || !indexElement.TryGetInt32(out var index) || index is < 0 or > 4)
            return false;
        state.Held[index] = !state.Held[index];
        return true;
    }

    private static bool TryProperty(JsonElement? payload, string name, out JsonElement value)
    {
        value = default;
        return payload is { ValueKind: JsonValueKind.Object } element && element.TryGetProperty(name, out value);
    }

    private static bool Score(Room room, YachtState state, JsonElement? payload)
    {
        if (state.RollsUsed == 0 || !TryProperty(payload, "category", out var categoryElement) ||
            categoryElement.ValueKind != JsonValueKind.String) return false;
        var category = categoryElement.GetString()!;
        // Recalculate rather than trust a client payload or a restored preview.
        UpdateAvailableScores(state);
        if (!state.AvailableScores.TryGetValue(category, out var points)) return false;

        var card = state.Scorecards[state.ActivePlayerId];
        if (HasBonusYacht(state.Dice, card)) card.YachtBonus += 100;
        card.Categories.Add(category, points);
        UpdateTotals(card);
        state.LastMove = $"{card.PlayerName} scored {points} in {category}.";
        SyncScores(room, state);

        if (state.Scorecards.Values.All(c => c.Categories.Count == Categories.Length))
        {
            state.Phase = "GameOver";
            var best = state.Scorecards.Values.Max(c => c.Total);
            state.WinnerIds = state.PlayerOrder.Where(id => state.Scorecards[id].Total == best).ToList();
            state.AvailableScores.Clear();
            room.State = GameState.Finished;
            room.RoundEndTime = null;
        }
        else
        {
            var next = (state.PlayerOrder.IndexOf(state.ActivePlayerId) + 1) % state.PlayerOrder.Count;
            state.ActivePlayerId = state.PlayerOrder[next];
            state.TurnNumber = state.Scorecards[state.ActivePlayerId].Categories.Count + 1;
            state.RollsUsed = 0;
            state.Dice = new int[5];
            state.Held = new bool[5];
            state.AvailableScores.Clear();
        }
        return true;
    }

    public static int CalculateCategoryScore(string category, int[] dice, bool joker = false)
    {
        if (dice.Length != 5 || dice.Any(d => d is < 1 or > 6)) return 0;
        var upperIndex = Array.IndexOf(Categories, category);
        if (upperIndex is >= 0 and < 6) return dice.Where(d => d == upperIndex + 1).Sum();
        var counts = dice.GroupBy(d => d).Select(g => g.Count()).ToArray();
        var distinct = dice.Distinct().ToHashSet();
        var smallStraight = Enumerable.Range(1, 3).Any(start => Enumerable.Range(start, 4).All(distinct.Contains));
        var largeStraight = distinct.Count == 5 && dice.Max() - dice.Min() == 4;
        return category switch
        {
            "ThreeOfAKind" => counts.Max() >= 3 ? dice.Sum() : 0,
            "FourOfAKind" => counts.Max() >= 4 ? dice.Sum() : 0,
            "FullHouse" => joker || (counts.Contains(3) && counts.Contains(2)) ? 25 : 0,
            "SmallStraight" => joker || smallStraight ? 30 : 0,
            "LargeStraight" => joker || largeStraight ? 40 : 0,
            "Yacht" => counts.Max() == 5 ? 50 : 0,
            "Chance" => dice.Sum(),
            _ => 0
        };
    }

    private static bool HasBonusYacht(int[] dice, YachtScorecard card) =>
        dice.All(d => d == dice[0]) && card.Categories.GetValueOrDefault("Yacht") == 50;

    private static void UpdateAvailableScores(YachtState state)
    {
        var card = state.Scorecards[state.ActivePlayerId];
        var joker = HasBonusYacht(state.Dice, card);
        var choices = Categories.Where(c => !card.Categories.ContainsKey(c));
        if (joker)
        {
            var matchingUpper = Categories[state.Dice[0] - 1];
            if (!card.Categories.ContainsKey(matchingUpper))
                choices = new[] { matchingUpper };
            else if (Categories.Skip(6).Any(c => !card.Categories.ContainsKey(c)))
                choices = Categories.Skip(6).Where(c => !card.Categories.ContainsKey(c));
        }
        state.AvailableScores = choices.ToDictionary(c => c, c => CalculateCategoryScore(c, state.Dice, joker));
    }

    private static void UpdateTotals(YachtScorecard card)
    {
        card.UpperSubtotal = Categories.Take(6).Sum(c => card.Categories.GetValueOrDefault(c));
        card.UpperBonus = card.UpperSubtotal >= 63 ? 35 : 0;
        card.Total = card.Categories.Values.Sum() + card.UpperBonus + card.YachtBonus;
    }

    private static void SyncScores(Room room, YachtState state)
    {
        foreach (var (id, card) in state.Scorecards)
        {
            room.RoundScores[id] = card.Total;
            var player = room.Players.FirstOrDefault(p => p.ConnectionId == id);
            if (player != null) player.Score = card.Total;
        }
    }

    public override Task CalculateScores(Room room)
    {
        var state = GetState(room);
        if (state != null) SyncScores(room, state);
        return Task.CompletedTask;
    }

    public override Task EndRound(Room room)
    {
        // The scorecard, not a timer or generic end-round request, determines completion.
        return CalculateScores(room);
    }

    public override void RebindPlayer(Room room, string oldConnectionId, string newConnectionId)
    {
        var state = GetState(room);
        if (state == null || !state.Scorecards.Remove(oldConnectionId, out var card)) return;
        state.Scorecards[newConnectionId] = card;
        state.PlayerOrder = state.PlayerOrder.Select(id => id == oldConnectionId ? newConnectionId : id).ToList();
        state.WinnerIds = state.WinnerIds.Select(id => id == oldConnectionId ? newConnectionId : id).ToList();
        if (state.ActivePlayerId == oldConnectionId) state.ActivePlayerId = newConnectionId;
        if (room.RoundScores.Remove(oldConnectionId, out var score)) room.RoundScores[newConnectionId] = score;
    }
}
