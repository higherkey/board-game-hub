using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class FourInARowGameServiceTests
{
    private readonly FourInARowGameService _sut;

    public FourInARowGameServiceTests()
    {
        _sut = new FourInARowGameService();
    }

    [Fact]
    public async Task StartRound_ShouldInitializeGrid()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        await _sut.StartRound(room, new GameSettings());
        var state = room.GameData as FourInARowState;
        state.Should().NotBeNull();
        state!.Grid[0, 0].Should().Be(0);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new FourInARowState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }
}
