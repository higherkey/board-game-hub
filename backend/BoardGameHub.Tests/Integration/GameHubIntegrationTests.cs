using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace BoardGameHub.Tests.Integration;

public class GameHubIntegrationTests
{
    private readonly IRoomService _roomService;

    public GameHubIntegrationTests()
    {
        var gameServices = new List<IGameService>
        {
            new OneAndOnlyService(new Mock<ILogger<OneAndOnlyService>>().Object)
        };

        var mockAdminHub = new Mock<IHubContext<AdminHub>>();
        var adminClients = new Mock<IHubClients>();
        var adminClientProxy = new Mock<IClientProxy>();
        adminClients.Setup(c => c.All).Returns(adminClientProxy.Object);
        mockAdminHub.Setup(a => a.Clients).Returns(adminClients.Object);

        var mockGameHub = new Mock<IHubContext<GameHub>>();
        var gameClients = new Mock<IHubClients>();
        var gameClientProxy = new Mock<IClientProxy>();
        gameClients.Setup(c => c.Group(It.IsAny<string>())).Returns(gameClientProxy.Object);
        gameClients.Setup(c => c.All).Returns(gameClientProxy.Object);
        mockGameHub.Setup(g => g.Clients).Returns(gameClients.Object);

        var diffService = new StateDiffService();
        var gsmLogger = new Mock<ILogger<GameStateManager>>();
        var gameStateManager = new GameStateManager(mockGameHub.Object, diffService, gsmLogger.Object);
        var roomLogger = new Mock<ILogger<RoomService>>();

        _roomService = new RoomService(
            gameServices,
            mockAdminHub.Object,
            mockGameHub.Object,
            gameStateManager,
            roomLogger.Object);
    }

    [Fact]
    public void CreateRoom_ShouldResultInRealRoomInService()
    {
        var room = _roomService.CreateRoom("conn_host_1", "HostPlayer", true, GameType.OneAndOnly);

        room.Should().NotBeNull();
        var stats = _roomService.GetServerStats();
        stats.Rooms.Should().NotBeEmpty();
        stats.Rooms.Any(r => r.HostName == "HostPlayer").Should().BeTrue();
    }
}
