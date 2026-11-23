using System.Text.Json;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace BoardGameHub.Tests.Services.Core;

public class RoomTerminalActionTests
{
    private static RoomService CreateService(params IGameService[] plugins)
    {
        var clients = new Mock<IHubClients>();
        var proxy = Mock.Of<IClientProxy>();
        clients.Setup(c => c.All).Returns(proxy);
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(proxy);
        var admin = new Mock<IHubContext<AdminHub>>();
        var game = new Mock<IHubContext<GameHub>>();
        admin.Setup(h => h.Clients).Returns(clients.Object);
        game.Setup(h => h.Clients).Returns(clients.Object);
        var manager = new GameStateManager(game.Object, new StateDiffService(), NullLogger<GameStateManager>.Instance);
        return new RoomService(plugins, admin.Object, game.Object, manager, NullLogger<RoomService>.Instance);
    }

    [Theory]
    [InlineData(GameType.Farkle)]
    [InlineData(GameType.SushiTrain)]
    public async Task ManualFinish_RejectsNativeGameplayBeforeUndoSnapshot(GameType type)
    {
        IGameService plugin = type == GameType.Farkle
            ? new FarkleService(NullLogger<FarkleService>.Instance, Mock.Of<IServiceProvider>())
            : new SushiTrainGameService(NullLogger<SushiTrainGameService>.Instance);
        var service = CreateService(plugin);
        var room = service.CreateRoom("host", "Host", false, type);
        room.State = GameState.Playing;
        string action;
        JsonElement? payload = null;
        if (type == GameType.Farkle)
        {
            room.GameData = new FarkleState
            {
                Phase = FarklePhase.Picking, ActivePlayerId = "host", CurrentTurnScore = 500,
                PlayerStates = new() { ["host"] = new() { PlayerId = "host" } }
            };
            action = "BANK";
        }
        else
        {
            await plugin.StartRound(room, room.Settings);
            var state = (SushiTrainState)room.GameData!;
            payload = JsonSerializer.SerializeToElement(new { cardId = state.PlayerStates["host"].Hand[0].Id });
            action = "SUBMIT_SELECTION";
        }
        await service.EndGame(room.Code);
        var before = JsonSerializer.Serialize(room.GameData);
        Assert.Null(await service.SubmitAction(room.Code, "host", action, payload));
        Assert.Equal(before, JsonSerializer.Serialize(room.GameData));
        Assert.Empty(room.StateHistory);
        Assert.Equal(0, room.Players[0].Score);
        Assert.Equal(ResultPhase.GameOver, room.ResultPhase);
    }

    private sealed class FarklingRandom : Random
    {
        private readonly Queue<int> _roll = new(new[] { 2, 2, 3, 4, 6 });
        public override int Next(int minValue, int maxValue) => _roll.Dequeue();
    }

