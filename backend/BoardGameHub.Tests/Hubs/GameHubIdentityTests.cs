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
    private readonly Mock<IGroupManager> _groups = new();
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
        _sut.Groups = _groups.Object;
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

    [Theory]
    [InlineData("NotAGame")]
    [InlineData("2147483647")]
    public async Task CreateRoom_UnknownGameType_Throws(string gameType)
    {
        SignInAs(null);

        var act = () => _sut.CreateRoom("P", true, gameType);

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

    [Theory]
    [InlineData("answer", false)]
    [InlineData("answer", true)]
    [InlineData("ice", false)]
    [InlineData("ice", true)]
    public async Task Signaling_RequiresSameRoomForAnswersAndIce(string kind, bool sameRoom)
    {
        _rooms.Setup(r => r.AreInSameRoom("conn1", "target")).Returns(sameRoom);
        if (kind == "answer") await _sut.SendAnswer("target", "payload");
        else await _sut.SendIceCandidate("target", "payload");
        _single.Verify(c => c.SendCoreAsync(kind == "answer" ? "ReceiveAnswer" : "ReceiveIceCandidate",
            It.Is<object[]>(args => (string)args[0] == "conn1" && (string)args[1] == "payload"), default),
            sameRoom ? Times.Once() : Times.Never());
    }

    [Fact]
    public async Task LeaveRoom_UsesActualMembershipRoomForBroadcastAndGroupRemoval()
    {
        var room = new Room { Code = "ACTUAL", IsPublic = true };
        _rooms.Setup(r => r.RemovePlayer("conn1")).Returns(room);

        await _sut.LeaveRoom("OTHER");

        _groups.Verify(g => g.RemoveFromGroupAsync("conn1", "ACTUAL", default), Times.Once);
        _groups.Verify(g => g.RemoveFromGroupAsync("conn1", "OTHER", default), Times.Never);
        _clients.Verify(c => c.Group("OTHER"), Times.Never);
        _clients.Verify(c => c.Group("ACTUAL"), Times.Once);
        _group.Verify(c => c.SendCoreAsync("PublicRoomUpdated", It.Is<object[]>(args => args[0] == room), default), Times.Once);
    }

    [Fact]
    public async Task CodeEntries_NormalizeBeforeCallingService()
    {
        await _sut.JoinRoom(" test ", "Guest");
        await _sut.SubmitGuess(" test ", "Guess");
        await _sut.VoteNextGame(" test ", "None");
        _rooms.Verify(r => r.JoinRoom("TEST", "conn1", "Guest", null, null, false, null), Times.Once);
        _rooms.Verify(r => r.SubmitAction("TEST", "conn1", "SUBMIT_GUESS", It.IsAny<JsonElement?>()), Times.Once);
        _rooms.Verify(r => r.VoteNextGame("TEST", "conn1", GameType.None), Times.Once);
    }

    public static TheoryData<Func<GameHub, string, Task>, string, string> TypedActions => new()
    {
        { (hub, code) => hub.SubmitAnswers(code, new List<string> { "apple", "pear" }), "SUBMIT_ANSWERS", "{\"answers\":[\"apple\",\"pear\"]}" },
        { (hub, code) => hub.SubmitClue(code, "orchard"), "SUBMIT_CLUE", "{\"clue\":\"orchard\"}" },
        { (hub, code) => hub.SubmitBreakingNewsSlot(code, 2, "headline"), "SUBMIT_SLOT", "{\"slotId\":2,\"value\":\"headline\"}" },
        { (hub, code) => hub.SubmitPictophonePage(code, "drawing"), "SUBMIT_PAGE", "{\"content\":\"drawing\"}" },
        { (hub, code) => hub.SubmitPictophoneDraft(code, "draft"), "SUBMIT_DRAFT", "{\"content\":\"draft\"}" },
        { (hub, code) => hub.StarPictophonePage(code, 2, 3), "STAR_PAGE", "{\"bookIndex\":2,\"pageIndex\":3}" },
        { (hub, code) => hub.DeepfakeStroke(code, "M0 0L1 1", "red"), "SUBMIT_STROKE", "{\"pathData\":\"M0 0L1 1\",\"color\":\"red\"}" },
        { (hub, code) => hub.SubmitWisecrackAnswer(code, "prompt-1", "answer"), "SUBMIT_ANSWER", "{\"promptId\":\"prompt-1\",\"answer\":\"answer\"}" },
        { (hub, code) => hub.SubmitWisecrackVote(code, 1), "SUBMIT_VOTE", "{\"choice\":1}" },
        { (hub, code) => hub.SymbologyPlaceMarker(code, "tree", "circle", "blue"), "PLACE_MARKER", "{\"icon\":\"tree\",\"markerType\":\"circle\",\"color\":\"blue\"}" },
        { (hub, code) => hub.UniversalTranslatorVote(code, "target"), "SUBMIT_VOTE", "{\"accusedId\":\"target\"}" },
        { (hub, code) => hub.SubmitSushiTrainSelection(code, "card-1"), "SUBMIT_SELECTION", "{\"cardId\":\"card-1\"}" },
        { (hub, code) => hub.SubmitGreatMindsCard(code, 42), "PLAY_CARD", "{\"cardValue\":42}" }
    };

    [Theory]
    [MemberData(nameof(TypedActions))]
    public async Task TypedAction_PreservesPayloadAndCallerWhileNormalizingRoomCode(
        Func<GameHub, string, Task> submit, string actionType, string expectedPayload)
    {
        await submit(_sut, " test ");

        _rooms.Verify(r => r.SubmitAction("TEST", "conn1", actionType,
            It.Is<JsonElement?>(payload => payload.HasValue && payload.Value.GetRawText() == expectedPayload)), Times.Once);
        _rooms.VerifyNoOtherCalls();
        _clients.Verify(c => c.Group(It.IsAny<string>()), Times.Never);
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task CloverDragMove_ExistingRoom_OnlyRelaysMemberMovement(bool isMember)
    {
        var room = new Room { Code = "TEST" };
        _rooms.Setup(r => r.GetRoom("TEST")).Returns(room);
        _rooms.Setup(r => r.IsRoomMember(room, "conn1")).Returns(isMember);

        await _sut.CloverDragMove(" test ", "card-1", 1.5, -2.5);

        _clients.Verify(c => c.OthersInGroup("TEST"), isMember ? Times.Once() : Times.Never());
        _others.Verify(c => c.SendCoreAsync("CloverCardMoved", It.Is<object[]>(args =>
            (string)args[0] == "conn1" && (string)args[1] == "card-1" &&
            (double)args[2] == 1.5 && (double)args[3] == -2.5), default), isMember ? Times.Once() : Times.Never());
        _group.Verify(c => c.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default), Times.Never);
    }

    [Fact]
    public async Task UndefinedEnum_SetAndVoteDoNotMutateService()
    {
        await _sut.SetGameType("TEST", "2147483647");
        await _sut.VoteNextGame("TEST", "2147483647");
        _rooms.Verify(r => r.SetGameType(It.IsAny<string>(), It.IsAny<GameType>()), Times.Never);
        _rooms.Verify(r => r.VoteNextGame(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<GameType>()), Times.Never);
    }
}
