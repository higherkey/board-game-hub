using System.Text.Json.Nodes;
using System.Text.Json.Serialization;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit.Abstractions;

namespace BoardGameHub.Tests.Services;

public class GameStateManagerDeliveryTests
{
    private readonly Mock<IClientProxy> _proxy = new();
    private readonly Mock<IRoomPersistenceService> _persistence = new();
    private readonly Mock<IRoomStateSerializer> _serializer = new();
    private readonly GameStateManager _manager;
    private readonly ITestOutputHelper _output;

    public GameStateManagerDeliveryTests(ITestOutputHelper output)
    {
        _output = output;
        var clients = new Mock<IHubClients>();
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(_proxy.Object);
        var hub = new Mock<IHubContext<GameHub>>();
        hub.Setup(h => h.Clients).Returns(clients.Object);
        _serializer.Setup(s => s.Serialize(It.IsAny<Room>())).Returns("{}");
        _manager = new GameStateManager(hub.Object, new StateDiffService(),
            NullLogger<GameStateManager>.Instance, _persistence.Object, _serializer.Object);
    }

    private async Task EstablishBaseline(Room room)
    {
        _manager.TrackRoom(room);
        await _manager.ProcessRoomUpdateAsync(room.Code);
        _proxy.Invocations.Clear();
        _persistence.Invocations.Clear();
        _serializer.Invocations.Clear();
    }

    private sealed class CountedGameData
    {
        [JsonIgnore] public int Reads { get; set; }
        public int Value { get { Reads++; return 1; } }
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task DelayedFarkleCompletion_NormalizesBeforeBroadcastAndPersistence(bool partial)
    {
        var state = new FarkleState { Phase = FarklePhase.Farkled };
        var room = new Room { Code = "FARKLE", GameType = GameType.Farkle, State = GameState.Playing, GameData = state };
        await EstablishBaseline(room);
        // The delayed Farkle callback writes directly to the room rather than passing through SubmitAction.
        state.Phase = FarklePhase.GameOver;
        room.State = GameState.Finished;
        _manager.MarkDirty(room.Code, partial ? nameof(Room.GameData) : null);
        await _manager.ProcessRoomUpdateAsync(room.Code);
        Assert.Equal(ResultPhase.GameOver, room.ResultPhase);
        _proxy.Verify(c => c.SendCoreAsync("RoomStatePatch",
            It.Is<object[]>(args => ((JsonNode)args[0])["state"]!.GetValue<string>() == "Finished"
                && ((JsonNode)args[0])["resultPhase"]!.GetValue<string>() == "GameOver"),
            It.IsAny<CancellationToken>()), Times.Once);
        _persistence.Verify(p => p.QueueSave(It.Is<RoomSnapshot>(snapshot => snapshot.State == "Finished" && snapshot.SchemaVersion == 2)), Times.Once);
        _serializer.Verify(s => s.Serialize(It.Is<Room>(r => r.ResultPhase == ResultPhase.GameOver)), Times.Once);
    }

    [Fact]
    public async Task PartialPhaseClear_EmitsNullAndUpdatesBaseline()
    {
        var room = new Room { Code = "CLEAR", State = GameState.Finished, ResultPhase = ResultPhase.GameOver };
        await EstablishBaseline(room);
        room.State = GameState.Playing;
        _manager.MarkDirty(room.Code, nameof(Room.State));
        await _manager.ProcessRoomUpdateAsync(room.Code);
        var patch = (JsonObject)((object[])_proxy.Invocations.Single().Arguments[1])[0];
        Assert.True(patch.ContainsKey("resultPhase"));
        Assert.Null(patch["resultPhase"]);
        _proxy.Invocations.Clear();
        _manager.MarkDirty(room.Code, nameof(Room.ResultPhase));
        await _manager.ProcessRoomUpdateAsync(room.Code);
        Assert.Empty(_proxy.Invocations);
    }

