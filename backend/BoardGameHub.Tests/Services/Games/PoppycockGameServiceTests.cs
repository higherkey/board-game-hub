using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class PoppycockGameServiceTests
{
    private readonly PoppycockGameService _sut;

    public PoppycockGameServiceTests()
    {
        _sut = new PoppycockGameService();
    }

    [Fact]
    public async Task StartRound_ShouldInitializeState_WithDasherAndPrompt()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" }
            },
            RoundNumber = 1
        };
        var settings = new GameSettings();

        await _sut.StartRound(room, settings);

        var state = room.GameData as PoppycockState;
        state.Should().NotBeNull();
        state!.DasherId.Should().Be("p2"); // 1 % 2 = 1
        state.CurrentPrompt.Should().NotBeNull();
        state.Phase.Should().Be(PoppycockPhase.Faking);
    }

    [Fact]
    public async Task SubmitDefinition_ShouldAdvanceToVoting_WhenAllNonDasherSubmitted()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "dasher" },
                new Player { ConnectionId = "p1" }
            },
            RoundNumber = 0 // Dasher = p0 (dasher)
        };
        await _sut.StartRound(room, new GameSettings());
        var state = room.GameData as PoppycockState;

        await _sut.SubmitDefinition(room, "p1", "My fake definition");

        state!.Phase.Should().Be(PoppycockPhase.Voting);
        state.PlayerSubmissions.Should().ContainKey("p1");
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new PoppycockState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }

    [Fact]
    public async Task HandleAction_SubmitDefinition_ShouldWork()
    {
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "dasher" }, new Player { ConnectionId = "p1" } },
            RoundNumber = 0
        };
        await _sut.StartRound(room, new GameSettings());
        var payload = JsonSerializer.SerializeToElement(new { definition = "Fancy Fake" });
        var action = new GameAction("SUBMIT_DEFINITION", payload);

        var result = await _sut.HandleAction(room, action, "p1");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAction_SubmitVote_ShouldWork()
    {
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "dasher" }, new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" } },
            RoundNumber = 0
        };
        await _sut.StartRound(room, new GameSettings());
        var state = (PoppycockState)room.GameData!;
        state.Phase = PoppycockPhase.Voting;
        var payload = JsonSerializer.SerializeToElement(new { votedId = "p1" });
        var action = new GameAction("SUBMIT_VOTE", payload);

        var result = await _sut.HandleAction(room, action, "p2");

        result.Should().BeTrue();
    }
}
