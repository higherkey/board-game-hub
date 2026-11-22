using System.Text.Json;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace BoardGameHub.Tests.Services.Core;

public class RoomLifecycleTests
{
    private readonly Mock<IGameService> _plugin = new();
    private readonly RoomService _service;
    private readonly Room _room;

    public RoomLifecycleTests()
    {
        var proxy = new Mock<IClientProxy>();
        var clients = new Mock<IHubClients>();
        clients.Setup(c => c.All).Returns(proxy.Object);
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(proxy.Object);
        var admin = new Mock<IHubContext<AdminHub>>();
        admin.Setup(h => h.Clients).Returns(clients.Object);
        var game = new Mock<IHubContext<GameHub>>();
        game.Setup(h => h.Clients).Returns(clients.Object);
        var manager = new GameStateManager(game.Object, new StateDiffService(), NullLogger<GameStateManager>.Instance);
        _plugin.SetupGet(p => p.GameType).Returns(GameType.Babble);
        _plugin.Setup(p => p.StartRound(It.IsAny<Room>(), It.IsAny<GameSettings>())).Returns(Task.CompletedTask);
        _plugin.Setup(p => p.EndRound(It.IsAny<Room>())).Callback<Room>(r =>
        {
            r.Players[0].Score += 10;
            r.RoundScores["host"] = 10;
            r.State = GameState.Finished;
        }).Returns(Task.CompletedTask);
        _service = new RoomService(new[] { _plugin.Object }, admin.Object, game.Object, manager, NullLogger<RoomService>.Instance);
        _room = _service.CreateRoom("host", "Host", false, GameType.Babble);
    }

    [Fact]
    public async Task LobbyStartWithNullSettings_RequiresReadinessAndResetsFreshGame()
    {
        Assert.Null(await _service.StartGame(_room.Code));
        Assert.Null(await _service.NextRound(_room.Code));
        Assert.Null(await _service.PlayAgain(_room.Code));
        Assert.Equal(GameState.Lobby, _room.State);
        _room.Players[0].IsReady = true;
        _room.Players[0].Score = 99;
        _room.RoundNumber = 9;
        _room.CurrentVote = new UndoVote();
        _room.StateHistory.Push("old");
        _room.NextGameVotes["host"] = GameType.Babble;
        var settings = _room.Settings;
        Assert.Same(_room, await _service.StartGame(_room.Code));
        Assert.Same(settings, _room.Settings);
        Assert.Equal(1, _room.RoundNumber);
        Assert.Equal(0, _room.Players[0].Score);
        Assert.Empty(_room.StateHistory);
        Assert.Empty(_room.NextGameVotes);
        Assert.Null(_room.CurrentVote);
        Assert.Null(_room.ResultPhase);
    }

    [Fact]
    public async Task Rounds_PreserveTotalsAndFinishAtConfiguredLimit_ThenReplayFresh()
    {
        _room.IsHostOverride = true;
        await _service.StartGame(_room.Code, new GameSettings { TotalRounds = 2 });
        Assert.Null(await _service.StartGame(_room.Code));
        Assert.Null(await _service.NextRound(_room.Code));
        Assert.Null(await _service.PlayAgain(_room.Code));
        await _service.CalculateRoundScores(_room.Code);
        Assert.Equal(ResultPhase.RoundResults, _room.ResultPhase);
        Assert.Null(await _service.CalculateRoundScores(_room.Code));
        Assert.Equal(10, _room.Players[0].Score);
        Assert.Null(await _service.StartGame(_room.Code));
        Assert.Null(await _service.PlayAgain(_room.Code));
        await _service.NextRound(" " + _room.Code.ToLowerInvariant() + " ");
        Assert.Equal(2, _room.RoundNumber);
        Assert.Equal(10, _room.Players[0].Score);
        Assert.Null(_room.ResultPhase);
        await _service.CalculateRoundScores(_room.Code);
        Assert.Equal(ResultPhase.GameOver, _room.ResultPhase);
        Assert.Equal(20, _room.Players[0].Score);
        Assert.Null(await _service.NextRound(_room.Code));
        _service.UpdateSettings(_room.Code, new GameSettings { TotalRounds = 5 });
        RoomLifecyclePolicy.Normalize(_room);
        Assert.Equal(ResultPhase.GameOver, _room.ResultPhase);
        await _service.PlayAgain(_room.Code);
        Assert.Equal(1, _room.RoundNumber);
        Assert.Equal(0, _room.Players[0].Score);
        Assert.Equal(5, _room.Settings.TotalRounds);
        _plugin.Verify(p => p.EndRound(_room), Times.Exactly(2));
    }

