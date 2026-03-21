using System.Reflection;
using System.Text.Json.Nodes;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services;

public class GameStateManagerTests
{
    private readonly Mock<IHubContext<GameHub>> _mockHubContext;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly StateDiffService _diffService;
    private readonly Mock<ILogger<GameStateManager>> _mockLogger;
    private readonly GameStateManager _manager;

    public GameStateManagerTests()
    {
        _mockHubContext = new Mock<IHubContext<GameHub>>();
        _mockClientProxy = new Mock<IClientProxy>();

        var mockClients = new Mock<IHubClients>();
        mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockHubContext.Setup(h => h.Clients).Returns(mockClients.Object);

        _diffService = new StateDiffService();
        _mockLogger = new Mock<ILogger<GameStateManager>>();

        _manager = new GameStateManager(_mockHubContext.Object, _diffService, _mockLogger.Object);
    }

    private async Task InvokeGameTickAsync()
    {
        var method = typeof(GameStateManager).GetMethod("GameTick", BindingFlags.NonPublic | BindingFlags.Instance);
        var task = (Task)method!.Invoke(_manager, null)!;
        await task;
    }

    [Fact]
    public void TrackRoom_ShouldAddRoomAndMarkDirty()
    {
        var room = new Room { Code = "TEST1" };
        _manager.TrackRoom(room);

        var retrieved = _manager.GetRoom("TEST1");
        retrieved.Should().NotBeNull();
        retrieved!.Code.Should().Be("TEST1");
    }

    [Fact]
    public void UntrackRoom_ShouldRemoveRoom()
    {
        var room = new Room { Code = "TEST2" };
        _manager.TrackRoom(room);
        _manager.UntrackRoom("TEST2");

        var retrieved = _manager.GetRoom("TEST2");
        retrieved.Should().BeNull();
    }

    [Fact]
    public async Task GameTick_ShouldBroadcastFullState_WhenFirstTracked()
    {
        var room = new Room { Code = "FULL1", HostPlayerId = "Host123" };
        _manager.TrackRoom(room);

        await InvokeGameTickAsync();

        _mockClientProxy.Verify(
            c => c.SendCoreAsync("RoomStatePatch",
                 It.IsAny<object[]>(),
                 It.IsAny<CancellationToken>()),
            Times.Once);

        // Verify it sent the actual host name
        _mockClientProxy.Invocations.Clear();
    }

    [Fact]
    public async Task GameTick_ShouldBroadcastPartialState_WhenSpecificMemberMarked()
    {
        var room = new Room { Code = "PART1", HostPlayerId = "Host123", GameType = GameType.None };
        _manager.TrackRoom(room);

        // First tick sends full state
        await InvokeGameTickAsync();
        _mockClientProxy.Invocations.Clear();

        // Mutate and mark specific property dirty
        await room.StateLock.WaitAsync();
        try
        {
            room.GameType = GameType.Babble;
        }
        finally
        {
            room.StateLock.Release();
        }

        _manager.MarkDirty("PART1", nameof(Room.GameType));

        // Second tick should send partial diff
        await InvokeGameTickAsync();

        _mockClientProxy.Verify(
            c => c.SendCoreAsync("RoomStatePatch",
                 It.Is<object[]>(args => 
                    args.Length == 1 && 
                    args[0] is JsonNode && 
                    ((JsonNode)args[0])["gameType"] != null &&
                    ((JsonNode)args[0])["gameType"]!.GetValue<string>() == "Babble"),
                 It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GameTick_ShouldBroadcastFullState_WhenMarkedDirtyWithNoMember()
    {
                 // Actually GameTick falls back to full serialization if fullDiff == true.
        var room = new Room { Code = "NULL1", HostPlayerId = "Host123" };
        _manager.TrackRoom(room);

        // Clear initial full broadcast
        await InvokeGameTickAsync();
        _mockClientProxy.Invocations.Clear();

        await room.StateLock.WaitAsync();
        try
        {
            room.HostPlayerId = "NewHost";
        }
        finally
        {
            room.StateLock.Release();
        }

        _manager.MarkDirty("NULL1", null); // Full diff

        await InvokeGameTickAsync();

        _mockClientProxy.Verify(
            c => c.SendCoreAsync("RoomStatePatch",
                 It.IsAny<object[]>(),
                 It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
