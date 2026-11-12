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

        _sut = new RoomService(new List<IGameService>(), mockAdminHub.Object, mockGameHub.Object, gsm.Object, new Mock<ILogger<RoomService>>().Object);
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
}