    [Fact]
    public async Task QueuedRejectedFarkleRoll_DoesNotSaveFarkledStateAndUndoRestoresPicking()
    {
        var callbackRooms = new Mock<IRoomService>();
        var callbackManager = new GameStateManager(Mock.Of<IHubContext<GameHub>>(), new StateDiffService(), NullLogger<GameStateManager>.Instance);
        var services = new ServiceCollection();
        services.AddSingleton(callbackRooms.Object);
        services.AddSingleton(callbackManager);
        using var provider = services.BuildServiceProvider();
        var plugin = new FarkleService(NullLogger<FarkleService>.Instance, provider, new FarklingRandom());
        using var service = CreateService(plugin);
        var room = service.CreateRoom("host", "Host", false, GameType.Farkle);
        room.State = GameState.Playing;
        var scheduled = new FarkleState
        {
            RoomCode = room.Code, Phase = FarklePhase.Picking, ActivePlayerId = "host",
            PlayerStates = new() { ["host"] = new() { PlayerId = "host" } },
            Dice = new()
            {
                new() { Value = 1, IsReserved = true }, new(), new(), new(), new(), new()
            }
        };
        room.GameData = scheduled;
        callbackRooms.Setup(r => r.GetRoom(room.Code)).Returns(room);
        await room.StateLock.WaitAsync();
        var firstRoll = service.SubmitAction(room.Code, "host", "ROLL", null);
        var rejectedRoll = service.SubmitAction(room.Code, "host", "ROLL", null);
        room.StateLock.Release();
        Assert.Same(room, await firstRoll);
        Assert.Null(await rejectedRoll);
        Assert.Equal(FarklePhase.Farkled, scheduled.Phase);
        Assert.Single(room.StateHistory);
        Assert.Same(room, await service.RequestUndo(room.Code, "host"));
        var restored = Assert.IsType<FarkleState>(room.GameData);
        Assert.NotSame(scheduled, restored);
        Assert.Equal(FarklePhase.Picking, restored.Phase);
        Assert.True(restored.Dice[0].IsReserved);
        Assert.Empty(room.StateHistory);
        var before = JsonSerializer.Serialize(room);
        await plugin.ExecuteAutoAdvance(room.Code, scheduled);
        Assert.Equal(before, JsonSerializer.Serialize(room));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task RejectedOrThrowingAction_DoesNotCommitUndoSnapshot(bool throws)
    {
        var plugin = new Mock<IGameService>();
        plugin.SetupGet(p => p.GameType).Returns(GameType.Babble);
        var action = plugin.Setup(p => p.HandleAction(It.IsAny<Room>(), It.IsAny<GameAction>(), "host"));
        if (throws) action.ThrowsAsync(new InvalidOperationException("Rejected"));
        else action.ReturnsAsync(false);
        using var service = CreateService(plugin.Object);
        var room = service.CreateRoom("host", "Host", false, GameType.Babble);
        room.State = GameState.Playing;
        if (throws)
            await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitAction(room.Code, "host", "MOVE", null));
        else
            Assert.Null(await service.SubmitAction(room.Code, "host", "MOVE", null));
        Assert.Empty(room.StateHistory);
    }

    [Fact]
    public async Task QueuedAction_UsesCurrentGamePluginAfterAcquiringLock()
    {
        var oldPlugin = new Mock<IGameService>();
        oldPlugin.SetupGet(p => p.GameType).Returns(GameType.Babble);
        var currentPlugin = new Mock<IGameService>();
        currentPlugin.SetupGet(p => p.GameType).Returns(GameType.Farkle);
        currentPlugin.Setup(p => p.HandleAction(It.IsAny<Room>(), It.IsAny<GameAction>(), "host")).ReturnsAsync(true);
        var service = CreateService(oldPlugin.Object, currentPlugin.Object);
        var room = service.CreateRoom("host", "Host", false, GameType.Babble);
        room.State = GameState.Playing;
        await room.StateLock.WaitAsync();
        var pending = service.SubmitAction(room.Code, "host", "BANK", null);
        Assert.False(pending.IsCompleted);
        room.GameType = GameType.Farkle;
        room.StateLock.Release();
        Assert.Same(room, await pending);
        oldPlugin.Verify(p => p.HandleAction(It.IsAny<Room>(), It.IsAny<GameAction>(), It.IsAny<string>()), Times.Never);
        currentPlugin.Verify(p => p.HandleAction(room, It.IsAny<GameAction>(), "host"), Times.Once);
    }

