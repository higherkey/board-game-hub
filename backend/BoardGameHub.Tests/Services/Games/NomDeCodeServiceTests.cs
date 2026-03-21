using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class NomDeCodeServiceTests
{
    private readonly NomDeCodeService _sut;

    public NomDeCodeServiceTests()
    {
        _sut = new NomDeCodeService();
    }

    [Fact]
    public async Task StartRound_ShouldInitializeGrid()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        await _sut.StartRound(room, new GameSettings());
        var state = room.GameData as NomDeCodeState;
        state.Should().NotBeNull();
        state!.Grid.Should().HaveCount(25);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new NomDeCodeState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }
}
