using System.Text.Json.Nodes;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class RoomServiceFullDiffTests
{
    private class TimerGameService : IGameService
    {
        public GameType GameType => GameType.Scatterbrain;
        public Task StartRound(Room room, GameSettings settings) => Task.CompletedTask;
        public Task CalculateScores(Room room) => Task.CompletedTask;
        public Task EndRound(Room room) => Task.CompletedTask;
        public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
        {
            room.RoundEndTime = new DateTime(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            room.RoundNumber = 7;
            return Task.FromResult(true);
        }
        public object DeserializeState(System.Text.Json.JsonElement json) => new object();
        public void RebindPlayer(Room room, string oldConnectionId, string newConnectionId) { }
    }

    private static (RoomService Sut, GameStateManager Manager, Mock<IClientProxy> Proxy) Create(IGameService? game = null)
    {
        var proxy = new Mock<IClientProxy>();
        var clients = new Mock<IHubClients>();
        clients.Setup(c => c.All).Returns(proxy.Object);
        clients.Setup(c => c.Group(It.IsAny<string>())).Returns(proxy.Object);
        var gameHub = new Mock<IHubContext<GameHub>>();
        gameHub.Setup(h => h.Clients).Returns(clients.Object);
        var adminHub = new Mock<IHubContext<AdminHub>>();
        adminHub.Setup(h => h.Clients).Returns(clients.Object);
        var manager = new GameStateManager(gameHub.Object, new StateDiffService(), new Mock<ILogger<GameStateManager>>().Object);
        var sut = new RoomService(new List<IGameService> { game ?? new TimerGameService() }, adminHub.Object, gameHub.Object, manager, new Mock<ILogger<RoomService>>().Object);
        return (sut, manager, proxy);
    }

    [Fact]
    public async Task SubmitAction_BroadcastsRoundEndTimeAndRoundNumberChangedByHandleAction()
    {
        var (sut, manager, proxy) = Create();
        var room = sut.CreateRoom("host", "Host", false, GameType.Scatterbrain);
        await manager.ProcessRoomUpdateAsync(room.Code); // baseline
        proxy.Invocations.Clear();

        await sut.SubmitAction(room.Code, "host", "ANY", null);
        await manager.ProcessRoomUpdateAsync(room.Code);

        var patch = proxy.Invocations
            .Where(i => i.Method.Name == "SendCoreAsync")
            .Select(i => ((object[])i.Arguments[1])[0])
            .OfType<JsonNode>()
            .Single();
        patch["roundEndTime"]!.GetValue<DateTime>().Should().Be(room.RoundEndTime);
        patch["roundNumber"]!.GetValue<int>().Should().Be(7);
    }

    private static JsonObject LastPatch(Mock<IClientProxy> proxy) => proxy.Invocations
        .Where(i => i.Method.Name == "SendCoreAsync" && (string)i.Arguments[0] == "RoomStatePatch")
        .Select(i => ((object[])i.Arguments[1])[0]).OfType<JsonObject>().Last();

    [Fact]
    public async Task Pictophone_PhaseTransitionBroadcastsResetTimerAndRevealClearsTimer()
    {
        var game = new PictophoneService(new Mock<ILogger<PictophoneService>>().Object);
        var (sut, manager, proxy) = Create(game);
        using (sut)
        using (manager)
        {
            var room = sut.CreateRoom("host", "Host", false, GameType.Pictophone);
            sut.JoinRoom(room.Code, "guest", "Guest");
            await game.StartRound(room, room.Settings);
            room.RoundEndTime = new DateTime(2030, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            await manager.ProcessRoomUpdateAsync(room.Code);
            proxy.Invocations.Clear();
            var payload = System.Text.Json.JsonSerializer.SerializeToElement(new { content = "a robot" });

            await sut.SubmitAction(room.Code, "host", "SUBMIT_PAGE", payload);
            await sut.SubmitAction(room.Code, "guest", "SUBMIT_PAGE", payload);
            await manager.ProcessRoomUpdateAsync(room.Code);

            ((PictophoneState)room.GameData!).Phase.Should().Be(PictophonePhase.Drawing);
            LastPatch(proxy)["roundEndTime"]!.GetValue<DateTime>().Should().Be(room.RoundEndTime);
            proxy.Invocations.Clear();
            await sut.SubmitAction(room.Code, "host", "SUBMIT_PAGE", payload);
            await sut.SubmitAction(room.Code, "guest", "SUBMIT_PAGE", payload);
            await manager.ProcessRoomUpdateAsync(room.Code);

            ((PictophoneState)room.GameData!).Phase.Should().Be(PictophonePhase.Reveal);
            LastPatch(proxy).ContainsKey("roundEndTime").Should().BeTrue();
            LastPatch(proxy)["roundEndTime"].Should().BeNull();
        }
    }

    [Fact]
    public async Task UniversalTranslator_PickingWordBroadcastsDayTimer()
    {
        var game = new UniversalTranslatorService(new Mock<ILogger<UniversalTranslatorService>>().Object);
        var (sut, manager, proxy) = Create(game);
        using (sut)
        using (manager)
        {
            var room = sut.CreateRoom("host", "Host", false, GameType.UniversalTranslator);
            sut.JoinRoom(room.Code, "guest", "Guest");
            await game.StartRound(room, room.Settings);
            await manager.ProcessRoomUpdateAsync(room.Code);
            proxy.Invocations.Clear();
            var state = (UniversalTranslatorState)room.GameData!;
            var computer = state.Roles.Single(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
            var payload = System.Text.Json.JsonSerializer.SerializeToElement(new { word = state.WordChoices[0] });

            (await sut.SubmitAction(room.Code, computer, "PICK_WORD", payload)).Should().NotBeNull();
            await manager.ProcessRoomUpdateAsync(room.Code);

            state.Phase.Should().Be(UniversalTranslatorPhase.Day);
            room.RoundEndTime.Should().NotBeNull();
            LastPatch(proxy)["roundEndTime"]!.GetValue<DateTime>().Should().Be(room.RoundEndTime);
        }
    }
}