    [Fact]
    public async Task FiveQueuedMarks_SerializeBroadcastAndSaveOnce()
    {
        var data = new CountedGameData();
        var room = new Room { Code = "COUNTS", GameData = data };
        await EstablishBaseline(room);
        data.Reads = 0;
        room.RoundNumber = 1;
        foreach (var member in new[] { nameof(Room.RoundNumber), nameof(Room.GameData),
            nameof(Room.Players), nameof(Room.RoundScores), nameof(Room.PlayerAnswers) })
            _manager.MarkDirty(room.Code, member);

        for (var i = 0; i < 5; i++)
            await _manager.ProcessRoomUpdateAsync(room.Code);

        _output.WriteLine($"Five queued marks: broadcast={_proxy.Invocations.Count}, saves={_persistence.Invocations.Count}, persistence serialization={_serializer.Invocations.Count}, game-data serialization={data.Reads}");
        _proxy.Invocations.Should().HaveCount(1);
        _persistence.Verify(p => p.QueueSave(It.IsAny<RoomSnapshot>()), Times.Once);
        _serializer.Verify(s => s.Serialize(room), Times.Once);
        data.Reads.Should().Be(1);
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task FailedSend_RetriesUnsentStateWithoutAnotherMark(bool partial)
    {
        var room = new Room { Code = "RETRY" };
        await EstablishBaseline(room);
        room.RoundNumber = 7;
        _manager.MarkDirty(room.Code, partial ? nameof(Room.RoundNumber) : null);
        _proxy.SetupSequence(c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("send failed"))
            .Returns(Task.CompletedTask);

        await _manager.ProcessRoomUpdateAsync(room.Code);
        room.DirtyMembers.Keys.Should().Contain("ALL");
        _persistence.Invocations.Should().BeEmpty();
        await _manager.ProcessRoomUpdateAsync(room.Code);

        _proxy.Verify(c => c.SendCoreAsync("RoomStatePatch",
            It.Is<object[]>(args => ((JsonNode)args[0])["roundNumber"] != null && ((JsonNode)args[0])["roundNumber"]!.GetValue<int>() == 7),
            It.IsAny<CancellationToken>()), Times.Exactly(2));
        _persistence.Verify(p => p.QueueSave(It.IsAny<RoomSnapshot>()), Times.Once);
        room.DirtyMembers.Should().BeEmpty();
    }

    [Fact]
    public async Task MarkDuringSend_RemainsPendingAndSavesBothChanges()
    {
        var room = new Room { Code = "DURING" };
        await EstablishBaseline(room);
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var release = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        _proxy.Setup(c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .Returns(async () => { entered.TrySetResult(); await release.Task; });
        room.RoundNumber = 1;
        _manager.MarkDirty(room.Code, nameof(Room.RoundNumber));
        var firstPass = _manager.ProcessRoomUpdateAsync(room.Code);
        await entered.Task.WaitAsync(TimeSpan.FromSeconds(10));
        try
        {
            await room.StateLock.WaitAsync();
            try
            {
                room.RoundNumber = 2;
                _manager.MarkDirty(room.Code, nameof(Room.RoundNumber));
            }
            finally { room.StateLock.Release(); }
        }
        finally { release.TrySetResult(); }
        await firstPass;
        await _manager.ProcessRoomUpdateAsync(room.Code);
        await _manager.ProcessRoomUpdateAsync(room.Code);

        var rounds = _proxy.Invocations.Select(i => ((JsonNode)((object[])i.Arguments[1])[0])["roundNumber"]!.GetValue<int>());
        rounds.Should().Equal(1, 2);
        _persistence.Verify(p => p.QueueSave(It.IsAny<RoomSnapshot>()), Times.Exactly(2));
        _serializer.Verify(s => s.Serialize(room), Times.Exactly(2));
    }

    [Fact]
    public async Task FailedSerialization_RearmsFullDiffAndPreservesLaterMark()
    {
        var room = new Room { Code = "SERIALIZE" };
        await EstablishBaseline(room);
        room.RoundNumber = 1;
        _manager.MarkDirty(room.Code, nameof(Room.RoundNumber));
        _serializer.Setup(s => s.Serialize(room)).Returns(() =>
        {
            room.GameType = GameType.Babble;
            _manager.MarkDirty(room.Code, nameof(Room.GameType));
            throw new InvalidOperationException("serialization failed");
        });
        await _manager.ProcessRoomUpdateAsync(room.Code);
        room.DirtyMembers.Keys.Should().Contain(new[] { "ALL", nameof(Room.GameType) });
        _serializer.Setup(s => s.Serialize(room)).Returns("{}");
        await _manager.ProcessRoomUpdateAsync(room.Code);

        _proxy.Verify(c => c.SendCoreAsync("RoomStatePatch",
            It.Is<object[]>(args => ((JsonNode)args[0])["roundNumber"]!.GetValue<int>() == 1 &&
                ((JsonNode)args[0])["gameType"]!.GetValue<string>() == "Babble"),
            It.IsAny<CancellationToken>()), Times.Once);
        _persistence.Verify(p => p.QueueSave(It.IsAny<RoomSnapshot>()), Times.Once);
    }

    [Fact]
    public async Task HostedConsumer_RetriesLastFailedNotificationWithoutAnotherMark()
    {
        var room = new Room { Code = "AUTO", RoundNumber = 7 };
        var saved = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        _proxy.SetupSequence(c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("temporary send failure"))
            .Returns(Task.CompletedTask);
        _persistence.Setup(p => p.QueueSave(It.IsAny<RoomSnapshot>())).Callback(() => saved.TrySetResult());
        _manager.TrackRoom(room);
        var revision = room.Revision;

        await _manager.StartAsync(CancellationToken.None);
        try
        {
            await saved.Task.WaitAsync(TimeSpan.FromSeconds(10));
        }
        finally
        {
            await _manager.StopAsync(CancellationToken.None);
            _manager.Dispose();
        }

        _proxy.Verify(c => c.SendCoreAsync("RoomStatePatch",
            It.Is<object[]>(args => ((JsonNode)args[0])["roundNumber"]!.GetValue<int>() == 7),
            It.IsAny<CancellationToken>()), Times.Exactly(2));
        _persistence.Verify(p => p.QueueSave(It.IsAny<RoomSnapshot>()), Times.Once);
        room.Revision.Should().Be(revision);
    }

    [Fact]
    public async Task HostedConsumer_PersistentFailureExhaustsBudgetThenProcessesHealthyRoom()
    {
        var failed = new Room { Code = "FAILED" };
        var healthy = new Room { Code = "HEALTHY" };
        var healthySaved = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var failureAttempts = 0;
        _proxy.Setup(c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .Returns((string method, object[] args, CancellationToken token) =>
            {
                if (((JsonNode)args[0])["code"]!.GetValue<string>() == failed.Code)
                {
                    Interlocked.Increment(ref failureAttempts);
                    return Task.FromException(new InvalidOperationException("persistent send failure"));
                }
                return Task.CompletedTask;
            });
        _persistence.Setup(p => p.QueueSave(It.Is<RoomSnapshot>(s => s.RoomCode == healthy.Code)))
            .Callback(() => healthySaved.TrySetResult());
        _manager.TrackRoom(failed);
        _manager.TrackRoom(healthy);
        var failedRevision = failed.Revision;

        await _manager.StartAsync(CancellationToken.None);
        try
        {
            await healthySaved.Task.WaitAsync(TimeSpan.FromSeconds(10));
        }
        finally
        {
            await _manager.StopAsync(CancellationToken.None);
            _manager.Dispose();
        }

        failureAttempts.Should().Be(3);
        failed.Revision.Should().Be(failedRevision);
        failed.DirtyMembers.Keys.Should().Contain("ALL");
        _proxy.Invocations.Should().HaveCount(4);
        _persistence.Verify(p => p.QueueSave(It.IsAny<RoomSnapshot>()), Times.Once);
    }

    [Fact]
    public async Task HostedConsumer_ShutdownCancelsSendWithoutRetry()
    {
        var entered = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        _proxy.Setup(c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()))
            .Returns((string method, object[] args, CancellationToken token) =>
            {
                entered.TrySetResult();
                return Task.Delay(Timeout.InfiniteTimeSpan, token);
            });
        _manager.TrackRoom(new Room { Code = "STOP" });
        await _manager.StartAsync(CancellationToken.None);
        try
        {
            await entered.Task.WaitAsync(TimeSpan.FromSeconds(10));
        }
        finally
        {
            await _manager.StopAsync(CancellationToken.None);
            _manager.Dispose();
        }

        _proxy.Verify(c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Once);
        _persistence.Invocations.Should().BeEmpty();
    }
}
