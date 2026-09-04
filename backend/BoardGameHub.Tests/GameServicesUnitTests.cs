using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace BoardGameHub.Tests;

public class GameServicesUnitTests
{
    private Room CreateTestRoom(GameType type, int playerCount = 3)
    {
        var room = new Room
        {
            Code = "TEST1",
            GameType = type,
            State = GameState.Playing,
            RoundNumber = 1
        };

        for (int i = 1; i <= playerCount; i++)
        {
            room.Players.Add(new Player
            {
                ConnectionId = $"conn_{i}",
                Name = $"Player {i}",
                IsConnected = true,
                Score = 0
            });
        }

        return room;
    }

    [Fact]
    public async Task BreakingNewsGameService_StartRound_HandleAction_EndRound_Flow()
    {
        var logger = new Mock<ILogger<BreakingNewsGameService>>();
        var service = new BreakingNewsGameService(logger.Object);
        var room = CreateTestRoom(GameType.BreakingNews, 3);
        var settings = new GameSettings();

        await service.StartRound(room, settings);
        room.GameData.Should().NotBeNull();
        var state = room.GameData as BreakingNewsState;
        state.Should().NotBeNull();
        state!.Slots.Should().NotBeEmpty();

        var writerSlot = state.SlotOwners.First();
        var writerConnId = writerSlot.Value;
        var slotId = writerSlot.Key;

        // Valid submission
        var actionPayload = JsonDocument.Parse($"{{\"slotId\": {slotId}, \"value\": \"Sunny\"}}").RootElement;
        var handled = await service.HandleAction(room, new GameAction("SUBMIT_SLOT", actionPayload), writerConnId);
        handled.Should().BeTrue();
        state.Slots[slotId].CurrentValue.Should().Be("Sunny");

        // Invalid submission (wrong owner or invalid slot)
        var invalidPayload = JsonDocument.Parse($"{{\"slotId\": 999, \"value\": \"Bad\"}}").RootElement;
        var invalidHandled = await service.HandleAction(room, new GameAction("SUBMIT_SLOT", invalidPayload), writerConnId);
        invalidHandled.Should().BeFalse();

        // End round
        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);
        room.RoundScores.Should().NotBeNull();

