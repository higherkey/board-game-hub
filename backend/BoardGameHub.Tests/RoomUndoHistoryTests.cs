using System.Text.Json;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;

namespace BoardGameHub.Tests;

public class RoomUndoHistoryTests
{
    [Fact]
    public void Push_Overflow_ShouldRetainTenNewestSnapshotsInUndoOrder()
    {
        var history = new Room().StateHistory;

        for (var i = 0; i < 35; i++) history.Push(i.ToString());

        history.Count.Should().Be(10);
        history.Should().Equal(Enumerable.Range(25, 10).Reverse().Select(i => i.ToString()));
        for (var i = 34; i >= 25; i--) history.Pop().Should().Be(i.ToString());
        history.Should().BeEmpty();
        var popEmpty = () => history.Pop();
        popEmpty.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Push_AfterUndoAndClear_ShouldReuseHistoryWithoutStaleSnapshots()
    {
        var history = new Room().StateHistory;
        for (var i = 0; i < 12; i++) history.Push(i.ToString());
        history.Pop().Should().Be("11");
        history.Pop().Should().Be("10");

        history.Push("replacement");

        history.Pop().Should().Be("replacement");
        history.Pop().Should().Be("9");
        history.Clear();
        history.Should().BeEmpty();
        history.Push("fresh");
        history.Pop().Should().Be("fresh");
        history.Should().BeEmpty();
    }

    [Fact]
    public void Serialize_ShouldKeepUndoHistoryOutOfSnapshotsAndPersistence()
    {
        var room = new Room { Code = "UNDO", RoundNumber = 7 };
        room.StateHistory.Push("private-snapshot");
        var serializer = new RoomStateSerializer();

        var snapshot = JsonSerializer.Serialize(room, new JsonSerializerOptions { IncludeFields = true });
        var persisted = serializer.Serialize(room);

        snapshot.Should().NotContain("StateHistory").And.NotContain("private-snapshot");
        persisted.Should().NotContain("stateHistory").And.NotContain("private-snapshot");
        serializer.Deserialize(persisted).StateHistory.Should().BeEmpty();
        JsonSerializer.Deserialize<Room>(snapshot)!.StateHistory.Should().BeEmpty();
        serializer.Deserialize(persisted).RoundNumber.Should().Be(7);
    }
}
