using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class RoomServiceHistoryTests
{
    private readonly Mock<IGameHistoryService> _history = new();
    private readonly List<IGameService> _gameServices = new();
    private readonly RoomService _sut;

    public RoomServiceHistoryTests()
    {
        var adminHub = new Mock<IHubContext<AdminHub>>();
        var gameHub = new Mock<IHubContext<GameHub>>();
        var clients = new Mock<IHubClients>();
        var proxy = new Mock<IClientProxy>();
        adminHub.Setup(h => h.Clients).Returns(clients.Object);
        gameHub.Setup(h => h.Clients).Returns(clients.Object);
        clients.Setup(c => c.All).Returns(proxy.Object);
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(proxy.Object);
        var manager = new Mock<GameStateManager>(gameHub.Object, new StateDiffService(), new Mock<ILogger<GameStateManager>>().Object);

        var provider = new Mock<IServiceProvider>();
        provider.Setup(p => p.GetService(typeof(IGameHistoryService))).Returns(_history.Object);
        var scope = new Mock<IServiceScope>();
        scope.Setup(s => s.ServiceProvider).Returns(provider.Object);
        var factory = new Mock<IServiceScopeFactory>();
        factory.Setup(f => f.CreateScope()).Returns(scope.Object);

        _sut = new RoomService(_gameServices, adminHub.Object, gameHub.Object, manager.Object,
            new Mock<ILogger<RoomService>>().Object, factory.Object, null, null);
    }

    private sealed class FakeRoundGame : IGameService
    {
        public int FinishOnRound { get; set; } = 5;
        public GameType GameType => GameType.Scatterbrain;
        public Task StartRound(Room room, GameSettings settings) => Task.CompletedTask;
        public Task CalculateScores(Room room) => Task.CompletedTask;
        public Task EndRound(Room room)
        {
            room.RoundNumber++;
            if (room.RoundNumber >= FinishOnRound) room.State = GameState.Finished;
            return Task.CompletedTask;
        }
        public Task<bool> HandleAction(Room room, GameAction action, string connectionId) => Task.FromResult(true);
        public object DeserializeState(System.Text.Json.JsonElement json) => new object();
        public void RebindPlayer(Room room, string oldConnectionId, string newConnectionId) { }
    }

    [Fact]
    public async Task CalculateRoundScores_RecordsOnlyWhenRoundFinishesGame()
    {
        _gameServices.Add(new FakeRoundGame());
        var room = _sut.CreateRoom("a", "A", false, GameType.Scatterbrain);
        room.State = GameState.Playing;

        for (var i = 0; i < 4; i++) await _sut.CalculateRoundScores(room.Code);
        _history.Verify(h => h.RecordGameSession(It.IsAny<Room>()), Times.Never);

        await _sut.CalculateRoundScores(room.Code);
        _history.Verify(h => h.RecordGameSession(It.Is<Room>(r => r.Code == room.Code)), Times.Once);
    }

    [Fact]
    public async Task SubmitAction_FourInARowWin_RecordsOnce()
    {
        _gameServices.Add(new FourInARowGameService());
        var room = _sut.CreateRoom("red", "Red", false, GameType.FourInARow);
        _sut.JoinRoom(room.Code, "yellow", "Yellow");
        room.IsHostOverride = true;
        await _sut.StartGame(room.Code, new GameSettings());
        foreach (var column in new[] { 0, 6, 1, 6, 2, 5, 3 })
        {
            var current = ((FourInARowState)room.GameData!).CurrentPlayerId;
            await _sut.SubmitAction(room.Code, current, "DROP", System.Text.Json.JsonSerializer.SerializeToElement(new { column }));
        }

        Assert.Equal(GameState.Finished, room.State);
        _history.Verify(h => h.RecordGameSession(It.Is<Room>(r => r.Code == room.Code)), Times.Once);
    }

    [Fact]
    public async Task EndGame_RecordsOnPlayingToFinishedOnly()
    {
        var room = _sut.CreateRoom("a", "A", false, GameType.Scatterbrain);
        room.State = GameState.Playing;

        await _sut.EndGame(room.Code);
        _history.Verify(h => h.RecordGameSession(It.Is<Room>(r => r.Code == room.Code)), Times.Once);

        await _sut.EndGame(room.Code);
        Assert.Equal(GameState.Lobby, room.State);
        _history.Verify(h => h.RecordGameSession(It.IsAny<Room>()), Times.Once);
    }

    [Fact]
    public async Task RecordFailure_DoesNotThrowToCaller()
    {
        _history.Setup(h => h.RecordGameSession(It.IsAny<Room>())).ThrowsAsync(new InvalidOperationException("db"));
        var room = _sut.CreateRoom("a", "A", false, GameType.Scatterbrain);
        room.State = GameState.Playing;

        var result = await _sut.EndGame(room.Code);

        Assert.Same(room, result);
    }

    [Fact]
    public async Task EndGame_RecordsSnapshotOfScoresAtFinish()
    {
        Room? captured = null;
        _history.Setup(h => h.RecordGameSession(It.IsAny<Room>())).Callback<Room>(r => captured = r).Returns(Task.CompletedTask);
        var room = _sut.CreateRoom("a", "A", false, GameType.Scatterbrain);
        room.State = GameState.Playing;
        room.Players[0].Score = 10;

        await _sut.EndGame(room.Code);
        room.Players[0].Score = 99;

        Assert.NotNull(captured);
        Assert.NotSame(room, captured);
        Assert.Equal(room.Code, captured!.Code);
        Assert.Equal(10, captured.Players[0].Score);
        Assert.Equal("A", captured.Players[0].Name);
    }
}
