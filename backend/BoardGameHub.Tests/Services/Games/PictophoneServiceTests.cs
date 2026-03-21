using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class PictophoneServiceTests
{
    private readonly PictophoneService _sut;

    public PictophoneServiceTests()
    {
        _sut = new PictophoneService(new Mock<ILogger<PictophoneService>>().Object);
    }

    [Fact]
    public async Task StartRound_ShouldInitializeBooksForEachPlayer()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" }
            }
        };
        var settings = new GameSettings { TimerDurationSeconds = 60 };

        await _sut.StartRound(room, settings);

        var state = room.GameData as PictophoneState;
        state.Should().NotBeNull();
        state!.Books.Should().HaveCount(2);
        state.Phase.Should().Be(PictophonePhase.Prompting);
    }

    [Fact]
    public async Task SubmitPage_ShouldAdvanceToNextPhase_WhenAllSubmitted()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" }
            },
            Settings = new GameSettings { TimerDurationSeconds = 60 }
        };
        await _sut.StartRound(room, room.Settings);
        var state = room.GameData as PictophoneState;

        await _sut.SubmitPage(room, "p1", "Prompt 1");
        await _sut.SubmitPage(room, "p2", "Prompt 2");

        state!.Phase.Should().Be(PictophonePhase.Drawing);
        state.RoundIndex.Should().Be(1);
        state.Books.First(b => b.OwnerId == "p1").CurrentHolderId.Should().Be("p2");
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new PictophoneState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }

    [Fact]
    public async Task HandleAction_SubmitPage_ShouldWork()
    {
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "p1" } },
            Settings = new GameSettings()
        };
        await _sut.StartRound(room, room.Settings);
        var payload = JsonSerializer.SerializeToElement(new { content = "My Prompt" });
        var action = new GameAction("SUBMIT_PAGE", payload);

        var result = await _sut.HandleAction(room, action, "p1");

        result.Should().BeTrue();
    }
}
