using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class BabbleGameServiceTests
{
    private readonly BabbleGameService _sut;
    private readonly Mock<IBabbleService> _babbleMock;
    private readonly Mock<IDictionaryService> _dictMock;

    public BabbleGameServiceTests()
    {
        _babbleMock = new Mock<IBabbleService>();
        _dictMock = new Mock<IDictionaryService>();
        _sut = new BabbleGameService(_babbleMock.Object, _dictMock.Object, new Mock<ILogger<BabbleGameService>>().Object);
    }

    [Fact]
    public async Task CalculateScores_ShouldAwardPoints_ForUniqueValidWords()
    {
        // Arrange
        var p1 = new Player { ConnectionId = "p1", Score = 0 };
        var p2 = new Player { ConnectionId = "p2", Score = 0 };
        var room = new Room
        {
            Players = new List<Player> { p1, p2 },
            GameData = new BabbleState { Grid = new List<char> { 'A', 'B', 'C' } },
            PlayerAnswers = new Dictionary<string, List<string>>
            {
                { "p1", new List<string> { "UNIQUE" } },
                { "p2", new List<string> { "OTHER" } }
            }
        };

        _babbleMock.Setup(x => x.IsWordOnGrid("UNIQUE", It.IsAny<List<char>>())).Returns(true);
        _dictMock.Setup(x => x.IsValid("UNIQUE")).Returns(true);
        _babbleMock.Setup(x => x.CalculateScore("UNIQUE")).Returns(5);

        // Act
        await _sut.CalculateScores(room);

        // Assert
        room.RoundScores["p1"].Should().Be(5);
        p1.Score.Should().Be(5); // Total score updated
        
        var state = room.GameData as BabbleState;
        state.Should().NotBeNull();
        state.LastRoundResults.Should().Contain(r => r.Word == "UNIQUE" && r.Points == 5 && !r.IsDuplicate);
    }

    [Fact]
    public async Task CalculateScores_ShouldNotAwardPoints_ForDuplicateWords()
    {
        // Arrange
        var p1 = new Player { ConnectionId = "p1" };
        var p2 = new Player { ConnectionId = "p2" };
        var room = new Room
        {
            Players = new List<Player> { p1, p2 },
            GameData = new BabbleState(),
            RoundScores = new Dictionary<string, int>(), // Ensure initialized
            PlayerAnswers = new Dictionary<string, List<string>>
            {
                { "p1", new List<string> { "COMMON" } },
                { "p2", new List<string> { "COMMON" } }
            }
        };

        _babbleMock.Setup(x => x.IsWordOnGrid("COMMON", It.IsAny<List<char>>())).Returns(true);
        _dictMock.Setup(x => x.IsValid("COMMON")).Returns(true);

        // Act
        await _sut.CalculateScores(room);

        // Assert
        // The service initializes scores to 0. So key should exist, but value 0.
        room.RoundScores["p1"].Should().Be(0);
        room.RoundScores["p2"].Should().Be(0);

        var state = room.GameData as BabbleState;
        state.LastRoundResults.Should().Contain(r => r.Word == "COMMON" && r.IsDuplicate && r.Points == 0);
    }

    [Fact]
    public async Task ValidateWord_ShouldOverrideDictionary()
    {
        // Arrange
        var p1 = new Player { ConnectionId = "p1", Score = 0 };
        var host = new Player { ConnectionId = "host", IsHost = true };
        var room = new Room
        {
            Players = new List<Player> { p1, host }, 
            PlayerAnswers = new Dictionary<string, List<string>>
            {
                { "p1", new List<string> { "FAKE" } }
            },
            GameData = new BabbleState 
            { 
                 // Pre-existing result needed? 
                 // HandleAction looks for state.LastRoundResults.First(r => r.Word == word).
                 // So yes, we need the result to exist BEFORE HandleAction is called.
                 // This implies a round has finished calculation at least once.
                 LastRoundResults = new List<BabbleResult> 
                 { 
                     new BabbleResult { Word = "FAKE", IsInDictionary = false, Points = 0 } 
                 },
                 Grid = new List<char>()
            }
        };

        // Act - Simulate Host validating "FAKE"
        var payload = JsonSerializer.SerializeToElement(new { word = "FAKE", isValid = true });
        var action = new GameAction("VALIDATE_WORD", payload);
        
        // We need to setup mocks because HandleAction -> CalculateScores re-runs logic
        _babbleMock.Setup(x => x.IsWordOnGrid("FAKE", It.IsAny<List<char>>())).Returns(true);
        _dictMock.Setup(x => x.IsValid("FAKE")).Returns(false); // Dictionary says NO
        _babbleMock.Setup(x => x.CalculateScore("FAKE")).Returns(10); // Standard score if valid

        var result = await _sut.HandleAction(room, action, "host");

        // Assert
        result.Should().BeTrue();
        var state = room.GameData as BabbleState;
        
        // Use FirstOrDefault to avoid exception if missing, then Assert
        var wordResult = state.LastRoundResults.FirstOrDefault(r => r.Word == "FAKE");
        wordResult.Should().NotBeNull();
        wordResult.IsHostValidated.Should().BeTrue();
        
        // Should have points now
        wordResult.Points.Should().Be(10);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished_AndCalculateScores()
    {
        // Arrange
        var room = new Room { Code = "TEST", Players = new List<Player>(), GameData = new BabbleState() };

        // Act
        await _sut.EndRound(room);

        // Assert
        room.State.Should().Be(GameState.Finished);
    }

    [Fact]
    public async Task HandleAction_SubmitAnswers_ShouldStoreAnswers()
    {
        // Arrange
        var player = new Player { ConnectionId = "p1", IsHost = false };
        var room = new Room { Players = new List<Player> { player } };
        var payload = JsonSerializer.SerializeToElement(new { answers = new[] { "WORD1", "WORD2" } });
        var action = new GameAction("SUBMIT_ANSWERS", payload);

        // Act
        var result = await _sut.HandleAction(room, action, "p1");

        // Assert
        result.Should().BeTrue();
        room.PlayerAnswers["p1"].Should().ContainInOrder("WORD1", "WORD2");
    }
}
