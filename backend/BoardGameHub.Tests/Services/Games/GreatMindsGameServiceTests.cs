using Xunit;
using Moq;
using Microsoft.AspNetCore.SignalR;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services.Games.GreatMinds;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using FluentAssertions;
using Microsoft.Extensions.Logging;

namespace BoardGameHub.Tests.Services.Games;

public class GreatMindsGameServiceTests
{
    private readonly GreatMindsGameService _service;
    private readonly Mock<IHubContext<GameHub>> _mockHub;
    private readonly Mock<IHubClients> _mockClients;
    private readonly Mock<IClientProxy> _mockGroupProxy;
    private readonly Mock<ISingleClientProxy> _mockSingleProxy;

    public GreatMindsGameServiceTests()
    {
        _mockHub = new Mock<IHubContext<GameHub>>();
        _mockClients = new Mock<IHubClients>();
        _mockGroupProxy = new Mock<IClientProxy>();
        _mockSingleProxy = new Mock<ISingleClientProxy>();

        _mockHub.Setup(h => h.Clients).Returns(_mockClients.Object);
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockGroupProxy.Object);
        _mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(_mockSingleProxy.Object);

        _service = new GreatMindsGameService(_mockHub.Object, new Mock<ILogger<GreatMindsGameService>>().Object);
    }

    private Room CreateMockRoom(int playerCount)
    {
        var room = new Room { Code = "TEST", RoundNumber = 1 };
        for (int i = 0; i < playerCount; i++)
        {
            room.Players.Add(new Player { ConnectionId = $"p{i}", Name = $"Player {i}" });
        }
        return room;
    }

    [Fact]
    public async Task StartRound_ShouldInitializeStateAndDealCards()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());

        var state = (GreatMindsGameState)room.GameData;
        state.Lives.Should().Be(3);
        state.SyncTokens.Should().Be(1);
        state.CurrentLevel.Should().Be(1);
        state.PlayerHands.Should().HaveCount(3);
        state.PlayerHands.Values.All(h => h.Count == 1).Should().BeTrue();
    }

    [Fact]
    public async Task SubmitCard_CorrectPlay_ShouldRemoveCardAndSetTopCard()
    {
        var room = CreateMockRoom(2);
        await _service.StartRound(room, new GameSettings());
        var state = (GreatMindsGameState)room.GameData;

        // Force hands for predictability
        state.PlayerHands["p0"] = new List<int> { 10 };
        state.PlayerHands["p1"] = new List<int> { 20 };

        var success = await _service.SubmitCard(room, "p0", 10);

        success.Should().BeTrue();
        state.PlayerHands["p0"].Should().BeEmpty();
        state.TopCard.Should().Be(10);
        state.IsLevelComplete.Should().BeFalse(); // p1 still has 20
    }

    [Fact]
    public async Task SubmitCard_IncorrectPlay_ShouldLoseLifeAndDiscardLower()
    {
        var room = CreateMockRoom(2);
        await _service.StartRound(room, new GameSettings());
        var state = (GreatMindsGameState)room.GameData;

        state.PlayerHands["p0"] = new List<int> { 50 };
        state.PlayerHands["p1"] = new List<int> { 10, 60 };
        state.Lives = 2;

        var success = await _service.SubmitCard(room, "p0", 50);

        success.Should().BeTrue();
        state.Lives.Should().Be(1);
        state.PlayerHands["p0"].Should().BeEmpty();
        state.PlayerHands["p1"].Should().BeEquivalentTo(new List<int> { 60 }); // 10 was discarded
        state.TopCard.Should().Be(50);
    }

    [Fact]
    public async Task SubmitSync_ShouldDiscardLowestAndToken()
    {
        var room = CreateMockRoom(2);
        await _service.StartRound(room, new GameSettings());
        var state = (GreatMindsGameState)room.GameData;

        state.PlayerHands["p0"] = new List<int> { 10, 30 };
        state.PlayerHands["p1"] = new List<int> { 20, 40 };
        state.SyncTokens = 1;

        var success = await _service.SubmitSync(room, "p0");

        success.Should().BeTrue();
        state.SyncTokens.Should().Be(0);
        state.PlayerHands["p0"].Should().BeEquivalentTo(new List<int> { 30 });
        state.PlayerHands["p1"].Should().BeEquivalentTo(new List<int> { 40 });
    }

    [Fact]
    public async Task LevelUp_ShouldAwardRewards_AtLevelThree()
    {
        var room = CreateMockRoom(2);
        await _service.StartRound(room, new GameSettings());
        var state = (GreatMindsGameState)room.GameData;
        
        state.CurrentLevel = 3;
        state.Lives = 1;
        state.SyncTokens = 0;
        state.PlayerHands["p0"] = new List<int> { 99 };
        state.PlayerHands["p1"] = new List<int> { };

        // Play the last card to trigger next level
        await _service.SubmitCard(room, "p0", 99);

        state.CurrentLevel.Should().Be(4);
        state.Lives.Should().Be(2); // +1 reward
        state.SyncTokens.Should().Be(1); // +1 reward
        state.PlayerHands["p0"].Should().HaveCount(4); // L4 deals 4 cards
    }
}
