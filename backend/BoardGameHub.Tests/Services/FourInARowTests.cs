using System.Text.Json;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;

namespace BoardGameHub.Tests.Services;

public class FourInARowTests
{
    private readonly FourInARowGameService _service = new();

    private async Task<Room> NewGame()
    {
        var room = new Room
        {
            State = GameState.Playing,
            Players = [new() { ConnectionId = "table", IsScreen = true },
                       new() { ConnectionId = "red", Name = "Red" }, new() { ConnectionId = "yellow", Name = "Yellow" }]
        };
        await _service.StartRound(room, room.Settings);
        return room;
    }

    private Task<bool> Drop(Room room, int column, string? id = null) => _service.HandleAction(room,
        new GameAction("DROP", JsonSerializer.SerializeToElement(new { column })),
        id ?? ((FourInARowState)room.GameData!).CurrentPlayerId);

    [Fact]
    public async Task Start_ExcludesScreenAndInitializesUntimedMatch()
    {
        var room = await NewGame();
        var state = Assert.IsType<FourInARowState>(room.GameData);
        Assert.Equal(new[] { "red", "yellow" }, state.PlayerOrder);
        Assert.Equal("red", state.CurrentPlayerId);
        Assert.Equal(7, state.Grid.Length);
        Assert.All(state.Grid, column => Assert.Equal(new int[6], column));
        Assert.Equal(1, room.Settings.TotalRounds);
        Assert.Equal(0, room.Settings.TimerDurationSeconds);
        await _service.EndRound(room);
        Assert.Equal(GameState.Playing, room.State);
    }

    [Theory]
    [InlineData(0)] [InlineData(1)] [InlineData(3)]
    public async Task Start_RejectsInvalidPlayerCount(int count)
    {
        var room = new Room { Players = Enumerable.Range(0, count).Select(i => new Player { ConnectionId = $"p{i}" }).ToList() };
        await Assert.ThrowsAsync<InvalidOperationException>(() => _service.StartRound(room, room.Settings));
        Assert.Null(room.GameData);
    }

    [Fact]
    public async Task Drop_UsesGravityAndAlternatesTurns()
    {
        var room = await NewGame();
        Assert.True(await Drop(room, 3));
        Assert.True(await Drop(room, 3));
        var state = (FourInARowState)room.GameData!;
        Assert.Equal(1, state.Grid[3][5]);
        Assert.Equal(2, state.Grid[3][4]);
        Assert.Equal("red", state.CurrentPlayerId);
        Assert.Equal(new FourInARowCell(3, 4), state.LastMove);
        Assert.Equal(2, state.MoveCount);
    }

    [Theory]
    [InlineData("null")] [InlineData("[]")] [InlineData("{}")]
    [InlineData("{\"column\":-1}")] [InlineData("{\"column\":7}")]
    [InlineData("{\"column\":1.5}")] [InlineData("{\"column\":\"2\"}")]
    [InlineData("{\"column\":9999999999999999999}")]
    public async Task Drop_RejectsMalformedPayloadWithoutMutation(string json)
    {
        var room = await NewGame();
        Assert.False(await _service.HandleAction(room, new GameAction("DROP", JsonSerializer.Deserialize<JsonElement>(json)), "red"));
        Assert.Equal(0, ((FourInARowState)room.GameData!).MoveCount);
    }

    [Fact]
    public async Task Drop_RejectsWrongPlayerScreenUnknownActionPausedAndFinished()
    {
        var room = await NewGame();
        foreach (var id in new[] { "table", "yellow", "outsider" }) Assert.False(await Drop(room, 1, id));
        Assert.False(await _service.HandleAction(room, new GameAction("OTHER", null), "red"));
        Assert.False(await _service.HandleAction(room, new GameAction("DROP", null), "red"));
        room.IsPaused = true;
        Assert.False(await Drop(room, 1));
        room.IsPaused = false;
        room.State = GameState.Finished;
        Assert.False(await Drop(room, 1));
        Assert.Equal(0, ((FourInARowState)room.GameData!).MoveCount);
    }

