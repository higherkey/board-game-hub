using System.Text.Json;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;

namespace BoardGameHub.Tests.Services.Games;

public class YachtGameServiceTests
{
    private readonly YachtGameService _service = new();

    private async Task<Room> Start(int players = 2)
    {
        var room = new Room { State = GameState.Playing, GameType = GameType.Yacht };
        room.Players.Add(new Player { ConnectionId = "screen", Name = "Table", IsScreen = true });
        for (var i = 1; i <= players; i++)
            room.Players.Add(new Player { ConnectionId = $"p{i}", Name = $"Player {i}" });
        await _service.StartRound(room, room.Settings);
        return room;
    }

    private Task<bool> Act(Room room, string action, object? payload = null, string? id = null) =>
        _service.HandleAction(room, new GameAction(action, payload == null ? null : JsonSerializer.SerializeToElement(payload)),
            id ?? ((YachtState)room.GameData!).ActivePlayerId);

    [Theory]
    [InlineData("Ones", new[] { 1, 1, 3, 4, 5 }, 2)]
    [InlineData("Twos", new[] { 2, 2, 2, 4, 5 }, 6)]
    [InlineData("Threes", new[] { 3, 3, 3, 4, 5 }, 9)]
    [InlineData("Fours", new[] { 4, 4, 4, 4, 5 }, 16)]
    [InlineData("Fives", new[] { 5, 5, 3, 4, 5 }, 15)]
    [InlineData("Sixes", new[] { 6, 6, 6, 6, 6 }, 30)]
    [InlineData("ThreeOfAKind", new[] { 3, 3, 3, 4, 5 }, 18)]
    [InlineData("ThreeOfAKind", new[] { 2, 2, 3, 4, 5 }, 0)]
    [InlineData("FourOfAKind", new[] { 4, 4, 4, 4, 5 }, 21)]
    [InlineData("FourOfAKind", new[] { 4, 4, 4, 3, 5 }, 0)]
    [InlineData("FullHouse", new[] { 2, 2, 3, 3, 3 }, 25)]
    [InlineData("FullHouse", new[] { 2, 2, 2, 2, 2 }, 0)]
    [InlineData("SmallStraight", new[] { 1, 2, 3, 4, 4 }, 30)]
    [InlineData("SmallStraight", new[] { 2, 3, 4, 5, 5 }, 30)]
    [InlineData("SmallStraight", new[] { 3, 4, 5, 6, 6 }, 30)]
    [InlineData("SmallStraight", new[] { 1, 2, 3, 5, 6 }, 0)]
    [InlineData("LargeStraight", new[] { 5, 2, 4, 3, 1 }, 40)]
    [InlineData("LargeStraight", new[] { 6, 2, 4, 3, 5 }, 40)]
    [InlineData("LargeStraight", new[] { 2, 2, 3, 4, 5 }, 0)]
    [InlineData("Yacht", new[] { 6, 6, 6, 6, 6 }, 50)]
    [InlineData("Yacht", new[] { 6, 6, 6, 6, 5 }, 0)]
    [InlineData("Chance", new[] { 1, 2, 3, 4, 5 }, 15)]
    public void ScoresCategories(string category, int[] dice, int expected) =>
        Assert.Equal(expected, YachtGameService.CalculateCategoryScore(category, dice));

    [Theory]
    [InlineData("FullHouse", 25)]
    [InlineData("SmallStraight", 30)]
    [InlineData("LargeStraight", 40)]
    public void ScoresJoker(string category, int expected) =>
        Assert.Equal(expected, YachtGameService.CalculateCategoryScore(category, [4, 4, 4, 4, 4], true));

    [Fact]
    public async Task InitializesOnlyHandsAndResetsScores()
    {
        var room = await Start();
        var state = Assert.IsType<YachtState>(room.GameData);
        Assert.Equal(new[] { "p1", "p2" }, state.PlayerOrder);
        Assert.Equal("p1", state.ActivePlayerId);
        Assert.Equal(0, state.RollsUsed);
        Assert.Empty(state.AvailableScores);
        Assert.Equal(1, room.Settings.TotalRounds);
        Assert.Equal(0, room.Settings.TimerDurationSeconds);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(9)]
    public async Task RejectsUnsupportedPlayerCounts(int count) =>
        await Assert.ThrowsAsync<InvalidOperationException>(() => Start(count));

    [Fact]
    public async Task RejectsOutOfTurnScreenPausedAndFinishedActions()
    {
        var room = await Start();
        Assert.False(await Act(room, "ROLL", id: "p2"));
        Assert.False(await Act(room, "ROLL", id: "screen"));
        room.IsPaused = true;
        Assert.False(await Act(room, "ROLL"));
        room.IsPaused = false;
        room.State = GameState.Finished;
        Assert.False(await Act(room, "ROLL"));
    }

