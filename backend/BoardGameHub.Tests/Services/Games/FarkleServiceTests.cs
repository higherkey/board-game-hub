using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services.Games;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class FarkleServiceTests
{
    private readonly Mock<ILogger<FarkleService>> _loggerMock;
    private readonly Mock<IServiceProvider> _serviceProviderMock;
    private readonly FarkleService _service;

    public FarkleServiceTests()
    {
        _loggerMock = new Mock<ILogger<FarkleService>>();
        _serviceProviderMock = new Mock<IServiceProvider>();
        _service = new FarkleService(_loggerMock.Object, _serviceProviderMock.Object);
    }

    [Theory]
    [InlineData(new int[] { 1, 1, 1, 2, 3, 4 }, 1000)] // Three 1s
    [InlineData(new int[] { 5, 5, 5, 2, 3, 4 }, 500)]  // Three 5s
    [InlineData(new int[] { 2, 2, 2, 3, 4, 6 }, 200)]  // Three 2s
    [InlineData(new int[] { 1, 5, 2, 3, 4, 2 }, 150)]  // A 1 and a 5 (no straight)
    [InlineData(new int[] { 2, 3, 4, 6, 2, 3 }, 0)]    // No score
    [InlineData(new int[] { 1, 2, 3, 4, 5, 6 }, 1500)] // Straight
    [InlineData(new int[] { 2, 2, 3, 3, 4, 4 }, 1500)] // Three pairs
    [InlineData(new int[] { 1, 1, 1, 1, 2, 3 }, 2000)] // Four 1s
    [InlineData(new int[] { 5, 5, 5, 5, 5, 2 }, 2000)] // Five 5s
    public void CalculateDiceScore_ReturnsCorrectScore(int[] dice, int expectedScore)
    {
        var result = FarkleService.CalculateDiceScore(dice.ToList());
        result.Should().Be(expectedScore);
    }

    [Fact]
    public async Task StartRound_InitializesStateCorrectly()
    {
        // Arrange
        var room = new Room { Code = "TEST" };
        room.Players.Add(new Player { ConnectionId = "p1", Name = "Player 1", IsScreen = false });
        room.Players.Add(new Player { ConnectionId = "screen", IsScreen = true });

        // Act
        await _service.StartRound(room, new GameSettings());

        // Assert
        room.GameData.Should().BeOfType<FarkleState>();
        var state = (FarkleState)room.GameData!;
        state.PlayerStates.Should().HaveCount(1);
        state.PlayerStates.Should().ContainKey("p1");
        state.ActivePlayerId.Should().Be("p1");
        state.Dice.Should().HaveCount(6);
        state.Phase.Should().BeOneOf(FarklePhase.Picking, FarklePhase.Farkled);
    }

    [Fact]
    public async Task HandleAction_ToggleDie_Works()
    {
        // Arrange
        var room = new Room();
        var state = new FarkleState { Phase = FarklePhase.Picking, ActivePlayerId = "p1" };
        state.Dice = Enumerable.Range(0, 6).Select(_ => new FarkleDie { Value = 1 }).ToList();
        room.GameData = state;

        var payload = JsonDocument.Parse("{\"index\": 2}").RootElement;
        var action = new GameAction("TOGGLE_DIE", payload);

        // Act
        var result = await _service.HandleAction(room, action, "p1");

        // Assert
        result.Should().BeTrue();
        state.Dice[2].IsReserved.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAction_Bank_Works()
    {
        // Arrange
        var room = new Room();
        var state = new FarkleState { Phase = FarklePhase.Picking, ActivePlayerId = "p1" };
        state.PlayerStates["p1"] = new FarklePlayerState { PlayerId = "p1", TotalScore = 0 };
        state.PlayerStates["p2"] = new FarklePlayerState { PlayerId = "p2", TotalScore = 0 };
        state.Dice = new List<FarkleDie> 
        { 
            new FarkleDie { Value = 1, IsReserved = true }, 
            new FarkleDie { Value = 2 }, 
            new FarkleDie { Value = 3 }, 
            new FarkleDie { Value = 4 }, 
            new FarkleDie { Value = 5 }, 
            new FarkleDie { Value = 6 } 
        };
        room.GameData = state;
        var action = new GameAction("BANK", null);

        // Act
        var result = await _service.HandleAction(room, action, "p1");

        // Assert
        result.Should().BeTrue();
        state.PlayerStates["p1"].TotalScore.Should().Be(100);
        state.ActivePlayerId.Should().NotBe("p1"); // Should have advanced
    }

    [Fact]
    public async Task HandleAction_Roll_RequiresScoringDie()
    {
        // Arrange
        var room = new Room();
        var state = new FarkleState { Phase = FarklePhase.Picking, ActivePlayerId = "p1" };
        // Dice: all 2s (non-scoring if only one is picked)
        state.Dice = Enumerable.Range(0, 6).Select(_ => new FarkleDie { Value = 2 }).ToList();
        room.GameData = state;
        var action = new GameAction("ROLL", null);

        // Act 1: Try to roll with nothing picked
        var result1 = await _service.HandleAction(room, action, "p1");

        // Act 2: Try to roll with a non-scoring die picked
        state.Dice[0].IsReserved = true;
        var result2 = await _service.HandleAction(room, action, "p1");

        // Assert
        result1.Should().BeFalse("Should not be able to roll without picking a scoring die");
        result2.Should().BeFalse("Should not be able to roll with only a non-scoring die picked");
    }

    [Fact]
    public async Task HandleAction_Roll_HandlesHotDice()
    {
        // Arrange
        var room = new Room();
        var state = new FarkleState { Phase = FarklePhase.Picking, ActivePlayerId = "p1" };
        // All 1s, 5 already held, 1 reserved.
        state.Dice = new List<FarkleDie>
        {
            new FarkleDie { Value = 1, IsHeld = true },
            new FarkleDie { Value = 1, IsHeld = true },
            new FarkleDie { Value = 1, IsHeld = true },
            new FarkleDie { Value = 1, IsHeld = true },
            new FarkleDie { Value = 1, IsHeld = true },
            new FarkleDie { Value = 1, IsReserved = true }
        };
        room.GameData = state;
        var action = new GameAction("ROLL", null);

        // Act
        var result = await _service.HandleAction(room, action, "p1");

        // Assert
        result.Should().BeTrue();
        state.Dice.All(d => !d.IsHeld).Should().BeTrue("All dice should be reset (Hot Dice)");
        state.Phase.Should().BeOneOf(FarklePhase.Rolling, FarklePhase.Picking, FarklePhase.Farkled);
    }

    [Fact]
    public async Task HandleAction_Roll_RejectsNonScoringSelection()
    {
        // Arrange
        var room = new Room();
        var state = new FarkleState { Phase = FarklePhase.Picking, ActivePlayerId = "p1" };
        // Dice: [1, 2, 2, 2, 3, 4]
        // Selection: [1, 2] -> 100 points, but 2 is non-scoring.
        state.Dice = new List<FarkleDie>
        {
            new FarkleDie { Value = 1 },
            new FarkleDie { Value = 2 },
            new FarkleDie { Value = 2 },
            new FarkleDie { Value = 2 },
            new FarkleDie { Value = 3 },
            new FarkleDie { Value = 4 }
        };
        room.GameData = state;
        var action = new GameAction("ROLL", null);

        // Act
        state.Dice[0].IsReserved = true; // The 1
        state.Dice[1].IsReserved = true; // The 2
        var result = await _service.HandleAction(room, action, "p1");

        // Assert
        result.Should().BeFalse("Should not be able to roll if the selection contains non-scoring dice");
    }
}
