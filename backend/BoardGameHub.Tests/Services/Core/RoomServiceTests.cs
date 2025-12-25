using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Hubs;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class RoomServiceTests
{
    private readonly Mock<IHubContext<AdminHub>> _mockAdminHub;
    private readonly Mock<IHubContext<GameHub>> _mockGameHub;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly Mock<IHubClients> _mockHubClients;
    private readonly List<IGameService> _gameServices;
    private readonly RoomService _sut;

    public RoomServiceTests()
    {
        _mockAdminHub = new Mock<IHubContext<AdminHub>>();
        _mockGameHub = new Mock<IHubContext<GameHub>>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockHubClients = new Mock<IHubClients>();

        // Setup generic hub mocks to avoid null references
        _mockAdminHub.Setup(h => h.Clients).Returns(_mockHubClients.Object);
        _mockGameHub.Setup(h => h.Clients).Returns(_mockHubClients.Object);
        _mockHubClients.Setup(c => c.All).Returns(_mockClientProxy.Object);
        _mockHubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);

        _gameServices = new List<IGameService>();
        
        _sut = new RoomService(_gameServices, _mockAdminHub.Object, _mockGameHub.Object);
    }

    [Fact]
    public void CreateRoom_ShouldCreateRoom_WithCorrectHost()
    {
        // Act
        var room = _sut.CreateRoom("conn1", "HostPlayer", true, GameType.Scatterbrain);

        // Assert
        room.Should().NotBeNull();
        room.Code.Should().HaveLength(4);
        room.GameType.Should().Be(GameType.Scatterbrain);
        room.Players.Should().HaveCount(1);
        room.Players.First().Name.Should().Be("HostPlayer");
        room.Players.First().IsHost.Should().BeTrue();
    }

    [Fact]
    public void JoinRoom_ShouldAddPlayer_WhenRoomExists()
    {
        // Arrange
        var room = _sut.CreateRoom("host1", "Host", true);

        // Act
        var result = _sut.JoinRoom(room.Code, "p2", "Player2");

        // Assert
        result.Should().NotBeNull();
        result!.Players.Should().HaveCount(2);
        result.Players.Last().Name.Should().Be("Player2");
        result.Players.Last().IsHost.Should().BeFalse();
    }

    [Fact]
    public void JoinRoom_ShouldReturnNull_WhenRoomDoesNotExist()
    {
        // Act
        var result = _sut.JoinRoom("INVALID", "p1", "Player1");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public void Reconnect_ShouldUpdateConnectionId_WhenUserIdMatches()
    {
        // Arrange
        var userId = "user123";
        var room = _sut.CreateRoom("host1", "Host", true, userId: userId);
        
        // Act - Rejoin with same UserId but new ConnectionId
        var result = _sut.JoinRoom(room.Code, "new_conn_id", "HostBack", userId: userId);

        // Assert
        result.Should().NotBeNull();
        result!.Players.Should().HaveCount(1); // Should not add new player
        result.Players.First().ConnectionId.Should().Be("new_conn_id");
        result.Players.First().Name.Should().Be("HostBack"); // Should update name
    }

    [Fact]
    public void StartGame_ShouldSetState_AndInvokeGameService()
    {
        // Arrange
        var room = _sut.CreateRoom("host1", "Host", true, GameType.Scatterbrain);
        
        var mockService = new Mock<IGameService>();
        mockService.Setup(s => s.GameType).Returns(GameType.Scatterbrain);
        _gameServices.Add(mockService.Object);

        // Act
        _sut.StartGame(room.Code, new GameSettings { TimerDurationSeconds = 60 });

        // Assert
        room.State.Should().Be(GameState.Playing);
        mockService.Verify(s => s.StartRound(room, It.IsAny<GameSettings>()), Times.Once);
    }
}
