using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class DeepfakeGameServiceTests
{
    private readonly DeepfakeGameService _sut;

    public DeepfakeGameServiceTests()
    {
        _sut = new DeepfakeGameService(new Mock<ILogger<DeepfakeGameService>>().Object);
    }

    [Fact]
    public async Task StartRound_ShouldAssignFakerAndPrompt()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" }
            }
        };
        await _sut.StartRound(room, new GameSettings());

        var state = room.GameData as DeepfakeState;
        state.Should().NotBeNull();
        state!.Prompt.Should().NotBeNullOrEmpty();
        state.AiConnectionId.Should().NotBeNullOrEmpty();
        room.Players.Select(p => p.ConnectionId).Should().Contain(state.AiConnectionId);
        state.Phase.Should().Be(DeepfakePhase.Drawing);
    }

    [Fact]
    public void SubmitStroke_ShouldAdvanceTurn_AndEnforceOrder()
    {
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" } }
        };
        var state = new DeepfakeState
        {
            PlayerOrder = new List<string> { "p1", "p2" }, // P1 then P2
            CurrentTurnIndex = 0,
            Phase = DeepfakePhase.Drawing,
            TotalRounds = 1 
            // TotalRounds is 2 by default, so 1 cycle is half way
        };
        room.GameData = state;

        // Act - Wrong Player
        bool wrongTurn = _sut.SubmitStroke(room, "p2", "path", "red");
        wrongTurn.Should().BeFalse();

        // Act - Correct Player
        bool correctTurn = _sut.SubmitStroke(room, "p1", "path", "red");
        correctTurn.Should().BeTrue();
        state.CurrentTurnIndex.Should().Be(1);
        state.Strokes.Should().HaveCount(1);
    }

    [Fact]
    public void SubmitStroke_ShouldTransitionToVoting_WhenRoundsComplete()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        var state = new DeepfakeState
        {
            PlayerOrder = new List<string> { "p1" },
            CurrentTurnIndex = 0,
            TotalRounds = 1
        };
        room.GameData = state;

        _sut.SubmitStroke(room, "p1", "path", "red");

        state.Phase.Should().Be(DeepfakePhase.Voting);
    }

    [Fact]
    public void SubmitVote_ShouldDetermineResult_WhenAllVoted()
    {
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" }, new Player { ConnectionId = "ai" } }
        };
        var state = new DeepfakeState
        {
            Phase = DeepfakePhase.Voting,
            AiConnectionId = "ai"
        };
        room.GameData = state;

        // Act - Votes (2 vs 1)
        _sut.SubmitVote(room, "p1", "ai");
        _sut.SubmitVote(room, "p2", "ai");
        _sut.SubmitVote(room, "ai", "p1");

        // Assert
        state.AiCaught.Should().BeTrue();
        // Phase stays Voting? Or expects AI Guess?
        // Logic: if (state.AiCaught) -> State.AiCaught = true.
        // It does NOT transition to Results immediately if caught.
        // Because AI gets a guess.
        state.Phase.Should().Be(DeepfakePhase.Voting); 
    }

    [Fact]
    public void SubmitAiGuess_ShouldWin_IfCorrect()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "ai" } } };
        var state = new DeepfakeState
        {
            AiConnectionId = "ai",
            AiCaught = true,
            Prompt = "Giraffe"
        };
        room.GameData = state;

        // Act
        bool result = _sut.SubmitAiGuess(room, "ai", "Giraffe");

        // Assert
        result.Should().BeTrue();
        state.AiWon.Should().BeTrue();
        state.Phase.Should().Be(DeepfakePhase.Results);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new DeepfakeState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }

    [Fact]
    public async Task HandleAction_SubmitStroke_ShouldUpdateStrokes()
    {
        var player = new Player { ConnectionId = "p1" };
        var state = new DeepfakeState
        {
            PlayerOrder = new List<string> { "p1" },
            CurrentTurnIndex = 0,
            Phase = DeepfakePhase.Drawing,
            TotalRounds = 1
        };
        var room = new Room { Players = new List<Player> { player }, GameData = state };
        var payload = JsonSerializer.SerializeToElement(new { pathData = "M 0 0 L 10 10", color = "red" });
        var action = new GameAction("SUBMIT_STROKE", payload);

        var result = await _sut.HandleAction(room, action, "p1");

        result.Should().BeTrue();
        state.Strokes.Should().HaveCount(1);
    }

    [Fact]
    public async Task HandleAction_SubmitVote_ShouldProcessVote()
    {
        var player = new Player { ConnectionId = "p1" };
        var aiPlayer = new Player { ConnectionId = "ai" };
        var state = new DeepfakeState
        {
            Phase = DeepfakePhase.Voting,
            AiConnectionId = "ai"
        };
        var room = new Room { Players = new List<Player> { player, aiPlayer }, GameData = state };
        var payload = JsonSerializer.SerializeToElement(new { accusedId = "ai" });
        var action = new GameAction("SUBMIT_VOTE", payload);

        var result = await _sut.HandleAction(room, action, "p1");

        result.Should().BeTrue();
        state.Votes.Should().ContainKey("p1").And.ContainValue("ai");
    }

    [Fact]
    public async Task HandleAction_SubmitAiGuess_ShouldProcessGuess()
    {
        var aiPlayer = new Player { ConnectionId = "ai" };
        var state = new DeepfakeState
        {
            AiConnectionId = "ai",
            AiCaught = true,
            Prompt = "Giraffe"
        };
        var room = new Room { Players = new List<Player> { aiPlayer }, GameData = state };
        var payload = JsonSerializer.SerializeToElement(new { guess = "Giraffe" });
        var action = new GameAction("SUBMIT_AI_GUESS", payload);

        var result = await _sut.HandleAction(room, action, "ai");

        result.Should().BeTrue();
        state.AiWon.Should().BeTrue();
        state.Phase.Should().Be(DeepfakePhase.Results);
    }
}