    [Fact]
    public async Task PreservesHeldDiceAndLimitsRolls()
    {
        var room = await Start();
        var state = (YachtState)room.GameData!;
        Assert.False(await Act(room, "TOGGLE_DIE", new { index = 0 }));
        Assert.True(await Act(room, "ROLL"));
        Assert.All(state.Dice, value => Assert.InRange(value, 1, 6));
        var first = state.Dice[0];
        Assert.True(await Act(room, "TOGGLE_DIE", new { index = 0 }));
        Assert.True(await Act(room, "ROLL"));
        Assert.Equal(first, state.Dice[0]);
        Assert.Equal(13, state.AvailableScores.Count);
        Assert.True(await Act(room, "ROLL"));
        Assert.False(await Act(room, "ROLL"));
        Assert.False(await Act(room, "TOGGLE_DIE", new { index = 0 }));
        Assert.Equal(3, state.RollsUsed);
    }

    [Theory]
    [InlineData("null")]
    [InlineData("[]")]
    [InlineData("2")]
    [InlineData("{}")]
    [InlineData("{\"index\":\"0\"}")]
    [InlineData("{\"index\":1.5}")]
    [InlineData("{\"index\":2147483648}")]
    [InlineData("{\"index\":-1}")]
    [InlineData("{\"index\":5}")]
    public async Task RejectsMalformedHoldPayloadsWithoutThrowing(string json)
    {
        var room = await Start();
        await Act(room, "ROLL");
        Assert.False(await _service.HandleAction(room, new GameAction("TOGGLE_DIE", JsonSerializer.Deserialize<JsonElement>(json)), "p1"));
    }

    [Fact]
    public async Task HoldingAllDiceRequiresScoringOrReleasing()
    {
        var room = await Start();
        await Act(room, "ROLL");
        for (var i = 0; i < 5; i++) await Act(room, "TOGGLE_DIE", new { index = i });
        Assert.False(await Act(room, "ROLL"));
        Assert.True(await Act(room, "TOGGLE_DIE", new { index = 2 }));
        Assert.True(await Act(room, "ROLL"));
    }

    [Fact]
    public async Task ScoresFromServerDiceAndAdvancesTurn()
    {
        var room = await Start();
        var state = (YachtState)room.GameData!;
        Assert.False(await Act(room, "SCORE", new { category = "Chance" }));
        await Act(room, "ROLL");
        state.Dice = [1, 2, 3, 4, 5];
        Assert.True(await Act(room, "SCORE", new { category = "Chance", points = 9999 }));
        Assert.Equal(15, state.Scorecards["p1"].Categories["Chance"]);
        Assert.Equal(15, room.Players.Single(p => p.ConnectionId == "p1").Score);
        Assert.Equal(15, room.RoundScores["p1"]);
        Assert.Equal("p2", state.ActivePlayerId);
        Assert.Equal(0, state.RollsUsed);
        Assert.All(state.Held, held => Assert.False(held));
        Assert.Empty(state.AvailableScores);
    }

    [Fact]
    public async Task AllowsZeroAndRejectsUsedInvalidOrMissingCategories()
    {
        var room = await Start(1);
        await Act(room, "ROLL");
        var state = (YachtState)room.GameData!;
        state.Dice = [1, 2, 3, 4, 5];
        Assert.True(await Act(room, "SCORE", new { category = "Yacht" }));
        Assert.Equal(0, state.Scorecards["p1"].Categories["Yacht"]);
        await Act(room, "ROLL");
        Assert.False(await Act(room, "SCORE", new { category = "Yacht" }));
        Assert.False(await Act(room, "SCORE", new { category = "invented" }));
        Assert.False(await Act(room, "SCORE", new { category = 7 }));
        Assert.False(await Act(room, "SCORE"));
        Assert.False(await Act(room, "UNKNOWN"));
    }

    [Fact]
    public async Task UpperBonusStartsAt63AndOnlyAddsOnce()
    {
        var room = await Start(1);
        var state = (YachtState)room.GameData!;
        var card = state.Scorecards["p1"];
        foreach (var (category, value) in new[] { ("Ones", 3), ("Twos", 6), ("Threes", 9), ("Fours", 12), ("Fives", 15) })
            card.Categories[category] = value;
        await Act(room, "ROLL");
        state.Dice = [6, 6, 6, 1, 2];
        await Act(room, "SCORE", new { category = "Sixes" });
        Assert.Equal(63, card.UpperSubtotal);
        Assert.Equal(35, card.UpperBonus);
        Assert.Equal(98, card.Total);
        await Act(room, "ROLL");
        state.Dice = [1, 2, 3, 4, 5];
        await Act(room, "SCORE", new { category = "Chance" });
        Assert.Equal(113, card.Total);
    }

