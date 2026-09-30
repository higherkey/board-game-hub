using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace BoardGameHub.Tests;

public class CloverMindedGameServiceTests
{
    private readonly CloverMindedGameService _service;

    public CloverMindedGameServiceTests()
    {
        _service = new CloverMindedGameService(NullLogger<CloverMindedGameService>.Instance);
    }

    [Fact]
    public async Task StartRound_FailsWithLessThanTwoHandPlayers()
    {
        var room = new Room
        {
            Code = "TEST1",
            Players = new List<Player>
            {
                new() { ConnectionId = "p1", Name = "Host", IsScreen = true },
                new() { ConnectionId = "p2", Name = "Alice", IsScreen = false }
            }
        };

        await _service.StartRound(room, new GameSettings());

        var state = Assert.IsType<CloverMindedState>(room.GameData);
        Assert.Equal(CloverMindedPhase.GameOver.ToString(), state.Phase);
        Assert.Contains("at least two", state.Message);
    }

    [Fact]
    public async Task StartRound_InitializesClueWritingPhaseWithPrepForHandPlayers()
    {
        var room = CreateTestRoom();

        await _service.StartRound(room, new GameSettings());

        var state = Assert.IsType<CloverMindedState>(room.GameData);
        Assert.Equal(CloverMindedPhase.ClueWriting.ToString(), state.Phase);
        Assert.Equal(2, state.ParticipantIds.Count);
        Assert.True(state.PrepByPlayer.ContainsKey("p2"));
        Assert.True(state.PrepByPlayer.ContainsKey("p3"));

        var prepAlice = state.PrepByPlayer["p2"];
        Assert.Equal(4, prepAlice.Cards.Count);
        Assert.Equal(4, prepAlice.PairWords.Length);
        foreach (var pair in prepAlice.PairWords)
        {
            Assert.Equal(2, pair.Length);
            Assert.False(string.IsNullOrWhiteSpace(pair[0]));
            Assert.False(string.IsNullOrWhiteSpace(pair[1]));
        }
    }

