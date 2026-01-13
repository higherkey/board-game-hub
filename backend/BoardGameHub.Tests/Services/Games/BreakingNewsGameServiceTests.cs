using Xunit;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using FluentAssertions;

namespace BoardGameHub.Tests.Services.Games;

public class BreakingNewsGameServiceTests
{
    private readonly BreakingNewsGameService _service;

    public BreakingNewsGameServiceTests()
    {
        _service = new BreakingNewsGameService();
    }

    private Room CreateMockRoom(int playerCount)
    {
        var room = new Room { Code = "TEST", RoundNumber = 1 };
        for (int i = 0; i < playerCount; i++)
        {
            room.Players.Add(new Player { ConnectionId = $"p{i}", Name = $"Player {i}" });
        }
        return room;
    }

    [Fact]
    public async Task StartRound_ShouldInitializeStateCorrectly()
    {
        var room = CreateMockRoom(4); // 1 Anchor, 3 Writers
        await _service.StartRound(room, new GameSettings());

        var state = (BreakingNewsState)room.GameData;
        state.AnchorConnectionId.Should().Be("p1"); // 1 % 4 = 1
        state.ScriptTitle.Should().Be("The Weather Report");
        state.Slots.Should().HaveCount(4);
        state.SlotOwners.Should().HaveCount(4);
        
        // Ensure Anchor is not a slot owner (ideally)
        // In current implementation: writers = all except anchor.
        // Slots are assigned to writers.
        state.SlotOwners.Values.Should().NotContain("p1");
    }

    [Fact]
    public async Task UpdateSlot_ShouldUpdate_WhenOwner()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());
        var state = (BreakingNewsState)room.GameData;

        // Player p0 should own slot 0 (0 % 3 = 0, where writers are [p0, p2, p3])
        // Wait, let's check writers list: [p0, p2, p3] (because p1 is anchor)
        // Slot 0 -> writers[0 % 3] = p0
        var ownerId = state.SlotOwners[0];
        
        var success = await _service.UpdateSlot(room, 0, "Funny Noun", ownerId);

        success.Should().BeTrue();
        state.Slots[0].CurrentValue.Should().Be("Funny Noun");
        state.Slots[0].LastEditedBy.Should().Be(ownerId);
    }

    [Fact]
    public async Task UpdateSlot_ShouldFail_WhenNotOwner()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());
        var state = (BreakingNewsState)room.GameData;

        var ownerId = state.SlotOwners[0];
        var nonOwnerId = "p1"; // Anchor

        var success = await _service.UpdateSlot(room, 0, "Illegal update", nonOwnerId);

        success.Should().BeFalse();
        state.Slots[0].CurrentValue.Should().Be("______");
    }

    [Fact]
    public async Task UpdateSlot_ShouldFail_WhenSlotInvalid()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());

        var success = await _service.UpdateSlot(room, 99, "Value", "p0");

        success.Should().BeFalse();
    }
}
