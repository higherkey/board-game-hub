using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class RoomServiceSettingsTests
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

        _sut.UpdateSettings(room.Code, new GameSettings { BoardSize = 40000, TotalRounds = 999 });

        room.Settings.BoardSize.Should().Be(6);
        room.Settings.TotalRounds.Should().Be(50);
    }
}
