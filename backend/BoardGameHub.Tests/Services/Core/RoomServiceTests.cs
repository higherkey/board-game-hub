using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Hubs;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
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
        
        _sut = new RoomService(_gameServices, _mockAdminHub.Object, _mockGameHub.Object, new Mock<ILogger<RoomService>>().Object);
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

    [Fact]
    public void RemovePlayer_ShouldMarkPlayerDisconnected()
    {
        // Arrange
        var room = _sut.CreateRoom("conn1", "Host", true);
        
        // Act
        _sut.RemovePlayer("conn1");

        // Assert
        room.Players.First().IsConnected.Should().BeFalse();
    }

    [Fact]
    public void TerminateRoom_ShouldRemoveRoom()
    {
        // Arrange
        var room = _sut.CreateRoom("conn1", "Host", true);
        
        // Act
        _sut.TerminateRoom(room.Code);

        // Assert
        _sut.GetRoom(room.Code).Should().BeNull();
    }

    [Fact]
    public void ToggleReady_ShouldTogglePlayerReady()
    {
        // Arrange
        var room = _sut.CreateRoom("conn1", "Host", true);
        
        // Act
        _sut.ToggleReady(room.Code, "conn1");

        // Assert
        room.Players.First().IsReady.Should().BeTrue();
    }

    [Fact]
    public void SetGameType_ShouldChangeGameTypeAndResetState()
    {
        // Arrange
        var room = _sut.CreateRoom("conn1", "Host", true, GameType.Scatterbrain);
        room.State = GameState.Finished;

        // Act
        _sut.SetGameType(room.Code, GameType.Babble);

        // Assert
        room.GameType.Should().Be(GameType.Babble);
        room.State.Should().Be(GameState.Lobby);
    }

    [Fact]
    public void UpdateSettings_ShouldApplyNewSettings()
    {
        // Arrange
        var room = _sut.CreateRoom("conn1", "Host", true);
        var newSettings = new GameSettings { TimerDurationSeconds = 120 };

        // Act
        _sut.UpdateSettings(room.Code, newSettings);

        // Assert
        room.Settings.TimerDurationSeconds.Should().Be(120);
    }

    [Fact]
    public void ValidateRooms_ShouldReturnValidCodes()
    {
        // Arrange
        var room1 = _sut.CreateRoom("c1", "H1", true);
        var room2 = _sut.CreateRoom("c2", "H2", true);
        var inputCodes = new List<string> { room1.Code, room2.Code, "INVALID" };

        // Act
        var validCodes = _sut.ValidateRooms(inputCodes);

        // Assert
        validCodes.Should().HaveCount(2);
        validCodes.Should().Contain(room1.Code);
        validCodes.Should().Contain(room2.Code);
    }

    [Fact]
    public void GetServerStats_ShouldReturnCorrectStats()
    {
        // Arrange
        _sut.CreateRoom("c1", "H1", true);
        _sut.CreateRoom("c2", "H2", true);

        // Act
        var stats = _sut.GetServerStats();

        // Assert
        stats.ActiveRooms.Should().Be(2);
        stats.TotalOnlinePlayers.Should().Be(2);
        stats.Rooms.Should().HaveCount(2);
    }
}
