using System.Security.Claims;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Hubs;

public class AdminHubTests
{
    private readonly Mock<IRoomService> _mockRoomService;
    private readonly AdminHub _sut;
    private readonly Mock<IHubCallerClients> _mockClients;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;

    public AdminHubTests()
    {
        _mockRoomService = new Mock<IRoomService>();
        _sut = new AdminHub(_mockRoomService.Object);

        _mockClients = new Mock<IHubCallerClients>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockSingleClientProxy = new Mock<ISingleClientProxy>();
        
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(_mockSingleClientProxy.Object);
        
        _sut.Clients = _mockClients.Object;
    }

    [Fact]
    public async Task GetStats_ShouldReturnRoomServiceStats()
    {
        // Arrange
        var stats = new ServerStats { ActiveRooms = 3 };
        _mockRoomService.Setup(r => r.GetServerStats()).Returns(stats);

        // Act
        var result = await _sut.GetStats();

        // Assert
        result.Should().BeEquivalentTo(stats);
    }

    [Fact]
    public async Task KickPlayer_ShouldRemovePlayerAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "ABCD", Players = new List<Player> { new Player { Name = "p1", ConnectionId = "conn1" } } };
        _mockRoomService.Setup(r => r.GetRoom("ABCD")).Returns(room);

        // Act
        await _sut.KickPlayer("ABCD", "conn1");

        // Assert
        _mockRoomService.Verify(r => r.RemovePlayer("conn1"), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
        _mockSingleClientProxy.Verify(c => c.SendCoreAsync("Kicked", Array.Empty<object>(), default), Times.Once);
    }

    [Fact]
    public async Task SetHostPlayer_ShouldSetHostAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "ABCD" };
        _mockRoomService.Setup(r => r.SetHostPlayer("ABCD", "conn1")).Returns(room);

        // Act
        await _sut.SetHostPlayer("ABCD", "conn1");

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("RoomUpdated", new object[] { room }, default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("HostPromoted", new object[] { "conn1" }, default), Times.Once);
    }
    [Fact]
    public async Task ForceAddPlayer_ShouldJoinRoomAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "ABCD", Players = new List<Player>() };
        _mockRoomService.Setup(r => r.JoinRoom("ABCD", It.IsAny<string>(), "NewPlayer", null, null, false)).Returns(room);

        // Act
        await _sut.ForceAddPlayer("ABCD", "NewPlayer");

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
    }
}