    [Fact]
    public async Task RealScatterbrain_StartsAtOneAndFinishesAtTwo()
    {
        var admin = Mock.Of<IHubContext<AdminHub>>();
        var game = Mock.Of<IHubContext<GameHub>>();
        var manager = new GameStateManager(game, new StateDiffService(), NullLogger<GameStateManager>.Instance);
        var service = new RoomService(new[] { new ScatterbrainGameService(NullLogger<ScatterbrainGameService>.Instance) },
            admin, game, manager, NullLogger<RoomService>.Instance);
        var room = service.CreateRoom("host", "Host", false, GameType.Scatterbrain);
        room.IsHostOverride = true;
        await service.StartGame(room.Code, new GameSettings { TotalRounds = 2 });
        Assert.Equal(1, room.RoundNumber);
        await service.CalculateRoundScores(room.Code);
        Assert.Equal(ResultPhase.RoundResults, room.ResultPhase);
        await service.NextRound(room.Code);
        Assert.Equal(2, room.RoundNumber);
        await service.CalculateRoundScores(room.Code);
        Assert.Equal(ResultPhase.GameOver, room.ResultPhase);
    }

    [Fact]
    public async Task EndGame_ForcesGameOverWithoutScoring_ThenReturnsToLobby()
    {
        _room.State = GameState.Playing;
        _room.Players[0].Score = 7;
        await _service.EndGame(_room.Code);
        Assert.Equal(ResultPhase.GameOver, _room.ResultPhase);
        Assert.Equal(7, _room.Players[0].Score);
        _plugin.Verify(p => p.EndRound(It.IsAny<Room>()), Times.Never);
        await _service.EndGame(_room.Code);
        Assert.Equal(GameState.Lobby, _room.State);
        Assert.Equal(GameType.None, _room.GameType);
        Assert.Null(_room.ResultPhase);
    }

    [Fact]
    public async Task Undo_RestoresExplicitResultPhase()
    {
        _room.StateHistory.Push(JsonSerializer.Serialize(new Room
        {
            GameType = GameType.Babble, State = GameState.Finished,
            ResultPhase = ResultPhase.RoundResults, RoundNumber = 5
        }));
        _room.State = GameState.Playing;
        await _service.RequestUndo(_room.Code, "host");
        Assert.Equal(GameState.Finished, _room.State);
        Assert.Equal(ResultPhase.RoundResults, _room.ResultPhase);
    }

    [Fact]
    public async Task ConcurrentScoring_OnlyScoresOnce()
    {
        _room.State = GameState.Playing;
        await Task.WhenAll(_service.CalculateRoundScores(_room.Code), _service.CalculateRoundScores(_room.Code));
        Assert.Equal(10, _room.Players[0].Score);
        _plugin.Verify(p => p.EndRound(_room), Times.Once);
    }

    [Fact]
    public async Task NativeCompletedResults_DoNotScoreTwice()
    {
        _room.GameData = new PoppycockState { Phase = PoppycockPhase.Result };
        _room.State = GameState.Playing;
        _room.RoundNumber = 1;
        _room.Players[0].Score = 42;
        Assert.Null(await _service.CalculateRoundScores(_room.Code));
        Assert.Equal(ResultPhase.RoundResults, _room.ResultPhase);
        Assert.Equal(42, _room.Players[0].Score);
        _plugin.Verify(p => p.EndRound(It.IsAny<Room>()), Times.Never);
    }

