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

    [Fact]
    public async Task FarkleService_FullGameFlow_And_ScoringRules_Test()
    {
        var logger = new Mock<ILogger<FarkleService>>();
        var serviceProvider = new Mock<IServiceProvider>();
        var service = new FarkleService(logger.Object, serviceProvider.Object);
        var room = CreateTestRoom(GameType.Farkle, 3);
        var settings = new GameSettings();

        await service.StartRound(room, settings);
        room.GameData.Should().NotBeNull();
        var state = room.GameData as FarkleState;
        state.Should().NotBeNull();
        state!.PlayerStates.Should().HaveCount(3);
        state.ActivePlayerId.Should().Be("conn_1");

        // Non-active player cannot act
        var actionRoll = new GameAction("ROLL", null);
        var blockedAction = await service.HandleAction(room, actionRoll, "conn_2");
        blockedAction.Should().BeFalse();

        // Unknown action returns false
        var unknownAction = await service.HandleAction(room, new GameAction("UNKNOWN_ACTION", null), "conn_1");
        unknownAction.Should().BeFalse();

        // Dice scoring tests (CalculateDetailedScore combinations)
        FarkleService.CalculateDiceScore(new List<int> { 1, 2, 3, 4, 5, 6 }).Should().Be(1500); // 1-6 straight
        FarkleService.CalculateDiceScore(new List<int> { 2, 2, 2, 4, 4, 4 }).Should().Be(2500); // Two triplets
        FarkleService.CalculateDiceScore(new List<int> { 3, 3, 3, 3, 6, 6 }).Should().Be(1500); // 4 of kind + pair
        FarkleService.CalculateDiceScore(new List<int> { 1, 1, 2, 2, 4, 4 }).Should().Be(1500); // 3 pairs
        FarkleService.CalculateDiceScore(new List<int> { 5, 5, 5, 5, 5, 5 }).Should().Be(3000); // 6 of a kind
        FarkleService.CalculateDiceScore(new List<int> { 2, 2, 2, 2, 2 }).Should().Be(2000);    // 5 of a kind
        FarkleService.CalculateDiceScore(new List<int> { 4, 4, 4, 4 }).Should().Be(1000);       // 4 of a kind
        FarkleService.CalculateDiceScore(new List<int> { 1, 1, 1 }).Should().Be(300);          // Triplet 1s
        FarkleService.CalculateDiceScore(new List<int> { 6, 6, 6 }).Should().Be(600);          // Triplet 6s
        FarkleService.CalculateDiceScore(new List<int> { 1, 5 }).Should().Be(150);             // Single 1 and 5
        FarkleService.CalculateDiceScore(new List<int> { 2, 3, 4 }).Should().Be(0);             // Farkle (no scoring dice)
        FarkleService.CalculateDetailedScore(new List<int>()).DiceUsed.Should().Be(0);

        // Toggle die action
        state.Phase = FarklePhase.Picking;
        var togglePayload = JsonDocument.Parse("{\"index\": 0}").RootElement;
        var toggled = await service.HandleAction(room, new GameAction("TOGGLE_DIE", togglePayload), "conn_1");
        toggled.Should().BeTrue();
        state.Dice[0].IsReserved.Should().BeTrue();

        // Toggle back
        await service.HandleAction(room, new GameAction("TOGGLE_DIE", togglePayload), "conn_1");
        state.Dice[0].IsReserved.Should().BeFalse();

        // Invalid toggle index
        var invalidToggle = JsonDocument.Parse("{\"index\": 99}").RootElement;
        var badToggle = await service.HandleAction(room, new GameAction("TOGGLE_DIE", invalidToggle), "conn_1");
        badToggle.Should().BeFalse();

        // Test HandleRoll edge cases:
        // 1. Without newly reserved scoring dice -> should fail
        var rollResult = await service.HandleAction(room, new GameAction("ROLL", null), "conn_1");
        rollResult.Should().BeFalse();

        // 2. Reserve a non-scoring die -> should fail
        state.Dice[0].Value = 2; // 2 is not scoring by itself
        state.Dice[0].IsReserved = true;
        state.Dice[0].IsHeld = false;
        var badRoll = await service.HandleAction(room, new GameAction("ROLL", null), "conn_1");
        badRoll.Should().BeFalse();

        // 3. Hot dice scenario: all dice held reset
        foreach (var die in state.Dice)
        {
            die.Value = 1;
            die.IsReserved = true;
            die.IsHeld = false;
        }
        var hotRoll = await service.HandleAction(room, new GameAction("ROLL", null), "conn_1");
        hotRoll.Should().BeTrue();
        state.CurrentTurnScore.Should().BeGreaterThan(0);

        // Test HandleBank edge cases:
        // 1. Initial turn requires at least 500 points when TotalScore == 0
        state.Phase = FarklePhase.Picking;
        state.PlayerStates["conn_1"].TotalScore = 0;
        state.CurrentTurnScore = 100; // < 500
        state.Dice.ForEach(d => { d.IsHeld = false; d.IsReserved = false; });
        var bankUnder500 = await service.HandleAction(room, new GameAction("BANK", null), "conn_1");
        bankUnder500.Should().BeFalse();

        // 2. Successful bank >= 500
        state.CurrentTurnScore = 600;
        var bankSuccess = await service.HandleAction(room, new GameAction("BANK", null), "conn_1");
        bankSuccess.Should().BeTrue();
        state.PlayerStates["conn_1"].TotalScore.Should().Be(600);
        state.ActivePlayerId.Should().Be("conn_2"); // Advanced to next player

        // 3. Final turn trigger at >= 10,000 points
        state.ActivePlayerId = "conn_2";
        state.Phase = FarklePhase.Picking;
        state.PlayerStates["conn_2"].TotalScore = 9600;
        state.CurrentTurnScore = 500;
        state.Dice.ForEach(d => { d.IsHeld = false; d.IsReserved = false; });
        await service.HandleAction(room, new GameAction("BANK", null), "conn_2");
        state.PlayerStates["conn_2"].TotalScore.Should().Be(10100);
        state.PlayerStates["conn_2"].IsFinalTurn.Should().BeTrue();

        // End round & CalculateScores
        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);
        room.Players.First(p => p.ConnectionId == "conn_1").Score.Should().Be(600);

        // RebindPlayer
        service.RebindPlayer(room, "conn_1", "new_farkle_conn");
        state.PlayerStates.Should().ContainKey("new_farkle_conn");
        state.PlayerStates.Should().NotContainKey("conn_1");
    }

    [Fact]
    public async Task DeepfakeGameService_Comprehensive_Flow()
    {
        var logger = new Mock<ILogger<DeepfakeGameService>>();
        var service = new DeepfakeGameService(logger.Object);
        var room = CreateTestRoom(GameType.Deepfake, 3);
        var settings = new GameSettings();

        await service.StartRound(room, settings);
        var state = room.GameData as DeepfakeState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(DeepfakePhase.Drawing);
        state.Prompt.Should().NotBeNullOrWhiteSpace();

        // Force known AI player and turn order
        state.AiConnectionId = "conn_3";
        state.PlayerOrder = new List<string> { "conn_1", "conn_2", "conn_3" };
        state.CurrentTurnIndex = 0;
        state.TotalRounds = 1;

        // Stroke submissions for turn progression
        var strokePayload1 = JsonDocument.Parse("{\"pathData\": \"M 0 0 L 10 10\", \"color\": \"#ff0000\"}").RootElement;
        var res1 = await service.HandleAction(room, new GameAction("SUBMIT_STROKE", strokePayload1), "conn_1");
        res1.Should().BeTrue();

        // Wrong turn submission
        var wrongTurn = await service.HandleAction(room, new GameAction("SUBMIT_STROKE", strokePayload1), "conn_1");
        wrongTurn.Should().BeFalse();

        // Advance remaining turns to transition into Voting phase
        var strokePayload2 = JsonDocument.Parse("{\"pathData\": \"M 10 10 L 20 20\", \"color\": \"#00ff00\"}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_STROKE", strokePayload2), "conn_2");

        var strokePayload3 = JsonDocument.Parse("{\"pathData\": \"M 20 20 L 30 30\", \"color\": \"#0000ff\"}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_STROKE", strokePayload3), "conn_3");

        state.Phase.Should().Be(DeepfakePhase.Voting);

        // Case 1: AI caught by votes
        var votePayload1 = JsonDocument.Parse("{\"accusedId\": \"conn_3\"}").RootElement;
        var votePayload2 = JsonDocument.Parse("{\"accusedId\": \"conn_3\"}").RootElement;
        var votePayload3 = JsonDocument.Parse("{\"accusedId\": \"conn_1\"}").RootElement;

        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", votePayload1), "conn_1");
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", votePayload2), "conn_2");
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", votePayload3), "conn_3");

        state.AiCaught.Should().BeTrue();

        // AI Guess: incorrect guess -> humans win
        var wrongGuessPayload = JsonDocument.Parse("{\"guess\": \"CompletelyWrongGuess\"}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_AI_GUESS", wrongGuessPayload), "conn_3");
        state.AiWon.Should().BeFalse();
        state.Phase.Should().Be(DeepfakePhase.Results);

        await service.CalculateScores(room);
        room.RoundScores!["conn_1"].Should().Be(100);
        room.RoundScores["conn_2"].Should().Be(100);
        room.RoundScores["conn_3"].Should().Be(0);

        // Case 2: AI Guess correct -> AI snatch victory
        state.AiCaught = true;
        var correctGuessPayload = JsonDocument.Parse($"{{\"guess\": \"{state.Prompt}\"}}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_AI_GUESS", correctGuessPayload), "conn_3");
        state.AiWon.Should().BeTrue();

        await service.CalculateScores(room);
        room.RoundScores["conn_3"].Should().BeGreaterThan(0);

        // Case 3: AI Escaped
        state.Votes.Clear();
        state.Phase = DeepfakePhase.Voting;
        var voteEsc1 = JsonDocument.Parse("{\"accusedId\": \"conn_1\"}").RootElement;
        var voteEsc2 = JsonDocument.Parse("{\"accusedId\": \"conn_1\"}").RootElement;
        var voteEsc3 = JsonDocument.Parse("{\"accusedId\": \"conn_2\"}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", voteEsc1), "conn_1");
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", voteEsc2), "conn_2");
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", voteEsc3), "conn_3");
        state.AiWon.Should().BeTrue();

        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_deepfake_conn");
        state.PlayerOrder.Should().Contain("new_deepfake_conn");
    }

    [Fact]
    public async Task UniversalTranslatorService_Comprehensive_Flow()
    {
        var logger = new Mock<ILogger<UniversalTranslatorService>>();
        var service = new UniversalTranslatorService(logger.Object);
        var room = CreateTestRoom(GameType.UniversalTranslator, 4);
        var settings = new GameSettings();

        await service.StartRound(room, settings);
        var state = room.GameData as UniversalTranslatorState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(UniversalTranslatorPhase.Setup);

        var mcPlayer = state.Roles.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        var jPlayer = state.Roles.First(r => r.Value == UniversalTranslatorRole.J).Key;
        var empathPlayer = state.Roles.First(r => r.Value == UniversalTranslatorRole.Empath).Key;
        var crewPlayer = state.Roles.First(r => r.Value == UniversalTranslatorRole.Crew).Key;

        // Invalid word pick
        var invalidWordPayload = JsonDocument.Parse("{\"word\": \"NonExistentWord\"}").RootElement;
        var badPick = await service.HandleAction(room, new GameAction("PICK_WORD", invalidWordPayload), mcPlayer);
        badPick.Should().BeFalse();

        // Valid word pick
        var chosenWord = state.WordChoices.First();
        var pickPayload = JsonDocument.Parse($"{{\"word\": \"{chosenWord}\"}}").RootElement;
        var goodPick = await service.HandleAction(room, new GameAction("PICK_WORD", pickPayload), mcPlayer);
        goodPick.Should().BeTrue();
        state.Phase.Should().Be(UniversalTranslatorPhase.Day);
        state.TargetWord.Should().Be(chosenWord);

        // Non-MC cannot submit token
        var tokenPayload = JsonDocument.Parse("{\"token\": \"Yes\"}").RootElement;
        var nonMcToken = await service.HandleAction(room, new GameAction("SUBMIT_TOKEN", tokenPayload), crewPlayer);
        nonMcToken.Should().BeFalse();

        // MC submits token
        var mcToken = await service.HandleAction(room, new GameAction("SUBMIT_TOKEN", tokenPayload), mcPlayer);
        mcToken.Should().BeTrue();
        state.TokenHistory.Should().HaveCount(1);

        // Force phase
        var forcePayload = JsonDocument.Parse("{\"phase\": \"VotingForJ\"}").RootElement;
        var forced = await service.HandleAction(room, new GameAction("FORCE_PHASE", forcePayload), mcPlayer);
        forced.Should().BeTrue();
        state.Phase.Should().Be(UniversalTranslatorPhase.VotingForJ);

        // Voting for J: non-MC players vote
        var voteJPayload = JsonDocument.Parse($"{{\"accusedId\": \"{jPlayer}\"}}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", voteJPayload), empathPlayer);
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", voteJPayload), crewPlayer);
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", JsonDocument.Parse($"{{\"accusedId\": \"{crewPlayer}\"}}").RootElement), jPlayer);

        state.Winner.Should().Be("Crew");
        state.EndReason.Should().Be(GameEndReason.JFound);
        state.Phase.Should().Be(UniversalTranslatorPhase.Result);

        // J guesses Empath scenario
        state.Phase = UniversalTranslatorPhase.JGuessingEmpath;
        var jGuessEmpathPayload = JsonDocument.Parse($"{{\"accusedId\": \"{empathPlayer}\"}}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_VOTE", jGuessEmpathPayload), jPlayer);
        state.Winner.Should().Be("J");
        state.EndReason.Should().Be(GameEndReason.EmpathAssassinated);

        // Submit "Correct" token flow
        state.Phase = UniversalTranslatorPhase.Day;
        var correctTokenPayload = JsonDocument.Parse("{\"token\": \"Correct\"}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_TOKEN", correctTokenPayload), mcPlayer);
        state.Phase.Should().Be(UniversalTranslatorPhase.JGuessingEmpath);

        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);

        // Rebind player
        service.RebindPlayer(room, jPlayer, "new_j_conn");
        state.Roles.Should().ContainKey("new_j_conn");
    }

    [Fact]
    public async Task OneAndOnlyService_Comprehensive_Flow()
    {
        var logger = new Mock<ILogger<OneAndOnlyService>>();
        var service = new OneAndOnlyService(logger.Object);
        var room = CreateTestRoom(GameType.OneAndOnly, 3);

        await service.StartRound(room, new GameSettings());
        var state = room.GameData as OneAndOnlyState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(OneAndOnlyPhase.ClueGiving);

        var guesser = state.GuesserId;
        var clueGiver1 = room.Players.First(p => p.ConnectionId != guesser).ConnectionId;
        var clueGiver2 = room.Players.Last(p => p.ConnectionId != guesser).ConnectionId;

        // Guesser cannot submit clue
        var cluePayload1 = JsonDocument.Parse("{\"clue\": \"Apple\"}").RootElement;
        var blockedClue = await service.HandleAction(room, new GameAction("SUBMIT_CLUE", cluePayload1), guesser);
        blockedClue.Should().BeTrue(); // Action handled, but method ignores guesser internally
        state.Clues.Should().NotContainKey(guesser);

        // Both submit duplicate clues (test normalization & plural stripping)
        var clue1 = JsonDocument.Parse("{\"clue\": \"Apple\"}").RootElement;
        var clue2 = JsonDocument.Parse("{\"clue\": \"Apples\"}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_CLUE", clue1), clueGiver1);
        await service.HandleAction(room, new GameAction("SUBMIT_CLUE", clue2), clueGiver2);

        // Both should be flagged as invalid duplicate clues and transition to Guessing phase
        state.Phase.Should().Be(OneAndOnlyPhase.Guessing);
        state.InvalidClues.Should().Contain("APPLE");
        state.InvalidClues.Should().Contain("APPLES");

        // Non-guesser cannot guess
        var guessPayload = JsonDocument.Parse("{\"guess\": \"Apple\", \"isPass\": false}").RootElement;
        var badGuess = await service.HandleAction(room, new GameAction("SUBMIT_GUESS", guessPayload), clueGiver1);
        badGuess.Should().BeFalse();

        // Guesser passes
        var passPayload = JsonDocument.Parse("{\"guess\": \"\", \"isPass\": true}").RootElement;
        var passAction = await service.HandleAction(room, new GameAction("SUBMIT_GUESS", passPayload), guesser);
        passAction.Should().BeTrue();
        state.Result.Should().Be("Passed");
        state.Phase.Should().Be(OneAndOnlyPhase.Result);

        // Guess correct vs incorrect
        state.Phase = OneAndOnlyPhase.Guessing;
        var correctGuessPayload = JsonDocument.Parse($"{{\"guess\": \"{state.TargetWord}\", \"isPass\": false}}").RootElement;
        await service.HandleAction(room, new GameAction("SUBMIT_GUESS", correctGuessPayload), guesser);
        state.Result.Should().Be("Success");
        state.CorrectRounds.Should().Be(1);

        await service.CalculateScores(room);
        await service.EndRound(room);
        room.State.Should().Be(GameState.Finished);

        // Rebind player
        service.RebindPlayer(room, guesser, "new_guesser_conn");
        state.GuesserId.Should().Be("new_guesser_conn");
    }

    [Fact]
    public async Task ScatterbrainGameService_Comprehensive_Flow()
    {
        var logger = new Mock<ILogger<ScatterbrainGameService>>();
        var service = new ScatterbrainGameService(logger.Object);
        var room = CreateTestRoom(GameType.Scatterbrain, 3);
        room.Settings.TimerDurationSeconds = 60;

        await service.StartRound(room, room.Settings);
        var state = room.GameData as ScatterbrainState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(ScatterbrainPhase.Writing);
        state.CurrentLetter = 'S';
        state.Categories = new List<string> { "Animals", "Food", "Cities" };

        // Submit answers with alliterations
        var p1Answers = JsonDocument.Parse("[\"Silver Snake\", \"Sweet Strawberry\", \"Seattle\"]").RootElement;
        var p2Answers = JsonDocument.Parse("[\"Silver Snake\", \"Soup\", \"Stockholm\"]").RootElement;
        var p3Answers = JsonDocument.Parse("[\"Spider\", \"Salad\", \"Sydney\"]").RootElement;

        await service.HandleAction(room, new GameAction("SUBMIT_ANSWER", p1Answers), "conn_1");
        await service.HandleAction(room, new GameAction("SUBMIT_ANSWER", p2Answers), "conn_2");
        await service.HandleAction(room, new GameAction("SUBMIT_ANSWER", p3Answers), "conn_3");

        // Toggle Veto
        var vetoPayload = JsonDocument.Parse("{\"TargetPlayerId\": \"conn_3\", \"CategoryIndex\": 0}").RootElement;
        var vetoHandled = await service.HandleAction(room, new GameAction("TOGGLE_VETO", vetoPayload), "conn_1");
        vetoHandled.Should().BeTrue();
        state.Vetoes.Should().ContainKey("conn_3");
        state.Vetoes["conn_3"].Should().Contain(0);

        // Next Phase -> Validation
        await service.HandleAction(room, new GameAction("NEXT_PHASE", null), "conn_1");
        state.Phase.Should().Be(ScatterbrainPhase.Validation);

        // Challenge word & Vote
        var challengePayload = JsonDocument.Parse("{\"TargetPlayerId\": \"conn_1\", \"CategoryIndex\": 2}").RootElement;
        var challengeHandled = await service.HandleAction(room, new GameAction("CHALLENGE_WORD", challengePayload), "conn_2");
        challengeHandled.Should().BeTrue();
        state.ActiveChallenge.Should().NotBeNull();
        state.ActiveChallenge!.TargetPlayerId.Should().Be("conn_1");

        // Vote word: majority reject
        var rejectVote = JsonDocument.Parse("{\"approve\": false}").RootElement;
        var acceptVote = JsonDocument.Parse("{\"approve\": true}").RootElement;
        await service.HandleAction(room, new GameAction("VOTE_WORD", rejectVote), "conn_2");
        await service.HandleAction(room, new GameAction("VOTE_WORD", rejectVote), "conn_3");
        await service.HandleAction(room, new GameAction("VOTE_WORD", acceptVote), "conn_1");

        // Active challenge resolved and vetoed
        state.ActiveChallenge.Should().BeNull();
        state.Vetoes["conn_1"].Should().Contain(2);

        // Next Phase -> Results & EndRound
        await service.HandleAction(room, new GameAction("NEXT_PHASE", null), "conn_1");
        room.State.Should().Be(GameState.Finished);

        // conn_1 scored alliteration on "Sweet Strawberry" (2 pts)
        // Silver Snake was duplicate, Seattle was vetoed
        room.RoundScores.Should().NotBeNull();

        // Rebind player
        service.RebindPlayer(room, "conn_1", "new_sb_conn");
        state.Vetoes.Should().ContainKey("new_sb_conn");
    }

    [Fact]
    public async Task CloverMindedGameService_DetailedScoringAndSlots_Flow()
    {
        var logger = new Mock<ILogger<CloverMindedGameService>>();
        var service = new CloverMindedGameService(logger.Object);
        var room = CreateTestRoom(GameType.CloverMinded, 3);
        var settings = new GameSettings { CloverAllowPerPlayerSingleCardRotation = true };

        await service.StartRound(room, settings);
        var state = room.GameData as CloverMindedState;
        state.Should().NotBeNull();

        // Submit clues for all 3 players
        var cluePayload = JsonDocument.Parse("{\"clues\": [\"Clue1\", \"Clue2\", \"Clue3\", \"Clue4\"]}").RootElement;
        await service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", cluePayload), "conn_1");
        await service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", cluePayload), "conn_2");
        await service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", cluePayload), "conn_3");

        // Transitions to Resolution phase
        state!.Phase.Should().Be(CloverMindedPhase.Resolution.ToString());
        state.CurrentRoundSolution.Should().NotBeNull();
        var sol = state.CurrentRoundSolution!;

        // Grab & Release card
        var cardId = state.Pool.First().Id;
        var grabPayload = JsonDocument.Parse($"{{\"cardId\": \"{cardId}\"}}").RootElement;
        await service.HandleAction(room, new GameAction("CLOVER_GRAB_CARD", grabPayload), "conn_2");
        state.CardOccupants.Should().ContainKey(cardId);

        var releasePayload = JsonDocument.Parse($"{{\"cardId\": \"{cardId}\"}}").RootElement;
        await service.HandleAction(room, new GameAction("CLOVER_RELEASE_CARD", releasePayload), "conn_2");
        state.CardOccupants.Should().NotContainKey(cardId);

        // Set slots with correct solution cards
        for (int i = 0; i < 4; i++)
        {
            var setPayload = JsonDocument.Parse($"{{\"slotIndex\": {i}, \"cardId\": \"{sol.SlotCardIds[i]}\", \"rotation\": {sol.SlotRotations[i]}}}").RootElement;
            var setRes = await service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", setPayload), "conn_2");
            setRes.Should().BeTrue();
        }

        // Rotate slot
        var rotatePayload = JsonDocument.Parse("{\"slotIndex\": 0}").RootElement;
        await service.HandleAction(room, new GameAction("CLOVER_ROTATE_SLOT", rotatePayload), "conn_2");
        state.Slots![0].Rotation.Should().NotBe(sol.SlotRotations[0]);

        // Submit guess with 1 incorrect rotation -> First attempt fails, clears wrong card, moves to ResolutionSecond
        await service.HandleAction(room, new GameAction("CLOVER_SUBMIT_GUESS", null), "conn_2");
        state.Phase.Should().Be(CloverMindedPhase.ResolutionSecond.ToString());
        state.Slots[0].CardId.Should().BeNull(); // Wrong card cleared

        // Re-place correct card and rotation
        var fixPayload = JsonDocument.Parse($"{{\"slotIndex\": 0, \"cardId\": \"{sol.SlotCardIds[0]}\", \"rotation\": {sol.SlotRotations[0]}}}").RootElement;
        await service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", fixPayload), "conn_2");

        // Clear slot action test
        var clearPayload = JsonDocument.Parse("{\"slotIndex\": 0}").RootElement;
        await service.HandleAction(room, new GameAction("CLOVER_CLEAR_SLOT", clearPayload), "conn_2");
        state.Slots[0].CardId.Should().BeNull();

        // Fix again
        await service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", fixPayload), "conn_2");

        // Submit second attempt guess -> succeeds
        await service.HandleAction(room, new GameAction("CLOVER_SUBMIT_GUESS", null), "conn_2");
        state.TotalScore.Should().Be(4); // 4 pts on second attempt
    }

    [Fact]
    public async Task NomDeCode_And_Warships_FullLifecycle_Test()
    {
        // NomDeCode
        var nomService = new NomDeCodeService();
        var nomRoom = CreateTestRoom(GameType.NomDeCode, 2);
        await nomService.StartRound(nomRoom, new GameSettings());
        nomRoom.GameData.Should().NotBeNull();
        var nomState = nomRoom.GameData as NomDeCodeState;
        nomState!.Grid.Should().HaveCount(25);
        await nomService.EndRound(nomRoom);
        nomRoom.State.Should().Be(GameState.Finished);

        // Warships
        var warService = new WarshipsGameService();
        var warRoom = CreateTestRoom(GameType.Warships, 2);
        await warService.StartRound(warRoom, new GameSettings());
        var warState = warRoom.GameData as WarshipsState;
        warState!.PlayerBoards.Should().HaveCount(2);
        warState.ActivePlayerId = "conn_1";
        warService.RebindPlayer(warRoom, "conn_1", "new_war_conn");
        warState.ActivePlayerId.Should().Be("new_war_conn");
        await warService.EndRound(warRoom);
        warRoom.State.Should().Be(GameState.Finished);
    }
}