        // Rebind player
        service.RebindPlayer(room, writerConnId, "new_writer_conn");
        state.SlotOwners[slotId].Should().Be("new_writer_conn");
    }

    [Fact]
    public async Task PictophoneService_StartRound_HandleAction_CalculateScores_Flow()
    {
        var logger = new Mock<ILogger<PictophoneService>>();
        var service = new PictophoneService(logger.Object);
        var room = CreateTestRoom(GameType.Pictophone, 2);
        var settings = new GameSettings { TimerDurationSeconds = 60 };

        await service.StartRound(room, settings);
        var state = room.GameData as PictophoneState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(PictophonePhase.Prompting);
        state.Books.Should().HaveCount(2);

        // Submit page (prompt phase)
        var promptPayload = JsonDocument.Parse("{\"content\": \"Cat wearing a hat\"}").RootElement;
        var handledPrompt = await service.HandleAction(room, new GameAction("SUBMIT_PAGE", promptPayload), "conn_1");
        handledPrompt.Should().BeTrue();

        // Submit draft
        var draftPayload = JsonDocument.Parse("{\"content\": \"Draft text...\"}").RootElement;
        var handledDraft = await service.HandleAction(room, new GameAction("SUBMIT_DRAFT", draftPayload), "conn_1");
        handledDraft.Should().BeTrue();

        // Calculate scores
        await service.CalculateScores(room);
        room.RoundScores.Should().ContainKey("conn_1");

        // End round
        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "rebound_conn_1");
        state.Books.Any(b => b.OwnerId == "rebound_conn_1").Should().BeTrue();
    }

    [Fact]
    public async Task CloverMindedGameService_StartRound_HandleAction_Flow()
    {
        var logger = new Mock<ILogger<CloverMindedGameService>>();
        var service = new CloverMindedGameService(logger.Object);
        var room = CreateTestRoom(GameType.CloverMinded, 3);
        var settings = new GameSettings { CloverAllowPerPlayerSingleCardRotation = true, TimerDurationSeconds = 600 };

        await service.StartRound(room, settings);
        var state = room.GameData as CloverMindedState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(CloverMindedPhase.ClueWriting.ToString());

        // Player submits clues via CLOVER_SUBMIT_CLUES
        var cluePayload = JsonDocument.Parse("{\"clues\": [\"Animals\", \"Colors\", \"Food\", \"Travel\"]}").RootElement;
        var handledClue = await service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", cluePayload), "conn_1");
        handledClue.Should().BeTrue();

        // Calculate scores & End round
        await service.CalculateScores(room);
        await service.EndRound(room);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_clover_conn");
        state.ParticipantIds.Should().Contain("new_clover_conn");
    }

    [Fact]
    public async Task BabbleGameService_StartRound_CalculateScores_Flow()
    {
        var babbleMock = new Mock<IBabbleService>();
        var dictMock = new Mock<IDictionaryService>();
        var logger = new Mock<ILogger<BabbleGameService>>();

        babbleMock.Setup(b => b.GenerateGrid(It.IsAny<int>())).Returns(new List<char> { 'C', 'A', 'T', 'S' });
        babbleMock.Setup(b => b.IsWordOnGrid(It.IsAny<string>(), It.IsAny<List<char>>())).Returns(true);
        babbleMock.Setup(b => b.CalculateScore(It.IsAny<string>())).Returns(5);
        dictMock.Setup(d => d.IsValid(It.IsAny<string>())).Returns(true);
        dictMock.Setup(d => d.GetDefinition(It.IsAny<string>())).Returns("Feline");

        var service = new BabbleGameService(babbleMock.Object, dictMock.Object, logger.Object);
        var room = CreateTestRoom(GameType.Babble, 2);
        room.Players.ForEach(p => p.IsHost = false); // Non-host players find words
        room.PlayerAnswers["conn_1"] = new List<string> { "CAT", "CATS" };
        room.PlayerAnswers["conn_2"] = new List<string> { "CAT" };

        await service.StartRound(room, new GameSettings { BoardSize = 4, TimerDurationSeconds = 60 });
        var state = room.GameData as BabbleState;
        state.Should().NotBeNull();
        state!.Grid.Should().NotBeEmpty();

        await service.CalculateScores(room);
        room.RoundScores.Should().NotBeNull();
        room.RoundScores["conn_1"].Should().BeGreaterThan(0);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_babble_conn");
        state.LastRoundResults.Any(r => r.FoundBy.Contains("new_babble_conn")).Should().BeTrue();
    }

    [Fact]
    public async Task WisecrackGameService_StartRound_HandleAction_Scoring_Flow()
    {
        var logger = new Mock<ILogger<WisecrackGameService>>();
        var service = new WisecrackGameService(logger.Object);
        var room = CreateTestRoom(GameType.Wisecrack, 3);
        room.RoundNumber = 1;

        await service.StartRound(room, new GameSettings());
        var state = room.GameData as WisecrackState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(WisecrackPhase.Writing);

        var firstAssignment = state.Assignments.FirstOrDefault(a => a.AssignedPlayerIds.Contains("conn_1"));
        if (firstAssignment != null)
        {
            // Submit answer with promptId
            var answerPayload = JsonDocument.Parse($"{{\"promptId\": \"{firstAssignment.PromptId}\", \"answer\": \"Hilarious response\"}}").RootElement;
            var handledAnswer = await service.HandleAction(room, new GameAction("SUBMIT_ANSWER", answerPayload), "conn_1");
            handledAnswer.Should().BeTrue();
        }

        await service.CalculateScores(room);
        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_wise_conn");
    }

    [Fact]
    public async Task SushiTrainGameService_StartRound_CalculateScores_Flow()
    {
        var logger = new Mock<ILogger<SushiTrainGameService>>();
        var service = new SushiTrainGameService(logger.Object);
        var room = CreateTestRoom(GameType.SushiTrain, 3);

        await service.StartRound(room, new GameSettings());
        var state = room.GameData as SushiTrainState;
        state.Should().NotBeNull();
        state!.PlayerStates.Should().HaveCount(3);

        // Play card action
        var firstHandCard = state.PlayerStates["conn_1"].Hand.FirstOrDefault();
        if (firstHandCard != null)
        {
            var playPayload = JsonDocument.Parse($"{{\"cardId\": \"{firstHandCard.Id}\"}}").RootElement;
            await service.HandleAction(room, new GameAction("PLAY_CARD", playPayload), "conn_1");
        }

        await service.CalculateScores(room);
        await service.EndRound(room);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_sushi_conn");
        state.PlayerStates.Should().ContainKey("new_sushi_conn");
    }

    [Fact]
    public async Task SymbologyGameService_StartRound_HandleAction_CalculateScores_Flow()
    {
        var logger = new Mock<ILogger<SymbologyGameService>>();
        var service = new SymbologyGameService(logger.Object);
        var room = CreateTestRoom(GameType.Symbology, 3);

        await service.StartRound(room, new GameSettings());
        var state = room.GameData as SymbologyState;
        state.Should().NotBeNull();
        state!.CurrentWord.Should().NotBeNullOrWhiteSpace();

        // Set active player & round active for testing
        state.ActivePlayerId = "conn_1";
        state.IsRoundActive = true;

        // Place marker action
        var markerPayload = JsonDocument.Parse("{\"icon\": \"😀\", \"markerType\": \"Main\", \"color\": \"green\"}").RootElement;
        var handledMarker = await service.HandleAction(room, new GameAction("PLACE_MARKER", markerPayload), "conn_1");
        handledMarker.Should().BeTrue();

        // Submit guess action
        var guessPayload = JsonDocument.Parse($"{{\"guess\": \"{state.CurrentWord}\"}}").RootElement;
        var handledGuess = await service.HandleAction(room, new GameAction("SUBMIT_GUESS", guessPayload), "conn_2");
        handledGuess.Should().BeTrue();

        await service.CalculateScores(room);
        await service.EndRound(room);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_symb_conn");
    }

    [Fact]
    public async Task PoppycockGameService_StartRound_HandleAction_CalculateScores_Flow()
    {
        var service = new PoppycockGameService();
        var room = CreateTestRoom(GameType.Poppycock, 3);

        await service.StartRound(room, new GameSettings());
        var state = room.GameData as PoppycockState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(PoppycockPhase.Faking);

        // Submit bluff
        var bluffPayload = JsonDocument.Parse("{\"definition\": \"A convincing made-up definition\"}").RootElement;
        var handledBluff = await service.HandleAction(room, new GameAction("SUBMIT_DEFINITION", bluffPayload), "conn_2");
        handledBluff.Should().BeTrue();

        // Switch to voting phase
        state.Phase = PoppycockPhase.Voting;

        // Submit vote
        var votePayload = JsonDocument.Parse("{\"votedId\": \"REAL\"}").RootElement;
        var handledVote = await service.HandleAction(room, new GameAction("SUBMIT_VOTE", votePayload), "conn_2");
        handledVote.Should().BeTrue();

        await service.CalculateScores(room);
        await service.EndRound(room);

        // Rebind player
        service.RebindPlayer(room, "conn_2", "new_poppy_conn");
    }

    [Fact]
    public async Task GreatMindsGameService_StartRound_HandleAction_Flow()
    {
        var hubContext = new Mock<IHubContext<GameHub>>();
        var hubClients = new Mock<IHubClients>();
        var clientProxy = new Mock<IClientProxy>();
        hubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(clientProxy.Object);
        hubContext.Setup(h => h.Clients).Returns(hubClients.Object);
        var logger = new Mock<ILogger<GreatMindsGameService>>();

        var service = new GreatMindsGameService(hubContext.Object, logger.Object);
        var room = CreateTestRoom(GameType.GreatMinds, 3);

        await service.StartRound(room, new GameSettings());
        var state = room.GameData as GreatMindsGameState;
        state.Should().NotBeNull();
        state!.Lives.Should().BeGreaterThan(0);

        // Submit presence action
        var presencePayload = JsonDocument.Parse("{\"value\": 0.8}").RootElement;
        var handledPresence = await service.HandleAction(room, new GameAction("PRESENCE_UPDATE", presencePayload), "conn_1");
        handledPresence.Should().BeTrue();

        // Submit play card action
        var playerCard = state.PlayerHands["conn_1"].FirstOrDefault();
        if (playerCard > 0)
        {
            var cardPayload = JsonDocument.Parse($"{{\"cardValue\": {playerCard}}}").RootElement;
            await service.HandleAction(room, new GameAction("PLAY_CARD", cardPayload), "conn_1");
        }

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_minds_conn");
        state.PlayerHands.Should().ContainKey("new_minds_conn");
    }

    [Fact]
    public void BaseGameService_DefaultMethods_ShouldNotThrow()
    {
        var service = new FourInARowGameService();
        var room = CreateTestRoom(GameType.FourInARow, 2);

        var deserialized = service.DeserializeState(JsonDocument.Parse("{}").RootElement);
        deserialized.Should().NotBeNull();

        // Null json element fallback
        var defaultState = service.DeserializeState(default);
        defaultState.Should().NotBeNull();
    }
}
