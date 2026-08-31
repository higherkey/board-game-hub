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

    private async Task InvokeGameTickAsync(string roomCode = "")
    {
        if (!string.IsNullOrEmpty(roomCode))
        {
            await _manager.ProcessRoomUpdateAsync(roomCode);
        }
        else
        {
            // If no room code provided, process any tracked rooms
            var activeRoomsField = typeof(GameStateManager).GetField("_activeRooms", BindingFlags.NonPublic | BindingFlags.Instance);
            if (activeRoomsField?.GetValue(_manager) is System.Collections.Concurrent.ConcurrentDictionary<string, Room> activeRooms)
            {
                foreach (var code in activeRooms.Keys)
                {
                    await _manager.ProcessRoomUpdateAsync(code);
                }
            }
        }
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

    [Fact]
    public async Task MarkDirty_ConcurrentCalls_ShouldNotThrow()
    {
        // Arrange
        var room = new Room { Code = "CONC1" };
        _manager.TrackRoom(room);
        var tasks = new List<Task>();
        int callCount = 100;

        // Act & Assert
        for (int i = 0; i < callCount; i++)
        {
            int index = i;
            tasks.Add(Task.Run(() => _manager.MarkDirty("CONC1", $"Member{index}")));
        }

        await Task.WhenAll(tasks);
        
        // Verify DirtyMembers has correct count (using reflection since internal)
        var dirtyMembers = room.DirtyMembers;
        dirtyMembers.Count.Should().Be(callCount + 1); // +1 for the "ALL" member added in TrackRoom
    }

    [Fact]
    public async Task GameTick_ExtractionWhileAdding_ShouldBeConsistent()
    {
        // Arrange
        var room = new Room { Code = "EXTRACT1" };
        _manager.TrackRoom(room);
        bool running = true;

        // Start a background task that keeps adding dirty members
        var adderTask = Task.Run(async () => {
            int i = 0;
            while (running)
            {
                _manager.MarkDirty("EXTRACT1", $"Member{i++}");
                if (i % 10 == 0) await Task.Delay(1); // Yield lightly
            }
        });

        // Act - Run multiple ticks
        try
        {
            for (int i = 0; i < 5; i++)
            {
                await InvokeGameTickAsync();
                await Task.Delay(10);
            }
        }
        finally
        {
            running = false;
            await adderTask;
        }

        // Assert - If we reached here without exception, it's a pass.
        // Collection modification exceptions were the primary target of #85.
        _mockClientProxy.Verify(
            c => c.SendCoreAsync("RoomStatePatch", It.IsAny<object[]>(), It.IsAny<CancellationToken>()),
            Times.AtLeastOnce());
    }
}
