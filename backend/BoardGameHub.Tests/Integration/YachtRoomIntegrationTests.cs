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
    private static (RoomService, GameStateManager) CreateServices()
    {
        var clients = new Mock<IHubClients>();
        var proxy = new Mock<IClientProxy>();
        clients.Setup(c => c.All).Returns(proxy.Object);
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(proxy.Object);
        var gameHub = new Mock<IHubContext<GameHub>>();
        gameHub.Setup(h => h.Clients).Returns(clients.Object);
        var adminHub = new Mock<IHubContext<AdminHub>>();
        adminHub.Setup(h => h.Clients).Returns(clients.Object);
        var manager = new GameStateManager(gameHub.Object, new StateDiffService(), NullLogger<GameStateManager>.Instance);
        return (new RoomService(new[] { new YachtGameService() }, adminHub.Object, gameHub.Object,
            manager, NullLogger<RoomService>.Instance), manager);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(9)]
    public async Task InvalidPlayerCountDoesNotMutateLobby(int count)
    {
        var (service, manager) = CreateServices();
        using var managerScope = manager;
        using var serviceScope = service;
        var room = service.CreateRoom("screen", "Table", false, GameType.Yacht, isScreen: true);
        for (var i = 0; i < count; i++) service.JoinRoom(room.Code, $"p{i}", $"Player {i}");
        room.IsHostOverride = true;
        room.Players[0].Score = 99;
        var settings = room.Settings;
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.StartGame(room.Code, new GameSettings()));
        Assert.Equal(GameState.Lobby, room.State);
        Assert.Equal(0, room.RoundNumber);
        Assert.Null(room.GameData);
        Assert.Equal(99, room.Players[0].Score);
        Assert.Same(settings, room.Settings);
    }

    [Fact]
    public async Task UndoAcrossReconnectPreservesSeatAndRestoresScores()
    {
        var (service, manager) = CreateServices();
        using var managerScope = manager;
        using var serviceScope = service;
        var room = service.CreateRoom("host", "Host", false, GameType.Yacht);
        room.IsHostOverride = true;
        await service.StartGame(room.Code, new GameSettings());
        await service.SubmitAction(room.Code, "host", "ROLL", JsonSerializer.SerializeToElement(new { }));
        var state = (YachtState)room.GameData!;
        state.Dice = new[] { 1, 2, 3, 4, 5 };
        await service.SubmitAction(room.Code, "host", "SCORE", JsonSerializer.SerializeToElement(new { category = "Chance" }));
        Assert.Equal(15, room.Players[0].Score);
        var session = room.Players[0].SessionId;
        service.JoinRoom(room.Code, "new-host", "Host", sessionId: session);
        Assert.NotNull(await service.RequestUndo(room.Code, "new-host"));
        Assert.Equal(0, room.Players[0].Score);
        var restored = (YachtState)room.GameData!;
        Assert.Equal("new-host", restored.ActivePlayerId);
        Assert.False(restored.Scorecards.ContainsKey("host"));
        Assert.DoesNotContain("host", restored.PlayerOrder);
        Assert.NotNull(await service.SubmitAction(room.Code, "new-host", "ROLL", JsonSerializer.SerializeToElement(new { })));
        Assert.NotNull(await service.RequestUndo(room.Code, "new-host"));
        Assert.NotNull(await service.RequestUndo(room.Code, "new-host"));
        Assert.NotNull(await service.SubmitAction(room.Code, "new-host", "ROLL", JsonSerializer.SerializeToElement(new { })));
    }

}