    [Fact]
    public async Task NativeCompletedPhase_IsNormalizedBeforeActionGuard()
    {
        var plugin = new Mock<IGameService>();
        plugin.SetupGet(p => p.GameType).Returns(GameType.Poppycock);
        var service = CreateService(plugin.Object);
        var room = service.CreateRoom("host", "Host", false, GameType.Poppycock);
        room.State = GameState.Playing;
        room.GameData = new PoppycockState { Phase = PoppycockPhase.Result };
        Assert.Null(await service.SubmitAction(room.Code, "host", "SUBMIT_VOTE", null));
        Assert.Equal(GameState.Finished, room.State);
        Assert.Empty(room.StateHistory);
        plugin.Verify(p => p.HandleAction(It.IsAny<Room>(), It.IsAny<GameAction>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task LobbyAction_IsRejectedWithoutCallingPluginOrSavingUndo()
    {
        var plugin = new Mock<IGameService>();
        plugin.SetupGet(p => p.GameType).Returns(GameType.Babble);
        var service = CreateService(plugin.Object);
        var room = service.CreateRoom("host", "Host", false, GameType.Babble);
        Assert.Null(await service.SubmitAction(room.Code, "host", "VALIDATE_WORD", null));
        plugin.Verify(p => p.HandleAction(It.IsAny<Room>(), It.IsAny<GameAction>(), It.IsAny<string>()), Times.Never);
        Assert.Empty(room.StateHistory);
    }

    [Fact]
    public async Task FinishedBabble_HostCanReviewWordsButGuestCannot()
    {
        var babble = new Mock<IBabbleService>();
        babble.Setup(b => b.IsWordOnGrid("WORD", It.IsAny<List<char>>())).Returns(true);
        babble.Setup(b => b.CalculateScore("WORD")).Returns(1);
        var plugin = new BabbleGameService(babble.Object, Mock.Of<IDictionaryService>(), NullLogger<BabbleGameService>.Instance);
        var service = CreateService(plugin);
        var room = service.CreateRoom("host", "Host", false, GameType.Babble);
        service.JoinRoom(room.Code, "guest", "Guest");
        room.State = GameState.Finished;
        room.ResultPhase = ResultPhase.RoundResults;
        room.PlayerAnswers["guest"] = new() { "WORD" };
        var state = new BabbleState { LastRoundResults = new() { new() { Word = "WORD" } } };
        room.GameData = state;
        var payload = JsonSerializer.SerializeToElement(new { word = "WORD", isValid = true });
        Assert.Null(await service.SubmitAction(room.Code, "guest", "VALIDATE_WORD", payload));
        Assert.False(state.LastRoundResults[0].IsHostValidated);
        Assert.Same(room, await service.SubmitAction(room.Code, "host", "VALIDATE_WORD", payload));
        Assert.True(state.LastRoundResults[0].IsHostValidated);
        Assert.Equal(1, room.Players.Single(p => p.ConnectionId == "guest").Score);
        Assert.Equal(ResultPhase.RoundResults, room.ResultPhase);
    }

    [Fact]
    public async Task FinishedPictophone_AllowsPageReviewAndStars()
    {
        var service = CreateService(new PictophoneService(NullLogger<PictophoneService>.Instance));
        var room = service.CreateRoom("host", "Host", false, GameType.Pictophone);
        service.JoinRoom(room.Code, "guest", "Guest");
        var state = new PictophoneState
        {
            Phase = PictophonePhase.Reveal, ShowcaseBookIndex = 0, ShowcasePageIndex = 0,
            Books = new() { new() { Pages = new() { new(), new() } } }
        };
        room.State = GameState.Finished;
        room.ResultPhase = ResultPhase.RoundResults;
        room.GameData = state;
        Assert.Null(await service.SubmitAction(room.Code, "guest", "REVEAL_NEXT", null));
        Assert.Equal(0, state.ShowcasePageIndex);
        Assert.Same(room, await service.SubmitAction(room.Code, "host", "REVEAL_NEXT", null));
        Assert.Equal(1, state.ShowcasePageIndex);
        Assert.Same(room, await service.SubmitAction(room.Code, "guest", "STAR_PAGE", JsonSerializer.SerializeToElement(new { bookIndex = 0, pageIndex = 1 })));
        Assert.Contains("guest", state.Books[0].Pages[1].Stars);
        Assert.Null(await service.SubmitAction(room.Code, "outsider", "STAR_PAGE", JsonSerializer.SerializeToElement(new { bookIndex = 0, pageIndex = 1 })));
        Assert.Equal(ResultPhase.RoundResults, room.ResultPhase);
    }
}
