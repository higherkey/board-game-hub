using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class OneAndOnlyServiceTests
{
    private readonly OneAndOnlyService _sut;

    public OneAndOnlyServiceTests()
    {
        _sut = new OneAndOnlyService();
    }

    [Fact]
    public void EliminateClues_ShouldEliminateExactDuplicates_CaseInsensitive()
    {
        // Arrange
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" }, new Player { ConnectionId = "p3" }, // Clue givers
                new Player { ConnectionId = "guesser" }
            }
        };
        var state = new OneAndOnlyState 
        { 
            Phase = OneAndOnlyPhase.ClueGiving, 
            GuesserId = "guesser",
            Clues = new Dictionary<string, string>() // Will be populated by SubmitClue
        };
        room.GameData = state;

        // Act
        _sut.SubmitClue(room, "p1", "Apple");
        _sut.SubmitClue(room, "p2", "apple"); // Duplicate
        _sut.SubmitClue(room, "p3", "Banana"); // Unique

        // Assert
        state.Phase.Should().Be(OneAndOnlyPhase.Guessing); // Should transition
        state.InvalidClues.Should().Contain(new[] { "APPLE" });
        state.InvalidClues.Count.Should().Be(2);
    }

    [Fact]
    public void EliminateClues_ShouldEliminatePlurals()
    {
         // Arrange
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" },
                new Player { ConnectionId = "guesser" }
            }
        };
        var state = new OneAndOnlyState { Phase = OneAndOnlyPhase.ClueGiving, GuesserId = "guesser" };
        room.GameData = state;

        // Act
        _sut.SubmitClue(room, "p1", "Car");
        _sut.SubmitClue(room, "p2", "Cars");

        // Assert
        state.Phase.Should().Be(OneAndOnlyPhase.Guessing);
        state.InvalidClues.Should().Contain(new[] { "CAR", "CARS" });
    }
    [Fact]
    public void SubmitGuess_Correct_ShouldIncrementSuccess()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "g" } } };
        var state = new OneAndOnlyState { Phase = OneAndOnlyPhase.Guessing, GuesserId = "g", TargetWord = "Apple" };
        room.GameData = state;

        _sut.SubmitGuess(room, "Apple");

        state.Phase.Should().Be(OneAndOnlyPhase.Result);
        state.Result.Should().Be("Success");
        state.CorrectRounds.Should().Be(1);
    }

    [Fact]
    public void SubmitGuess_Incorrect_ShouldIncrementFailure()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "g" } } };
        var state = new OneAndOnlyState { Phase = OneAndOnlyPhase.Guessing, GuesserId = "g", TargetWord = "Apple" };
        room.GameData = state;

        _sut.SubmitGuess(room, "Banana");

        state.Result.Should().Be("Failure");
        state.FailedRounds.Should().Be(1);
    }

    [Fact]
    public void SubmitGuess_Pass_ShouldSetPassed()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "g" } } };
        var state = new OneAndOnlyState { Phase = OneAndOnlyPhase.Guessing, GuesserId = "g", TargetWord = "Apple" };
        room.GameData = state;

        _sut.SubmitGuess(room, null, isPass: true);

        state.Result.Should().Be("Passed");
        state.GuesserResponse.Should().Be("[PASSED]");
    }
}
