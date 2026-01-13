using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class DeepfakeGameServiceTests
{
    private readonly DeepfakeGameService _sut;

    public DeepfakeGameServiceTests()
    {
        _sut = new DeepfakeGameService();
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
        
        // Wait, review code:
        // if (mostVotedIds.Contains(ai)) { AiCaught = true; }
        // else { AiWon = true; Phase = Results; }
        // So validation holds.
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
}