    [Theory]
    [InlineData(1, 1, ResultPhase.RoundResults)]
    [InlineData(2, 1, ResultPhase.RoundResults)]
    [InlineData(3, 20, ResultPhase.GameOver)]
    public void Wisecrack_AlwaysUsesThreeRounds(int round, int configured, ResultPhase expected)
    {
        _room.GameType = GameType.Wisecrack;
        _room.State = GameState.Finished;
        _room.RoundNumber = round;
        _room.Settings.TotalRounds = configured;
        RoomLifecyclePolicy.Normalize(_room);
        Assert.Equal(expected, _room.ResultPhase);
    }

    public static TheoryData<GameType, object> CompletedStates => new()
    {
        { GameType.Wisecrack, new WisecrackState { Phase = WisecrackPhase.Result } },
        { GameType.Poppycock, new PoppycockState { Phase = PoppycockPhase.Result } },
        { GameType.Deepfake, new DeepfakeState { Phase = DeepfakePhase.Results } },
        { GameType.Scatterbrain, new ScatterbrainState { Phase = ScatterbrainPhase.Result } },
        { GameType.OneAndOnly, new OneAndOnlyState { Phase = OneAndOnlyPhase.Result } },
        { GameType.UniversalTranslator, new UniversalTranslatorState { Phase = UniversalTranslatorPhase.Result } }
    };

    [Theory]
    [MemberData(nameof(CompletedStates))]
    public void NativeCompletedRound_IsNormalized(GameType type, object data)
    {
        _room.GameType = type;
        _room.GameData = data;
        _room.RoundNumber = 1;
        _room.State = GameState.Playing;
        RoomLifecyclePolicy.Normalize(_room);
        Assert.Equal(GameState.Finished, _room.State);
        Assert.Equal(ResultPhase.RoundResults, _room.ResultPhase);
    }

    public static TheoryData<GameType, object> TerminalStates => new()
    {
        { GameType.Farkle, new FarkleState { Phase = FarklePhase.GameOver } },
        { GameType.Yacht, new YachtState { Phase = "GameOver" } },
        { GameType.FourInARow, new FourInARowState { Phase = FourInARowPhase.GameOver } },
        { GameType.CloverMinded, new CloverMindedState { Phase = "GameOver" } },
        { GameType.SushiTrain, new SushiTrainState { IsGameOver = true } },
        { GameType.GreatMinds, new GreatMindsGameState { Lives = 0 } }
    };

    [Theory]
    [MemberData(nameof(TerminalStates))]
    public void NativeTerminal_NormalizesWithoutConfiguredRoundLimit(GameType type, object data)
    {
        _room.GameType = type;
        _room.GameData = data;
        _room.State = GameState.Playing;
        RoomLifecyclePolicy.Normalize(_room);
        Assert.Equal(GameState.Finished, _room.State);
        Assert.Equal(ResultPhase.GameOver, _room.ResultPhase);
    }

    [Theory]
    [InlineData(GameType.Farkle)]
    [InlineData(GameType.Yacht)]
    [InlineData(GameType.FourInARow)]
    [InlineData(GameType.CloverMinded)]
    [InlineData(GameType.SushiTrain)]
    public void LegacyForcedFinish_SelfManagedGameIsOver(GameType type)
    {
        _room.GameType = type;
        _room.State = GameState.Finished;
        RoomLifecyclePolicy.Normalize(_room);
        Assert.Equal(ResultPhase.GameOver, _room.ResultPhase);
    }

    [Fact]
    public void InteractiveRevealValidationAndUnscoredResults_RemainPlaying()
    {
        foreach (var data in new object[]
        {
            new PictophoneState { Phase = PictophonePhase.Reveal },
            new ScatterbrainState { Phase = ScatterbrainPhase.Validation },
            new SymbologyState { IsRoundActive = false },
            new CloverMindedState { Phase = "BetweenRounds" },
            new SushiTrainState { IsRoundOver = true },
            new WisecrackState { Phase = WisecrackPhase.Battling }
        })
        {
            _room.State = GameState.Playing;
            _room.GameData = data;
            RoomLifecyclePolicy.Normalize(_room);
            Assert.Equal(GameState.Playing, _room.State);
            Assert.Null(_room.ResultPhase);
        }
    }
}