    [Fact]
    public async Task Drop_RejectsFullColumnWithoutAdvancingTurn()
    {
        var room = await NewGame();
        for (var i = 0; i < 6; i++) Assert.True(await Drop(room, 0));
        Assert.False(await Drop(room, 0));
        Assert.Equal(6, ((FourInARowState)room.GameData!).MoveCount);
        Assert.Equal("red", ((FourInARowState)room.GameData!).CurrentPlayerId);
    }

    [Theory]
    [InlineData(new[] { 0, 6, 1, 6, 2, 5, 3 })]
    [InlineData(new[] { 0, 1, 0, 1, 0, 1, 0 })]
    [InlineData(new[] { 0, 1, 1, 2, 4, 2, 2, 3, 4, 3, 5, 3, 3 })]
    [InlineData(new[] { 6, 5, 5, 4, 2, 4, 4, 3, 2, 3, 1, 3, 3 })]
    public async Task Drop_DetectsEveryWinDirectionAndScoresExactlyOnce(int[] moves)
    {
        var room = await NewGame();
        foreach (var column in moves) Assert.True(await Drop(room, column));
        var state = (FourInARowState)room.GameData!;
        Assert.Equal("red", state.WinnerId);
        Assert.Equal(FourInARowPhase.GameOver, state.Phase);
        Assert.Equal(4, state.WinningCells.Count);
        Assert.All(state.WinningCells, c => Assert.Equal(1, state.Grid[c.Column][c.Row]));
        Assert.Equal(GameState.Finished, room.State);
        Assert.Null(room.RoundEndTime);
        Assert.Equal(1, room.RoundScores["red"]);
        Assert.Equal(0, room.RoundScores["yellow"]);
        Assert.False(await Drop(room, 0, "red"));
        await _service.CalculateScores(room);
        await _service.EndRound(room);
        Assert.Equal(1, room.Players.Single(p => p.ConnectionId == "red").Score);
    }

    [Fact]
    public async Task Drop_FullBoardDrawHasNoWinner()
    {
        var room = await NewGame();
        var state = (FourInARowState)room.GameData!;
        // No four consecutive tokens in any direction; leave the final red drop at (0,0).
        string[] rows = ["1122112", "2211221", "1122112", "2211221", "1122112", "2211221"];
        for (var row = 0; row < 6; row++)
            for (var col = 0; col < 7; col++) state.Grid[col][row] = rows[row][col] - '0';
        state.Grid[0][0] = 0;
        state.MoveCount = 41;
        state.CurrentPlayerId = "red";
        Assert.True(await Drop(room, 0));
        Assert.Equal(FourInARowPhase.GameOver, state.Phase);
        Assert.Equal(string.Empty, state.WinnerId);
        Assert.Empty(state.WinningCells);
        Assert.All(room.RoundScores.Values, score => Assert.Equal(0, score));
    }

    [Fact]
    public async Task RebindAndSerializedRestore_PreservePlayerColorAndTurn()
    {
        var room = await NewGame();
        Assert.True(await Drop(room, 3));
        room.GameData = JsonSerializer.SerializeToElement(room.GameData, RoomStateSerializer.GameOptions);
        _service.RebindPlayer(room, "yellow", "reconnected");
        room.Players.Single(p => p.ConnectionId == "yellow").ConnectionId = "reconnected";
        Assert.False(await Drop(room, 3, "yellow"));
        Assert.True(await Drop(room, 3, "reconnected"));
        var state = (FourInARowState)room.GameData!;
        Assert.Equal(2, state.Grid[3][4]);
        Assert.Equal("red", state.CurrentPlayerId);
        state.WinnerId = "reconnected";
        room.RoundScores["reconnected"] = 1;
        _service.RebindPlayer(room, "reconnected", "again");
        Assert.Equal("again", state.WinnerId);
        Assert.Equal(1, room.RoundScores["again"]);
    }

    [Fact]
    public async Task Restart_ClearsBoardResultAndRoundScores()
    {
        var room = await NewGame();
        foreach (var column in new[] { 0, 1, 0, 1, 0, 1, 0 }) await Drop(room, column);
        await _service.StartRound(room, room.Settings);
        var state = (FourInARowState)room.GameData!;
        Assert.Equal(0, state.MoveCount);
        Assert.Empty(state.WinnerId);
        Assert.Empty(state.WinningCells);
        Assert.Empty(room.RoundScores);
    }
}