    [Fact]
    public async Task SubmitClues_AdvancesToResolutionWhenAllHandPlayersSubmit()
    {
        var room = CreateTestRoom();
        await _service.StartRound(room, new GameSettings());
        var state = (CloverMindedState)room.GameData!;

        var payload1 = JsonDocument.Parse("{\"clues\":[\"Fruit\",\"Vehicle\",\"Pet\",\"Weather\"]}").RootElement;
        var ok1 = await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload1), "p2");
        Assert.True(ok1);
        Assert.Equal(CloverMindedPhase.ClueWriting.ToString(), state.Phase);

        var payload2 = JsonDocument.Parse("{\"clues\":[\"Music\",\"Color\",\"Sport\",\"Tool\"]}").RootElement;
        var ok2 = await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload2), "p2"); // repeat ignored or updated
        var ok3 = await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload2), "p3");
        Assert.True(ok3);

        Assert.Equal(CloverMindedPhase.Resolution.ToString(), state.Phase);
        Assert.NotNull(state.CurrentSpectatorId);
        Assert.Equal(5, state.Pool.Count); // 4 real + 1 decoy
        Assert.Equal(4, state.Slots!.Length);
    }

    [Fact]
    public async Task HandleAction_GrabAndReleaseCard_WorksInResolution()
    {
        var room = CreateTestRoom();
        await _service.StartRound(room, new GameSettings());
        var state = (CloverMindedState)room.GameData!;

        var payload1 = JsonDocument.Parse("{\"clues\":[\"Fruit\",\"Vehicle\",\"Pet\",\"Weather\"]}").RootElement;
        await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload1), "p2");
        var payload2 = JsonDocument.Parse("{\"clues\":[\"Music\",\"Color\",\"Sport\",\"Tool\"]}").RootElement;
        await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload2), "p3");

        var card = state.Pool.First();
        var grabPayload = JsonDocument.Parse($"{{\"cardId\":\"{card.Id}\"}}").RootElement;

        var grabbed = await _service.HandleAction(room, new GameAction("CLOVER_GRAB_CARD", grabPayload), "p3");
        Assert.True(grabbed);
        Assert.Equal("p3", state.CardOccupants?[card.Id]);

        var released = await _service.HandleAction(room, new GameAction("CLOVER_RELEASE_CARD", grabPayload), "p3");
        Assert.True(released);
        Assert.False(state.CardOccupants?.ContainsKey(card.Id) ?? false);
    }

    [Fact]
    public async Task Geometry_MapsOuterEdgesCorrectly()
    {
        for (var i = 0; i < 4; i++)
        {
            var (slotA, slotB, edgeA, edgeB) = CloverGeometry.PairEdgeAndSlotIndices(i);
            Assert.InRange(slotA, 0, 3);
            Assert.InRange(slotB, 0, 3);
            Assert.InRange(edgeA, 0, 3);
            Assert.InRange(edgeB, 0, 3);
        }
    }

    [Fact]
    public async Task HandleAction_SetSlot_RotateSlot_ClearSlot_AndSubmitGuess_WorksCorrectly()
    {
        var room = CreateTestRoom();
        await _service.StartRound(room, new GameSettings());
        var state = (CloverMindedState)room.GameData!;

        // Both players submit clues to trigger Resolution phase
        var payload1 = JsonDocument.Parse("{\"clues\":[\"Fruit\",\"Vehicle\",\"Pet\",\"Weather\"]}").RootElement;
        await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload1), "p2");
        var payload2 = JsonDocument.Parse("{\"clues\":[\"Music\",\"Color\",\"Sport\",\"Tool\"]}").RootElement;
        await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload2), "p3");

        Assert.Equal(CloverMindedPhase.Resolution.ToString(), state.Phase);
        var activeGuesser = state.CurrentSpectatorId == "p2" ? "p3" : "p2";
        var spectator = state.CurrentSpectatorId!;

        // Spectator cannot set slots
        var firstCard = state.Pool.First();
        var invalidSetPayload = JsonDocument.Parse($"{{\"slotIndex\":0,\"cardId\":\"{firstCard.Id}\",\"rotation\":1}}").RootElement;
        var spectatorSet = await _service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", invalidSetPayload), spectator);
        Assert.False(spectatorSet);

        // Guesser sets slot 0
        var setOk = await _service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", invalidSetPayload), activeGuesser);
        Assert.True(setOk);
        Assert.Equal(firstCard.Id, state.Slots![0].CardId);
        Assert.Equal(1, state.Slots[0].Rotation);

        // Guesser rotates slot 0
        var rotatePayload = JsonDocument.Parse("{\"slotIndex\":0}").RootElement;
        var rotateOk = await _service.HandleAction(room, new GameAction("CLOVER_ROTATE_SLOT", rotatePayload), activeGuesser);
        Assert.True(rotateOk);
        Assert.Equal(2, state.Slots[0].Rotation);

        // Guesser clears slot 0
        var clearPayload = JsonDocument.Parse("{\"slotIndex\":0}").RootElement;
        var clearOk = await _service.HandleAction(room, new GameAction("CLOVER_CLEAR_SLOT", clearPayload), activeGuesser);
        Assert.True(clearOk);
        Assert.Null(state.Slots[0].CardId);

        // Now place solution cards into all 4 slots to test perfect guess submission
        var solution = state.CurrentRoundSolution!;
        for (var i = 0; i < 4; i++)
        {
            var p = JsonDocument.Parse($"{{\"slotIndex\":{i},\"cardId\":\"{solution.SlotCardIds[i]}\",\"rotation\":{solution.SlotRotations[i]}}}").RootElement;
            await _service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", p), activeGuesser);
        }

        var submitGuessPayload = JsonDocument.Parse("{}").RootElement;
        var guessOk = await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_GUESS", submitGuessPayload), activeGuesser);
        Assert.True(guessOk);
        Assert.Equal(6, state.TotalScore); // Perfect attempt 1 adds 6 points
    }

    [Fact]
    public async Task HandleAction_SubmitGuess_WrongOnAttempt1_TransitionsToAttempt2()
    {
        var room = CreateTestRoom();
        await _service.StartRound(room, new GameSettings());
        var state = (CloverMindedState)room.GameData!;

        var payload1 = JsonDocument.Parse("{\"clues\":[\"Fruit\",\"Vehicle\",\"Pet\",\"Weather\"]}").RootElement;
        await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload1), "p2");
        var payload2 = JsonDocument.Parse("{\"clues\":[\"Music\",\"Color\",\"Sport\",\"Tool\"]}").RootElement;
        await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_CLUES", payload2), "p3");

        var activeGuesser = state.CurrentSpectatorId == "p2" ? "p3" : "p2";
        var solution = state.CurrentRoundSolution!;

        // Place 3 correct cards, and 1 wrong rotation
        for (var i = 0; i < 4; i++)
        {
            var rot = i == 3 ? (solution.SlotRotations[i] + 1) % 4 : solution.SlotRotations[i];
            var p = JsonDocument.Parse($"{{\"slotIndex\":{i},\"cardId\":\"{solution.SlotCardIds[i]}\",\"rotation\":{rot}}}").RootElement;
            await _service.HandleAction(room, new GameAction("CLOVER_SET_SLOT", p), activeGuesser);
        }

        var submitGuessPayload = JsonDocument.Parse("{}").RootElement;
        var guessOk = await _service.HandleAction(room, new GameAction("CLOVER_SUBMIT_GUESS", submitGuessPayload), activeGuesser);
        Assert.True(guessOk);
        Assert.Equal(CloverMindedPhase.ResolutionSecond.ToString(), state.Phase);
        Assert.Equal(2, state.ResolutionAttempt);
        Assert.Null(state.Slots![3].CardId); // Wrong slot was cleared
        Assert.NotNull(state.Slots[0].CardId); // Correct slot remains
    }

    private static Room CreateTestRoom()
    {
        return new Room
        {
            Code = "TEST2",
            Players = new List<Player>
            {
                new() { ConnectionId = "p1", Name = "TableScreen", IsScreen = true },
                new() { ConnectionId = "p2", Name = "Alice", IsScreen = false },
                new() { ConnectionId = "p3", Name = "Bob", IsScreen = false }
            }
        };
    }
}
