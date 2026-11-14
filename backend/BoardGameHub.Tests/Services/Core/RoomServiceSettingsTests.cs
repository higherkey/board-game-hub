using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class RoomServiceSettingsTests : IDisposable
{
    private readonly RoomService _sut;

    public RoomServiceSettingsTests()
    {
        var adminHub = new Mock<IHubContext<AdminHub>>();
        var gameHub = new Mock<IHubContext<GameHub>>();
        var clientProxy = new Mock<IClientProxy>();
        var hubClients = new Mock<IHubClients>();
        var gsm = new Mock<GameStateManager>(gameHub.Object, new StateDiffService(), new Mock<ILogger<GameStateManager>>().Object);

        adminHub.Setup(h => h.Clients).Returns(hubClients.Object);
        gameHub.Setup(h => h.Clients).Returns(hubClients.Object);
        hubClients.Setup(c => c.All).Returns(clientProxy.Object);
        hubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(clientProxy.Object);

        var games = new List<IGameService>
        {
            new BabbleGameService(new BabbleService(), new Mock<IDictionaryService>().Object, new Mock<ILogger<BabbleGameService>>().Object)
        };
        _sut = new RoomService(games, adminHub.Object, gameHub.Object, gsm.Object, new Mock<ILogger<RoomService>>().Object);
    }

    [Fact]
    public async Task StartGame_ExtremeBoardSize_IsClampedAndGridBounded()
    {
        var room = _sut.CreateRoom("host", "Host", false, GameType.Babble);
        room.IsHostOverride = true;

        await _sut.StartGame(room.Code, new GameSettings { BoardSize = 40000 });

        room.Settings.BoardSize.Should().Be(6);
        ((BabbleState)room.GameData!).Grid.Should().HaveCount(36);
    }

    [Fact]
    public void UpdateSettings_ExtremeValues_AreClamped()
    {
        var room = _sut.CreateRoom("host", "Host", false, GameType.Babble);

        _sut.UpdateSettings(" " + room.Code.ToLowerInvariant() + " ", new GameSettings { BoardSize = 40000, TotalRounds = 999 });

        room.Settings.BoardSize.Should().Be(6);
        room.Settings.TotalRounds.Should().Be(20);
    }

    [Fact]
    public async Task StartGame_RetainedSettings_AreClampedWithoutResettingGameProgress()
    {
        var room = _sut.CreateRoom("host", "Host", false, GameType.Babble);
        room.Settings = new GameSettings
        {
            BoardSize = 7,
            TotalRounds = 999,
            TimerDurationSeconds = 100000,
            CustomCategories = Enumerable.Repeat(new string('x', 500), 30).ToList(),
            GenerativeSeed = new string('s', 500),
            LetterMode = (ScatterbrainData.LetterMode)999,
            CloverAllowPerPlayerSingleCardRotation = false
        };
        room.State = GameState.Finished;
        room.RoundNumber = 3;
        room.Players[0].Score = 42;

        var result = await _sut.StartGame(room.Code, null);

        result.Should().BeSameAs(room);
        room.Settings.BoardSize.Should().Be(6);
        room.Settings.TotalRounds.Should().Be(20);
        room.Settings.TimerDurationSeconds.Should().Be(3600);
        room.Settings.CustomCategories.Should().HaveCount(20).And.OnlyContain(c => c.Length == 100);
        room.Settings.GenerativeSeed.Should().HaveLength(100);
        room.Settings.LetterMode.Should().Be(ScatterbrainData.LetterMode.Normal);
        room.Settings.CloverAllowPerPlayerSingleCardRotation.Should().BeFalse();
        room.RoundNumber.Should().Be(4);
        room.Players[0].Score.Should().Be(42);
        var state = (BabbleState)room.GameData!;
        state.Grid.Should().HaveCount(36);
        state.TimeLeft.Should().Be(3600);
    }

    [Fact]
    public void UpdateSettings_Null_DoesNotMutateRoom()
    {
        var room = _sut.CreateRoom("host", "Host", false, GameType.Babble);
        var settings = room.Settings;
        room.RoundNumber = 3;
        room.Players[0].Score = 42;
        room.DirtyMembers.Clear();

        var result = _sut.UpdateSettings(room.Code, null!);

        result.Should().BeNull();
        room.Settings.Should().BeSameAs(settings);
        room.RoundNumber.Should().Be(3);
        room.Players[0].Score.Should().Be(42);
        room.DirtyMembers.Should().BeEmpty();
        room.StateLock.CurrentCount.Should().Be(1);
    }

    public void Dispose() => _sut.Dispose();
}
