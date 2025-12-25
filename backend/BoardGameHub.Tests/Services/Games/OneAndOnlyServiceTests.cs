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
        state.InvalidClues.Should().Contain(new[] { "Apple", "apple" });
        // Valid clues are not explicitly stored in a "ValidClues" list in State, but UI filters based on InvalidClues.
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
        state.InvalidClues.Should().Contain(new[] { "Car", "Cars" });
    }
}
