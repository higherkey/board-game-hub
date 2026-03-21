using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;

namespace BoardGameHub.Tests.Services.Games;

public class ScatterbrainGameServiceTests
{
    private readonly ScatterbrainGameService _sut;

    public ScatterbrainGameServiceTests()
    {
        _sut = new ScatterbrainGameService(new Mock<ILogger<ScatterbrainGameService>>().Object);
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

    [Fact]
    public async Task CalculateScores_ShouldIgnoreVetoedAnswers()
    {
        // Arrange
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        var state = new ScatterbrainState 
        { 
            CurrentLetter = 'B', 
            Categories = new List<string> { "Animal" },
            Vetoes = new Dictionary<string, List<int>> { { "p1", new List<int> { 0 } } }
        };
        room.GameData = state;
        room.PlayerAnswers["p1"] = new List<string> { "Bear" }; // Valid, but vetoed

        // Act
        await _sut.CalculateScores(room);

        // Assert
        room.RoundScores["p1"].Should().Be(0);
    }

    [Fact]
    public async Task CalculateScores_ShouldTreatCaseInsensitiveAsDuplicates()
    {
        // Arrange
        var room = new Room { Players = new List<Player> 
        { 
            new Player { ConnectionId = "p1" },
            new Player { ConnectionId = "p2" }
        } };
        var state = new ScatterbrainState 
        { 
            CurrentLetter = 'C', 
            Categories = new List<string> { "Vehicle" },
        };
        room.GameData = state;
        room.PlayerAnswers["p1"] = new List<string> { "Car" };
        room.PlayerAnswers["p2"] = new List<string> { "car" };

        // Act
        await _sut.CalculateScores(room);

        // Assert
        room.RoundScores["p1"].Should().Be(0);
        room.RoundScores["p2"].Should().Be(0);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished_AndCalculateScores()
    {
        // Arrange
        var room = new Room { 
            State = GameState.Playing,
            Players = new List<Player> { new Player { ConnectionId = "p1" } }
        };
        var state = new ScatterbrainState { CurrentLetter = 'Z', Categories = new List<string> { "Zoo Animal" } };
        room.GameData = state;
        room.PlayerAnswers["p1"] = new List<string> { "Zebra" };

        // Act
        await _sut.EndRound(room);

        // Assert
        room.State.Should().Be(GameState.Finished);
        room.RoundScores!["p1"].Should().Be(1);
    }

    [Fact]
    public async Task HandleAction_SubmitAnswer_ShouldWork()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        room.GameData = new ScatterbrainState();
        var payload = JsonSerializer.SerializeToElement(new List<string> { "Apple" });
        var action = new GameAction("SUBMIT_ANSWER", payload);

        var result = await _sut.HandleAction(room, action, "p1");

        result.Should().BeTrue();
        room.PlayerAnswers["p1"].Should().Contain("Apple");
    }

    [Fact]
    public async Task HandleAction_NextPhase_ShouldWork()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        var state = new ScatterbrainState { Phase = ScatterbrainPhase.Writing };
        room.GameData = state;
        var action = new GameAction("NEXT_PHASE", null);

        var result = await _sut.HandleAction(room, action, "any");

        result.Should().BeTrue();
        state.Phase.Should().Be(ScatterbrainPhase.Validation);
    }

    [Fact]
    public async Task HandleAction_ToggleVeto_ShouldWork()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        var state = new ScatterbrainState();
        room.GameData = state;
        var payload = JsonSerializer.SerializeToElement(new { TargetPlayerId = "p1", CategoryIndex = 0 });
        var action = new GameAction("TOGGLE_VETO", payload);

        var result = await _sut.HandleAction(room, action, "any");

        result.Should().BeTrue();
        state.Vetoes["p1"].Should().Contain(0);
    }
}
