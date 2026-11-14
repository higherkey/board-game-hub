using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Xunit;

namespace BoardGameHub.Tests;

public class PlayerIdentityPersistenceTests
{
    [Fact]
    public void PersistRestoreRoundTrip_KeepsUserId()
    {
        var serializer = new RoomStateSerializer();
        var room = new Room { Code = "ABCD" };
        room.Players.Add(new Player { ConnectionId = "c1", Name = "A", UserId = "acct-1" });
        room.Players.Add(new Player { ConnectionId = "c2", Name = "G", UserId = "guest:xyz" });

        var restored = serializer.Deserialize(serializer.Serialize(room));

        restored.Players.Select(p => p.UserId).Should().Equal("acct-1", "guest:xyz");
        restored.Players.Select(p => p.SessionId).Should().Equal(room.Players.Select(p => p.SessionId));
        restored.Players.Select(p => p.IsRegistered).Should().Equal(true, false);
    }
}
