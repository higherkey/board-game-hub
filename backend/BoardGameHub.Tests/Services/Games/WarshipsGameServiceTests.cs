using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class WarshipsGameServiceTests
{
    private readonly WarshipsGameService _sut;

    public WarshipsGameServiceTests()
    {
        _sut = new WarshipsGameService();
    }

    [Fact]
    public async Task StartRound_ShouldInitializePlayerBoards()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        await _sut.StartRound(room, new GameSettings());
        var state = room.GameData as WarshipsState;
        state.Should().NotBeNull();
        state!.PlayerBoards.Should().ContainKey("p1");
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new WarshipsState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }
}
