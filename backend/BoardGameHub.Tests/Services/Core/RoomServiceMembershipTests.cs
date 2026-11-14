using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Hubs;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class RoomServiceMembershipTests
{
    private readonly RoomService _sut;
    private readonly Mock<IGameService> _game = new();

    public RoomServiceMembershipTests()
    {
        var mockAdminHub = new Mock<IHubContext<AdminHub>>();
        var mockGameHub = new Mock<IHubContext<GameHub>>();
        var mockProxy = new Mock<IClientProxy>();
        var mockClients = new Mock<IHubClients>();
        var gsm = new Mock<GameStateManager>(mockGameHub.Object, new StateDiffService(), new Mock<ILogger<GameStateManager>>().Object);

        mockAdminHub.Setup(h => h.Clients).Returns(mockClients.Object);
        mockGameHub.Setup(h => h.Clients).Returns(mockClients.Object);
        mockClients.Setup(c => c.All).Returns(mockProxy.Object);
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockProxy.Object);

        _game.Setup(g => g.GameType).Returns(GameType.Babble);
        _sut = new RoomService(new[] { _game.Object }, mockAdminHub.Object, mockGameHub.Object, gsm.Object, new Mock<ILogger<RoomService>>().Object);
    }

    private static readonly UndoSettings VotingOn = new() { AllowVoting = true, HostOnly = false };

    [Fact]
    public void JoinRoom_GuestPrefixedId_DoesNotRebindRegisteredSeat()
    {
        var room = _sut.CreateRoom("host1", "Host", true, GameType.Babble, "account-1");

        _sut.JoinRoom(room.Code, "conn2", "Guest", "guest:account-1");

        room.Players.Should().HaveCount(2);
        room.Players.Single(p => p.ConnectionId == "host1").Name.Should().Be("Host");
        room.Players.Single(p => p.ConnectionId == "conn2").UserId.Should().Be("guest:account-1");
    }

    [Fact]
    public void JoinRoom_LowercaseCode_RemovePlayerMarksDisconnected()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code.ToLowerInvariant(), "conn2", "P2");

        _sut.RemovePlayer("conn2");

        room.Players.Single(p => p.ConnectionId == "conn2").IsConnected.Should().BeFalse();
    }

    [Fact]
    public void IsRoomMember_ReportsPlayersHostScreenAndCreatorOnly()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code, "conn2", "P2");

        _sut.IsRoomMember(room, "host1").Should().BeTrue();
        _sut.IsRoomMember(room, "conn2").Should().BeTrue();
        _sut.IsRoomMember(room, "outsider").Should().BeFalse();
    }

    [Fact]
    public void AreInSameRoom_RequiresBothMappedToSameRoom()
    {
        var a = _sut.CreateRoom("a1", "A", true);
        _sut.JoinRoom(a.Code, "a2", "A2");
        _sut.CreateRoom("b1", "B", true);

        _sut.AreInSameRoom("a1", "a2").Should().BeTrue();
        _sut.AreInSameRoom("a1", "b1").Should().BeFalse();
        _sut.AreInSameRoom("a1", "unknown").Should().BeFalse();
        _sut.AreInSameRoom("unknown", "unknown2").Should().BeFalse();
    }

    [Fact]
    public async Task SubmitUndoVote_NonMember_ChangesNothing()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code, "conn2", "P2");
        _sut.JoinRoom(room.Code, "conn3", "P3");
        room.StateHistory.Push("{}");
        _sut.UpdateUndoSettings(room.Code, VotingOn);
        await _sut.RequestUndo(room.Code, "conn2");

        var result = await _sut.SubmitUndoVote(room.Code, "outsider", true);

        result.Should().BeNull();
        room.CurrentVote!.Votes.Should().ContainSingle().Which.Key.Should().Be("conn2");
    }

    [Fact]
    public async Task SubmitUndoVote_PassesWithMajorityOfConnectedHands()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code, "conn2", "P2");
        _sut.JoinRoom(room.Code, "conn3", "P3");
        _sut.JoinRoom(room.Code, "conn4", "P4");
        _sut.JoinRoom(room.Code, "conn5", "P5");
        _sut.JoinRoom(room.Code, "table", "Table", isScreen: true);
        room.Players.Single(p => p.ConnectionId == "conn4").IsConnected = false;
        room.Players.Single(p => p.ConnectionId == "conn5").IsConnected = false;
        room.StateHistory.Push("{\"RoundNumber\":1}");
        room.RoundNumber = 2;
        _sut.UpdateUndoSettings(room.Code, VotingOn);
        await _sut.RequestUndo(room.Code, "conn2");

        var result = await _sut.SubmitUndoVote(room.Code, "conn3", true);

        result!.Result.Should().Be(UndoVoteResult.Passed);
        room.RoundNumber.Should().Be(1);
    }

    [Fact]
    public async Task SubmitUndoVote_TableVoteIsIgnored()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code, "conn2", "P2");
        _sut.JoinRoom(room.Code, "conn3", "P3");
        _sut.JoinRoom(room.Code, "table", "Table", isScreen: true);
        room.StateHistory.Push("{}");
        _sut.UpdateUndoSettings(room.Code, VotingOn);
        await _sut.RequestUndo(room.Code, "conn2");

        var result = await _sut.SubmitUndoVote(room.Code, "table", true);

        result.Should().BeNull();
        room.CurrentVote!.Votes.Should().NotContainKey("table");
    }

    [Fact]
    public async Task SubmitUndoVote_FailsWhenEveryEligibleVoterHasVotedWithoutMajority()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code, "conn2", "P2");
        _sut.JoinRoom(room.Code, "conn3", "P3");
        room.StateHistory.Push("{}");
        _sut.UpdateUndoSettings(room.Code, VotingOn);
        await _sut.RequestUndo(room.Code, "conn2");
        await _sut.SubmitUndoVote(room.Code, "conn3", false);

        var result = await _sut.SubmitUndoVote(room.Code, "host1", false);

        result!.Result.Should().Be(UndoVoteResult.Failed);
        room.CurrentVote.Should().BeNull();
    }

    [Fact]
    public async Task SubmitUndoVote_ZeroEligibleVoters_Fails()
    {
        var room = _sut.CreateRoom("host1", "Host", true);
        _sut.JoinRoom(room.Code, "conn2", "P2");
        room.StateHistory.Push("{}");
        _sut.UpdateUndoSettings(room.Code, VotingOn);
        await _sut.RequestUndo(room.Code, "conn2");
        // Every Hand drops; the host seat becomes a Table, so nobody can vote.
        room.Players.Single(p => p.ConnectionId == "conn2").IsConnected = false;
        room.Players.Single(p => p.ConnectionId == "host1").IsScreen = true;

        var result = await _sut.SubmitUndoVote(room.Code, "host1", true);

        result!.Result.Should().Be(UndoVoteResult.Failed);
        room.CurrentVote.Should().BeNull();
    }

    [Fact]
    public void VoteNextGame_NonMember_IsIgnored()
    {
        var room = _sut.CreateRoom("host1", "Host", true);

        _sut.VoteNextGame(room.Code, "outsider", GameType.Babble).Should().BeNull();

        room.NextGameVotes.Should().BeEmpty();
    }

    [Fact]
    public void VoteNextGame_Member_IsRecorded()
    {
        var room = _sut.CreateRoom("host1", "Host", true);

        _sut.VoteNextGame(room.Code, "host1", GameType.Babble);

        room.NextGameVotes.Should().ContainKey("host1");
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task DepartedCreator_LosesMembershipAndMutationAuthority(bool isScreen)
    {
        var room = _sut.CreateRoom("creator", "Host", false, userId: "account", isScreen: isScreen);
        _sut.JoinRoom(room.Code, "remaining", "Remaining");
        _sut.RemovePlayer("creator");

        _sut.IsRoomMember(room, "creator").Should().BeFalse();
        _sut.IsAuthorizedHost(room, "creator", "account").Should().BeFalse();
        _sut.AreInSameRoom("creator", "remaining").Should().BeFalse();
        _sut.ToggleReady(room.Code, "creator", true).Should().BeNull();
        _sut.ChangeRole("creator", !isScreen).Should().BeNull();
        _sut.RenamePlayer("creator", "Changed").Should().BeNull();
        _sut.SetHostPlayer(room.Code, "creator").Should().BeNull();
        _sut.RemoveHostPlayer(room.Code, "creator", "remaining").Should().BeNull();
        _sut.VoteNextGame(room.Code, "creator", GameType.Babble).Should().BeNull();
        (await _sut.RequestUndo(room.Code, "creator")).Should().BeNull();
        room.IsHostOverride.Should().BeFalse();
    }

    [Fact]
    public void ReconnectedCreator_OnlyNewConnectionHasAuthority()
    {
        var room = _sut.CreateRoom("old", "Host", false, userId: "account");
        _sut.JoinRoom(room.Code, "other", "Other");
        var token = room.Players[0].SessionId;
        room.Players[0].Score = 17;

        _sut.JoinRoom(room.Code, "new", "Host", sessionId: token);

        _sut.IsRoomMember(room, "old").Should().BeFalse();
        _sut.IsAuthorizedHost(room, "old", "account").Should().BeFalse();
        _sut.AreInSameRoom("old", "other").Should().BeFalse();
        _sut.IsAuthorizedHost(room, "new", "account").Should().BeTrue();
        room.Players[0].UserId.Should().Be("account");
        room.Players[0].Score.Should().Be(17);
        room.Players[0].SessionId.Should().NotBe(token);
    }

    [Fact]
    public void SameRoomRetry_PreservesSeatIdentityRoleAndSession()
    {
        var room = _sut.CreateRoom("conn", "Original", false, userId: "account");
        var token = room.Players[0].SessionId;

        _sut.JoinRoom(" " + room.Code.ToLowerInvariant() + " ", "conn", "Changed", "guest:other", isScreen: true)
            .Should().BeSameAs(room);

        room.Players.Should().ContainSingle();
        room.Players[0].Name.Should().Be("Original");
        room.Players[0].UserId.Should().Be("account");
        room.Players[0].IsScreen.Should().BeFalse();
        room.Players[0].SessionId.Should().Be(token);
    }

    [Fact]
    public async Task ConcurrentCrossRoomJoins_ReserveOnlyOneSeat()
    {
        var a = _sut.CreateRoom("a", "A", false);
        var b = _sut.CreateRoom("b", "B", false);
        using var start = new Barrier(2);
        var results = await Task.WhenAll(new[] { a, b }.Select(room => Task.Run(() =>
        {
            start.SignalAndWait();
            return _sut.JoinRoom(room.Code, "same", "Same");
        })));

        results.Count(r => r != null).Should().Be(1);
        a.Players.Concat(b.Players).Count(p => p.ConnectionId == "same").Should().Be(1);
    }

    [Fact]
    public void DuplicateCreate_DoesNotCreateAnotherRoomOrChangeMembership()
    {
        var room = _sut.CreateRoom("conn", "Original", true);
        var create = () => _sut.CreateRoom("conn", "Duplicate", true);

        create.Should().Throw<InvalidOperationException>();

        _sut.GetPublicRooms().Should().ContainSingle().Which.Should().BeSameAs(room);
        _sut.IsRoomMember(room, "conn").Should().BeTrue();
    }

    [Fact]
    public void ReconnectingOldSeat_DoesNotRemoveOldSocketNewRoomMapping()
    {
        var oldRoom = _sut.CreateRoom("socket", "Original", false, userId: "account");
        var token = oldRoom.Players[0].SessionId;
        _sut.RemovePlayer("socket");
        var newRoom = _sut.CreateRoom("socket", "New room", false);

        _sut.JoinRoom(oldRoom.Code, "reconnected", "Original", sessionId: token);

        _sut.IsRoomMember(newRoom, "socket").Should().BeTrue();
        _sut.RemovePlayer("socket").Should().BeSameAs(newRoom);
        _sut.IsRoomMember(oldRoom, "reconnected").Should().BeTrue();
    }

    [Fact]
    public void StaleRoomOrDisconnectedSeat_IsNotMembership()
    {
        var room = _sut.CreateRoom("conn", "Original", false);
        _sut.JoinRoom(room.Code, "other", "Other");
        room.Players[0].IsConnected = false;
        _sut.IsRoomMember(room, "conn").Should().BeFalse();
        _sut.AreInSameRoom("conn", "other").Should().BeFalse();
        room.Players[0].IsConnected = true;
        _sut.RehydrateRoom(new Room { Code = room.Code, Players = room.Players });
        _sut.IsRoomMember(room, "conn").Should().BeFalse();
    }

    [Fact]
    public void CodesAndGameTypes_AreCanonicalAndDefinedIncludingNone()
    {
        var room = _sut.CreateRoom("conn", "Original", false, GameType.None);
        var code = " " + room.Code.ToLowerInvariant() + " ";
        _sut.GetRoom(code).Should().BeSameAs(room);
        _sut.ValidateRooms(new List<string> { code }).Should().Equal(room.Code);
        _sut.SetGameType(code, (GameType)int.MaxValue).Should().BeNull();
        _sut.VoteNextGame(code, "conn", (GameType)int.MaxValue).Should().BeNull();
        _sut.SetGameType(code, GameType.None).Should().BeSameAs(room);
        _sut.VoteNextGame(code, "conn", GameType.None).Should().BeSameAs(room);
        var create = () => _sut.CreateRoom("invalid", "Invalid", false, (GameType)int.MaxValue);
        create.Should().Throw<ArgumentOutOfRangeException>();
        room.GameType.Should().Be(GameType.None);
    }

    [Fact]
    public async Task SubmitAction_RechecksMembershipAfterWaitingForMutationLock()
    {
        var room = _sut.CreateRoom("conn", "Host", false, GameType.Babble);
        await room.StateLock.WaitAsync();
        var pending = _sut.SubmitAction(room.Code, "conn", "ACTION", null);
        pending.IsCompleted.Should().BeFalse();
        // A queued disconnect/reconnect can invalidate the seat before the action obtains the lock.
        room.Players[0].IsConnected = false;
        room.StateLock.Release();

        (await pending).Should().BeNull();
        room.StateHistory.Should().BeEmpty();
        _game.Verify(g => g.HandleAction(It.IsAny<Room>(), It.IsAny<GameAction>(), It.IsAny<string>()), Times.Never);
    }
}