    [Fact]
    public async Task BonusYachtForcesMatchingUpperThenAllowsLowerJoker()
    {
        var room = await Start(1);
        var state = (YachtState)room.GameData!;
        var card = state.Scorecards["p1"];
        card.Categories["Yacht"] = 50;
        await Act(room, "ROLL");
        state.Dice = [4, 4, 4, 4, 4];
        Assert.False(await Act(room, "SCORE", new { category = "FullHouse" }));
        Assert.Equal(new[] { "Fours" }, state.AvailableScores.Keys);
        Assert.True(await Act(room, "SCORE", new { category = "Fours" }));
        Assert.Equal(100, card.YachtBonus);
        await Act(room, "ROLL");
        state.Dice = [4, 4, 4, 4, 4];
        Assert.False(await Act(room, "SCORE", new { category = "Twos" }));
        Assert.True(await Act(room, "SCORE", new { category = "FullHouse" }));
        Assert.Equal(25, card.Categories["FullHouse"]);
        Assert.Equal(200, card.YachtBonus);
        Assert.Equal(295, card.Total);
    }

    [Fact]
    public async Task ScratchedYachtDisablesBonusAndJoker()
    {
        var room = await Start(1);
        var state = (YachtState)room.GameData!;
        var card = state.Scorecards["p1"];
        card.Categories["Yacht"] = 0;
        await Act(room, "ROLL");
        state.Dice = [5, 5, 5, 5, 5];
        Assert.True(await Act(room, "SCORE", new { category = "FullHouse" }));
        Assert.Equal(0, card.Categories["FullHouse"]);
        Assert.Equal(0, card.YachtBonus);
    }

    [Fact]
    public async Task BonusYachtFallsBackToZeroUpperWhenLowerIsFull()
    {
        var room = await Start(1);
        var state = (YachtState)room.GameData!;
        var card = state.Scorecards["p1"];
        foreach (var category in YachtGameService.Categories.Skip(6)) card.Categories[category] = category == "Yacht" ? 50 : 0;
        card.Categories["Sixes"] = 0;
        await Act(room, "ROLL");
        state.Dice = [6, 6, 6, 6, 6];
        Assert.True(await Act(room, "SCORE", new { category = "Ones" }));
        Assert.Equal(0, card.Categories["Ones"]);
        Assert.Equal(100, card.YachtBonus);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(8)]
    public async Task CompletesEntireMatchAndIncludesTiedWinners(int players)
    {
        var room = await Start(players);
        var state = (YachtState)room.GameData!;
        foreach (var category in YachtGameService.Categories)
        {
            for (var i = 1; i <= players; i++)
            {
                Assert.Equal($"p{i}", state.ActivePlayerId);
                Assert.True(await Act(room, "ROLL"));
                state.Dice = [1, 2, 3, 4, 5];
                Assert.True(await Act(room, "SCORE", new { category }));
            }
        }
        Assert.Equal("GameOver", state.Phase);
        Assert.Equal(GameState.Finished, room.State);
        Assert.Equal(players, state.WinnerIds.Count);
        Assert.All(state.Scorecards.Values, card => { Assert.Equal(13, card.Categories.Count); Assert.Equal(100, card.Total); });
        Assert.False(await Act(room, "ROLL"));
    }

    [Fact]
    public async Task StateRoundTripsRebindsAndResumesMidTurn()
    {
        var room = await Start();
        await Act(room, "ROLL");
        await Act(room, "TOGGLE_DIE", new { index = 2 });
        var serializer = new RoomStateSerializer(new[] { _service });
        var restored = serializer.Deserialize(serializer.Serialize(room));
        _service.RebindPlayer(restored, "p1", "new-p1");
        restored.Players.Single(p => p.ConnectionId == "p1").ConnectionId = "new-p1";
        var state = Assert.IsType<YachtState>(restored.GameData);
        Assert.Equal("new-p1", state.ActivePlayerId);
        Assert.Equal(new[] { "new-p1", "p2" }, state.PlayerOrder);
        Assert.True(state.Held[2]);
        Assert.True(await Act(restored, "ROLL", id: "new-p1"));
        Assert.Equal(2, state.RollsUsed);
    }

    [Fact]
    public async Task GenericEndRoundDoesNotTruncateMatch()
    {
        var room = await Start();
        await _service.EndRound(room);
        Assert.Equal(GameState.Playing, room.State);
    }
}
