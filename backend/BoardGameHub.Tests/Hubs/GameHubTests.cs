using System.Security.Claims;
using System.Text.Json;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Hubs;

public class GameHubTests
{
    private readonly Mock<IRoomService> _mockRoomService;
    private readonly Mock<IGameHistoryService> _mockHistoryService;
    private readonly Mock<ILogger<GameHub>> _mockLogger;
    private readonly IConfiguration _mockConfig;
    private readonly GameHub _sut;
    private readonly Mock<IHubCallerClients> _mockClients;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;
    private readonly Mock<IGroupManager> _mockGroups;
    private readonly Mock<HubCallerContext> _mockContext;

    public GameHubTests()
    {
        _mockRoomService = new Mock<IRoomService>();
        _mockHistoryService = new Mock<IGameHistoryService>();
        _mockLogger = new Mock<ILogger<GameHub>>();
        
        var inMemorySettings = new Dictionary<string, string?> {
            {"TurnServer:Url", "turn:test"}
        };
        _mockConfig = new ConfigurationBuilder().AddInMemoryCollection(inMemorySettings).Build();

        _sut = new GameHub(_mockRoomService.Object, _mockHistoryService.Object, _mockLogger.Object, _mockConfig);

        _mockClients = new Mock<IHubCallerClients>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockSingleClientProxy = new Mock<ISingleClientProxy>();
        _mockGroups = new Mock<IGroupManager>();

        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClients.Setup(c => c.Caller).Returns(_mockSingleClientProxy.Object);
        _sut.Clients = _mockClients.Object;
        _sut.Groups = _mockGroups.Object;

        _mockContext = new Mock<HubCallerContext>();
        _mockContext.Setup(c => c.ConnectionId).Returns("conn1");
        
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "user123"), new Claim("AvatarUrl", "url") };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _mockContext.Setup(c => c.User).Returns(claimsPrincipal);
        
        _sut.Context = _mockContext.Object;
    }

    [Fact]
    public async Task CreateRoom_ShouldCreateAndJoinGroupAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "TEST", GameType = GameType.Babble, IsPublic = true };
        _mockRoomService.Setup(r => r.CreateRoom("conn1", "Player1", true, GameType.Babble, "user123", "url", false)).Returns(room);

        // Act
        var result = await _sut.CreateRoom("Player1", true, "Babble");

        // Assert
        result.Should().BeEquivalentTo(room);
        _mockGroups.Verify(g => g.AddToGroupAsync("conn1", "TEST", default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PublicRoomCreated", new object[] { room }, default), Times.Once);
    }

    [Fact]
    public async Task JoinRoom_ShouldJoinGroupAndBroadcast_IfValid()
    {
        // Arrange
        var room = new Room { Code = "TEST", IsPublic = true, State = GameState.Lobby };
        _mockRoomService.Setup(r => r.JoinRoom("TEST", "conn1", "Player2", "user123", "url", false)).Returns(room);

        // Act
        var result = await _sut.JoinRoom("TEST", "Player2");

        // Assert
        result.Should().BeEquivalentTo(room);
        _mockGroups.Verify(g => g.AddToGroupAsync("conn1", "TEST", default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public async Task JoinRoom_ShouldReturnNull_IfNotValid()
    {
        // Arrange
        _mockRoomService.Setup(r => r.JoinRoom("TEST", "conn1", "Player2", "user123", "url", false)).Returns((Room?)null);

        // Act
        var result = await _sut.JoinRoom("TEST", "Player2");

        // Assert
        result.Should().BeNull();
        _mockGroups.Verify(g => g.AddToGroupAsync(It.IsAny<string>(), It.IsAny<string>(), default), Times.Never);
    }

    [Fact]
    public async Task StartGame_ShouldBroadcastGameStarted()
    {
        // Arrange
        var room = new Room { Code = "TEST", IsPublic = true };
        var settings = new GameSettings();
        _mockRoomService.Setup(r => r.StartGame("TEST", settings)).ReturnsAsync(room);

        // Act
        await _sut.StartGame("TEST", settings);

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("GameStarted", new object[] { room }, default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PublicRoomDeleted", new object[] { "TEST" }, default), Times.Once);
    }

    [Fact]
    public async Task SubmitAction_ShouldCallRoomService()
    {
        // Arrange
        var payloadElement = JsonSerializer.SerializeToElement(new { someData = "value" });

        // Act
        await _sut.SubmitAction("TEST", "ACTION_TYPE", payloadElement);

        // Assert
        _mockRoomService.Verify(r => r.SubmitAction("TEST", "conn1", "ACTION_TYPE", payloadElement), Times.Once);
    }

    [Fact]
    public async Task JoinLobby_ShouldAddToGroup()
    {
        await _sut.JoinLobby();
        _mockGroups.Verify(g => g.AddToGroupAsync("conn1", "LobbyGroup", default), Times.Once);
    }

    [Fact]
    public async Task LeaveLobby_ShouldRemoveFromGroup()
    {
        await _sut.LeaveLobby();
        _mockGroups.Verify(g => g.RemoveFromGroupAsync("conn1", "LobbyGroup", default), Times.Once);
    }

    [Fact]
    public async Task LeaveRoom_ShouldRemovePlayerAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "TEST", Players = new List<Player>() };
        _mockRoomService.Setup(r => r.RemovePlayer("conn1")).Returns(room);

        // Act
        await _sut.LeaveRoom("TEST");

        // Assert
        _mockGroups.Verify(g => g.RemoveFromGroupAsync("conn1", "TEST", default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public async Task OnDisconnectedAsync_ShouldRemovePlayerAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "TEST", Players = new List<Player>() };
        _mockRoomService.Setup(r => r.RemovePlayer("conn1")).Returns(room);

        // Act
        await _sut.OnDisconnectedAsync(null);

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public async Task SetGameType_ShouldBroadcastChange()
    {
        // Arrange
        var room = new Room { Code = "TEST", GameType = GameType.Scatterbrain };
        _mockRoomService.Setup(r => r.SetGameType("TEST", GameType.Scatterbrain)).Returns(room);

        // Act
        await _sut.SetGameType("TEST", "Scatterbrain");

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("GameTypeChanged", new object[] { "Scatterbrain" }, default), Times.Once);
    }

    [Fact]
    public async Task UpdateSettings_ShouldBroadcastChange()
    {
        // Arrange
        var settings = new GameSettings { TimerDurationSeconds = 30 };
        var room = new Room { Code = "TEST", IsPublic = true, State = GameState.Lobby };
        _mockRoomService.Setup(r => r.UpdateSettings("TEST", settings)).Returns(room);

        // Act
        await _sut.UpdateSettings("TEST", settings);

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("SettingsUpdated", new object[] { settings }, default), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("PublicRoomUpdated", new object[] { room }, default), Times.Once);
    }

    [Fact]
    public async Task EndRound_ShouldCalculateScoresAndRecordHistory()
    {
        // Arrange
        var room = new Room { Code = "TEST", Players = new List<Player> { new Player { Name = "P1" } } };
        _mockRoomService.Setup(r => r.CalculateRoundScores("TEST")).ReturnsAsync(room);

        // Act
        await _sut.EndRound("TEST");

        // Assert
        _mockHistoryService.Verify(h => h.RecordGameSession(room), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("RoundEnded", new object[] { room }, default), Times.Once);
    }

    [Fact]
    public async Task ToggleReady_ShouldUpdateAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "TEST" };
        _mockRoomService.Setup(r => r.ToggleReady("TEST", "conn1", null)).Returns(room);

        // Act
        await _sut.ToggleReady("TEST", null);

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("RoomUpdated", new object[] { room }, default), Times.Once);
    }

    [Fact]
    public async Task RenamePlayer_ShouldUpdateAndBroadcast()
    {
        // Arrange
        var room = new Room { Code = "TEST", Players = new List<Player>() };
        _mockRoomService.Setup(r => r.RenamePlayer("conn1", "NewName")).Returns(room);

        // Act
        await _sut.RenamePlayer("NewName");

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("PlayerJoined", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public async Task GetGameHistory_ShouldReturnHistoryFromService()
    {
        // Arrange
        var history = new List<GameSessionPlayer> { new GameSessionPlayer() };
        _mockHistoryService.Setup(h => h.GetUserGameHistory("user123", 20)).ReturnsAsync(history);

        // Act
        var result = await _sut.GetGameHistory();

        // Assert
        result.Should().BeEquivalentTo(history);
    }

    [Fact]
    public async Task RequestUndo_ShouldBroadcastVoteStarted()
    {
        // Arrange
        var vote = new UndoVote { InitiatorName = "P1" };
        var room = new Room { Code = "TEST", CurrentVote = vote };
        _mockRoomService.Setup(r => r.RequestUndo("TEST", "conn1")).Returns(room);

        // Act
        await _sut.RequestUndo("TEST");

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("UndoVoteStarted", new object[] { vote }, default), Times.Once);
    }

    [Fact]
    public async Task SubmitUndoVote_ShouldBroadcastUpdate()
    {
        // Arrange
        var vote = new UndoVote { InitiatorName = "P1" };
        var room = new Room { Code = "TEST", CurrentVote = vote };
        _mockRoomService.Setup(r => r.SubmitUndoVote("TEST", "conn1", true)).Returns(room);

        // Act
        await _sut.SubmitUndoVote("TEST", true);

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("UndoVoteUpdate", new object[] { vote }, default), Times.Once);
    }

    [Fact]
    public async Task SubmitUndoVote_ShouldBroadcastFinished_WhenVoteClosed()
    {
        // Arrange
        var room = new Room { Code = "TEST", CurrentVote = null };
        _mockRoomService.Setup(r => r.SubmitUndoVote("TEST", "conn1", true)).Returns(room);

        // Act
        await _sut.SubmitUndoVote("TEST", true);

        // Assert
        _mockClientProxy.Verify(c => c.SendCoreAsync("UndoVoteFinished", new object[] { "Vote Completed" }, default), Times.Once);
    }
}
