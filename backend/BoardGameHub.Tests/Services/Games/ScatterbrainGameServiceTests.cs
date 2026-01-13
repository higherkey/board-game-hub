using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class ScatterbrainGameServiceTests
{
    private readonly ScatterbrainGameService _sut;

    public ScatterbrainGameServiceTests()
    {
        _sut = new ScatterbrainGameService();
    }

    [Fact]
    public async Task StartRound_ShouldInitializeState_WithLetterAndCategories()
    {
        // Arrange
        var room = new Room { Code = "TEST" };
        var settings = new GameSettings { LetterMode = ScatterbrainData.LetterMode.Normal }; // Default settings? Assuming enum exists

        // Act
        await _sut.StartRound(room, settings);

        // Assert
        var state = room.GameData as ScatterbrainState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(ScatterbrainPhase.Writing);
        state.CurrentLetter.Should().NotBeNull();
        state.Categories.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CalculateScores_ShouldAwardPoints_ForValidAlliterations()
    {
        // Arrange
        var room = new Room 
        { 
            Code = "TEST",
            Players = new List<Player> 
            { 
                new Player { ConnectionId = "p1", Name = "Alice", Score = 0 },
                new Player { ConnectionId = "p2", Name = "Bob", Score = 0 }
            }
        };

        var state = new ScatterbrainState
        {
            Phase = ScatterbrainPhase.Validation,
            CurrentLetter = 'A',
            Categories = new List<string> { "Fruit", "City" }
        };
        room.GameData = state;

        // Player Answers
        // p1: "Apple" (1pt), "Athens" (1pt) - Unique?
        // p2: "Apricot" (1pt), "Athens" (1pt) - Duplicate on 2nd category
        room.PlayerAnswers["p1"] = new List<string> { "Apple", "Athens" };
        room.PlayerAnswers["p2"] = new List<string> { "Apricot", "Athens" };

        // Act
        await _sut.CalculateScores(room);

        // Assert - Unique answers only?
        // Logic check: Groups by answer. If group.Count == 1, add score.
        // Cat 1: Apple(unique), Apricot(unique). Both get points.
        // Cat 2: Athens(duplicate). Neither gets points.

        room.RoundScores["p1"].Should().Be(1); // Apple (1)
        room.RoundScores["p2"].Should().Be(1); // Apricot (1)

        // Wait, CalculateScores sets Phase = Result. Room State set in EndRound.
        state.Phase.Should().Be(ScatterbrainPhase.Result);
    }
    
    [Fact]
    public async Task CalculateScores_ShouldHandleAlliterationBonus()
    {
        // Arrange
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        var state = new ScatterbrainState { CurrentLetter = 'M', Categories = new List<string> { "Famous People" } };
        room.GameData = state;
        
        room.PlayerAnswers["p1"] = new List<string> { "Marilyn Monroe" }; // 2 pts

        // Act
        await _sut.CalculateScores(room);

        // Assert
        room.RoundScores["p1"].Should().Be(2);
    }
}
