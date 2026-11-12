using System.Text.Json;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace BoardGameHub.Tests.Integration;

public class YachtRoomIntegrationTests
{
    [Fact]
    public async Task LobbyToFullMatchThenBackToSelection()
    {
        var clients = new Mock<IHubClients>();
        var proxy = new Mock<IClientProxy>();
        clients.Setup(c => c.All).Returns(proxy.Object);
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(proxy.Object);
        var gameHub = new Mock<IHubContext<GameHub>>();
        gameHub.Setup(h => h.Clients).Returns(clients.Object);
        var adminHub = new Mock<IHubContext<AdminHub>>();
        adminHub.Setup(h => h.Clients).Returns(clients.Object);
        using var manager = new GameStateManager(gameHub.Object, new StateDiffService(), NullLogger<GameStateManager>.Instance);
        var service = new RoomService(new[] { new YachtGameService() }, adminHub.Object, gameHub.Object,
            manager, NullLogger<RoomService>.Instance);

        var room = service.CreateRoom("screen", "Table", false, GameType.Yacht, isScreen: true);
        service.JoinRoom(room.Code, "p1", "Player 1");
        service.JoinRoom(room.Code, "p2", "Player 2");
        room.IsHostOverride = true;
        Assert.NotNull(await service.StartGame(room.Code, new GameSettings()));
        Assert.Null(room.RoundEndTime); // Untimed games must not get an immediately expired timer.
        Assert.Equal(1, room.Settings.TotalRounds);
        Assert.Equal(1, room.RoundNumber);

        foreach (var category in YachtGameService.Categories)
        {
            for (var player = 1; player <= 2; player++)
            {
                var id = $"p{player}";
                Assert.NotNull(await service.SubmitAction(room.Code, id, "ROLL", JsonSerializer.SerializeToElement(new { })));
                Assert.NotNull(await service.SubmitAction(room.Code, id, "SCORE", JsonSerializer.SerializeToElement(new { category })));
            }
        }
        Assert.Equal(GameState.Finished, room.State);
        Assert.All(((YachtState)room.GameData!).Scorecards.Values, card => Assert.Equal(13, card.Categories.Count));
        Assert.NotNull(await service.EndGame(room.Code));
        Assert.Equal(GameState.Lobby, room.State);
        Assert.Null(room.GameData);
        Assert.Equal(0, room.RoundNumber);
    }
}
