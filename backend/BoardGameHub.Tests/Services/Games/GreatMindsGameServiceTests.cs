using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services.Games.GreatMinds;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Games.GreatMinds;

public class GreatMindsGameServiceTests
{
    private readonly Mock<IHubContext<GameHub>> _mockHubContext;
    private readonly Mock<IHubClients> _mockClients;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly Mock<ISingleClientProxy> _mockSingleClientProxy;
    private readonly GreatMindsGameService _service;

    public GreatMindsGameServiceTests()
    {
        _mockHubContext = new Mock<IHubContext<GameHub>>();
        _mockClients = new Mock<IHubClients>();
        _mockClientProxy = new Mock<IClientProxy>();
        _mockSingleClientProxy = new Mock<ISingleClientProxy>();

        _mockHubContext.Setup(h => h.Clients).Returns(_mockClients.Object);
        _mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);
        _mockClients.Setup(c => c.Client(It.IsAny<string>())).Returns(_mockSingleClientProxy.Object);

        _service = new GreatMindsGameService(_mockHubContext.Object, new Mock<ILogger<GreatMindsGameService>>().Object);
    }

    [Fact]
    public async Task StartRound_ShouldInitializeState_AndDealCards()
    {
        var room = new Room { Code = "TEST", Players = new List<Player> { new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" } } };
        
        await _service.StartRound(room, new GameSettings());

        var state = room.GameData as GreatMindsGameState;
        Assert.NotNull(state);
        Assert.Equal(1, state.CurrentLevel);
        Assert.Equal(2, state.Lives);
        Assert.Equal(1, state.PlayerHands["p1"].Count);
        Assert.Equal(1, state.PlayerHands["p2"].Count);
    }

    [Fact]
    public async Task SubmitCard_ShouldUpdateState_AndBroadcastEvent()
    {
        var room = new Room { Code = "TEST", Players = new List<Player> { new Player { ConnectionId = "p1" } } };
        await _service.StartRound(room, new GameSettings());
        var state = room.GameData as GreatMindsGameState;
        var card = state!.PlayerHands["p1"][0];

        // Act
        var result = await _service.SubmitCard(room, "p1", card);

        // Assert
        Assert.True(result);
        
        // Hand emptied -> NextLevel triggered -> Level 2 dealt (2 cards)
        Assert.Equal(2, state.CurrentLevel);
        Assert.Equal(2, state.PlayerHands["p1"].Count);
        
        // Verify Event Broadcast (Sound Effect)
        _mockClientProxy.Verify(c => c.SendCoreAsync("GameEvent", It.Is<object[]>(o => o[0].ToString() == "CARD_PLAYED"), default), Times.Once);
    }
}
