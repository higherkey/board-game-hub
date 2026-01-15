using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class SushiTrainGameServiceTests
{
    private readonly SushiTrainGameService _sut;

    public SushiTrainGameServiceTests()
    {
        _sut = new SushiTrainGameService(new Mock<ILogger<SushiTrainGameService>>().Object);
    }

    [Fact]
    public async Task StartRound_ShouldDealHandAndInitState()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" }
            }
        };
        var settings = new GameSettings();

        await _sut.StartRound(room, settings);

        var state = room.GameData as SushiTrainState;
        state.Should().NotBeNull();
        state!.Deck.Should().NotBeEmpty();
        state.PlayerStates.Should().HaveCount(2);
        state.PlayerStates["p1"].Hand.Should().HaveCount(10); // 2 players -> 10 cards
        state.PlayerStates["p2"].Hand.Should().HaveCount(10);
    }

    [Fact]
    public void SubmitSelection_ShouldMoveCardToTableau_WhenTurnProcess()
    {
        // Arrange
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "p1" } }
        };
        var state = new SushiTrainState();
        var c1 = new SushiCard { Id = "c1", Type = SushiType.Tempura };
        var c2 = new SushiCard { Id = "c2", Type = SushiType.Dumpling }; // Extra card so round doesn't end
        
        state.PlayerStates["p1"] = new SushiPlayerState { PlayerId = "p1", Hand = new List<SushiCard> { c1, c2 } };
        room.GameData = state;

        // Act
        bool result = _sut.SubmitSelection(room, "p1", "c1");

        // Assert
        result.Should().BeTrue();
        state.PlayerStates["p1"].Tableau.Should().Contain(c => c.Id == "c1");
        state.PlayerStates["p1"].Hand.Should().Contain(c => c.Id == "c2"); // Remaining
        state.PlayerStates["p1"].Hand.Should().NotContain(c => c.Id == "c1");
    }
    
    // ... [Chopsticks test remains valid if we have >1 card or strictly checking assignment] ...

    [Fact]
    public async Task CalculateScores_ShouldScoreStandardItems()
    {
        // Arrange
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        var state = new SushiTrainState { Deck = new List<SushiCard>() }; // Init Deck
        var pState = new SushiPlayerState { PlayerId = "p1" };
        var cLast = new SushiCard { Id = "last", Type = SushiType.Dumpling };
        
        pState.Hand.Add(cLast); 
        
        // Add items that WILL be scored (Tempura x2, Sashimi x3, Dumpling x2, Wasabi+Salmon)
        // Note: Logic scores Tableau. So we pre-populate Tableau.
        // But EndRound clears it.
        // So we populate Tableau, AND have 1 card in hand to submit.
        
        pState.Tableau.Add(new SushiCard { Type = SushiType.Tempura });
        pState.Tableau.Add(new SushiCard { Type = SushiType.Tempura }); // 5

        pState.Tableau.Add(new SushiCard { Type = SushiType.Sashimi });
        pState.Tableau.Add(new SushiCard { Type = SushiType.Sashimi });
        pState.Tableau.Add(new SushiCard { Type = SushiType.Sashimi }); // 10

        pState.Tableau.Add(new SushiCard { Type = SushiType.Dumpling });
        
        pState.Tableau.Add(new SushiCard { Type = SushiType.Wasabi });
        pState.Tableau.Add(new SushiCard { Type = SushiType.NigiriSalmon }); // 6
        
        // The card we submit (Dumpling) will be added to Tableau before scoring.
        // So 2 Dumplings total. (1 pt)
        // Total: 5 + 10 + 6 + 1 = 22.

        state.PlayerStates["p1"] = pState;
        room.GameData = state;

        // Act - Submit the last card to trigger EndRound
        _sut.SubmitSelection(room, "p1", "last");
        
        // Sync Scores to Room
        await _sut.CalculateScores(room);

        // Assert
        // Scores are synced to Room
        // 5 (Tempura) + 10 (Sashimi) + 6 (Wasabi+Salmon) + 3 (2 Dumplings) = 24
        room.RoundScores["p1"].Should().Be(24);
        // PlayerState total
        state.PlayerStates["p1"].TotalScore.Should().Be(24);
    }

    [Fact]
    public async Task CalculateScores_ShouldScoreMakiMajorities()
    {
        // Arrange
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" },
                new Player { ConnectionId = "p3" }
            }
        };
        var state = new SushiTrainState { Deck = new List<SushiCard>() };
        
        // P1: 2 Maki2 + Last Card (NigiriEgg 1pt) -> Total 5 icons? 
        // Let's keep it simple.
        var c1 = new SushiCard { Id = "c1", Type = SushiType.NigiriEgg };
        var c2 = new SushiCard { Id = "c2", Type = SushiType.NigiriEgg };
        var c3 = new SushiCard { Id = "c3", Type = SushiType.NigiriEgg };

        state.PlayerStates["p1"] = new SushiPlayerState { Tableau = { new SushiCard { Type = SushiType.Maki2 } }, Hand = { c1 }, PlayerId = "p1" };
        state.PlayerStates["p2"] = new SushiPlayerState { Tableau = { new SushiCard { Type = SushiType.Maki1 } }, Hand = { c2 }, PlayerId = "p2" };
        state.PlayerStates["p3"] = new SushiPlayerState { Hand = { c3 }, PlayerId = "p3" };

        room.GameData = state;

        // Act
        _sut.SubmitSelection(room, "p1", "c1");
        _sut.SubmitSelection(room, "p2", "c2");
        _sut.SubmitSelection(room, "p3", "c3");

        await _sut.CalculateScores(room);

        // Assert
        // P1: Maki2 (2). P2: Maki1 (1). P3: 0.
        // P1 First (6) + Egg (1) = 7.
        // P2 Second (3) + Egg (1) = 4.
        // P3 (0) + Egg (1) = 1.
        room.RoundScores["p1"].Should().Be(7);
        room.RoundScores["p2"].Should().Be(4);
        room.RoundScores["p3"].Should().Be(1);
    }
}
