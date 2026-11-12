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

public class GameHubIdentityTests
{
    private readonly Mock<IRoomService> _rooms = new();
    private readonly Mock<IHubCallerClients> _clients = new();
    private readonly Mock<IClientProxy> _group = new();
    private readonly Mock<IClientProxy> _others = new();
    private readonly Mock<ISingleClientProxy> _single = new();
    private readonly Mock<HubCallerContext> _context = new();
    private readonly GameHub _sut;

    public GameHubIdentityTests()
    {
        _sut = new GameHub(_rooms.Object, new Mock<IGameHistoryService>().Object, new Mock<ILogger<GameHub>>().Object,
            new ConfigurationBuilder().Build());
        _clients.Setup(c => c.Group(It.IsAny<string>())).Returns(_group.Object);
        _clients.Setup(c => c.OthersInGroup(It.IsAny<string>())).Returns(_others.Object);
        _clients.Setup(c => c.Client(It.IsAny<string>())).Returns(_single.Object);
        _clients.Setup(c => c.Caller).Returns(_single.Object);
        _sut.Clients = _clients.Object;
        _sut.Groups = new Mock<IGroupManager>().Object;
        _context.Setup(c => c.ConnectionId).Returns("conn1");
        _sut.Context = _context.Object;
    }

    private void SignInAs(string? userId)
    {
        var claims = userId == null ? Array.Empty<Claim>() : new[] { new Claim(ClaimTypes.NameIdentifier, userId) };
        _context.Setup(c => c.User).Returns(new ClaimsPrincipal(new ClaimsIdentity(claims, userId == null ? null : "Test")));
    }

    [Fact]
    public async Task JoinRoom_Guest_NamespacesGuestId()
    {
        SignInAs(null);
        _rooms.Setup(r => r.JoinRoom("TEST", "conn1", "G", "guest:account-1", null, false, null)).Returns(new Room { Code = "TEST" });

        await _sut.JoinRoom("TEST", "G", "  account-1 ");

        _rooms.Verify(r => r.JoinRoom("TEST", "conn1", "G", "guest:account-1", null, false, null), Times.Once);
    }

    [Fact]
    public async Task JoinRoom_Authenticated_UsesClaimNotGuestId()
    {
        SignInAs("acct");
        _rooms.Setup(r => r.JoinRoom("TEST", "conn1", "G", "acct", null, false, null)).Returns(new Room { Code = "TEST" });

        await _sut.JoinRoom("TEST", "G", "other");

        _rooms.Verify(r => r.JoinRoom("TEST", "conn1", "G", "acct", null, false, null), Times.Once);
    }

    [Fact]
    public async Task JoinRoom_GuestWithoutId_PassesNull()
    {
        SignInAs(null);
        _rooms.Setup(r => r.JoinRoom("TEST", "conn1", "G", null, null, false, null)).Returns(new Room { Code = "TEST" });

        await _sut.JoinRoom("TEST", "G");

        _rooms.Verify(r => r.JoinRoom("TEST", "conn1", "G", null, null, false, null), Times.Once);
    }

    [Fact]
    public async Task CreateRoom_UnknownGameType_Throws()
    {
        SignInAs(null);

        var act = () => _sut.CreateRoom("P", true, "NotAGame");

        (await act.Should().ThrowAsync<HubException>()).WithMessage("Unknown game type.");
    }

    [Fact]
    public async Task SendMessage_NonMember_IsNotRelayed()
    {
        SignInAs(null);
        var room = new Room { Code = "TEST" };
        _rooms.Setup(r => r.GetRoom(It.IsAny<string>())).Returns(room);
        _rooms.Setup(r => r.IsRoomMember(room, "conn1")).Returns(false);

        await _sut.SendMessage("test", "hi");

        _group.Verify(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default), Times.Never);
    }

    [Fact]
    public async Task SendMessage_Member_SendsToNormalizedGroup()
    {
        SignInAs(null);
        var room = new Room { Code = "TEST" };
        _rooms.Setup(r => r.GetRoom(It.IsAny<string>())).Returns(room);
        _rooms.Setup(r => r.IsRoomMember(room, "conn1")).Returns(true);

        await _sut.SendMessage(" test ", "hi");

        _clients.Verify(c => c.Group("TEST"), Times.Once);
        _group.Verify(c => c.SendCoreAsync("ReceiveMessage", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public async Task CloverDragMove_NonMember_IsNotRelayed()
    {
        SignInAs(null);
        _rooms.Setup(r => r.GetRoom(It.IsAny<string>())).Returns((Room?)null);

        await _sut.CloverDragMove("TEST", "c", 1, 2);

        _others.Verify(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default), Times.Never);
    }

    [Fact]
    public async Task SendOffer_DifferentRooms_IsNotRelayed()
    {
        SignInAs(null);
        _rooms.Setup(r => r.AreInSameRoom("conn1", "target")).Returns(false);

        await _sut.SendOffer("target", "sdp");

        _single.Verify(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default), Times.Never);
    }

    [Fact]
    public async Task SendOffer_SameRoom_IsRelayed()
    {
        SignInAs(null);
        _rooms.Setup(r => r.AreInSameRoom("conn1", "target")).Returns(true);

        await _sut.SendOffer("target", "sdp");

        _single.Verify(c => c.SendCoreAsync("ReceiveOffer", It.IsAny<object[]>(), default), Times.Once);
    }

    [Fact]
    public void Player_Json_ExposesIsRegisteredAndHidesUserId()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web);

        var registered = JsonSerializer.Serialize(new Player { UserId = "acct" }, options);
        registered.Should().Contain("\"isRegistered\":true");
        registered.Should().NotContain("userId");

        JsonSerializer.Serialize(new Player { UserId = "guest:x" }, options).Should().Contain("\"isRegistered\":false");
    }
}
