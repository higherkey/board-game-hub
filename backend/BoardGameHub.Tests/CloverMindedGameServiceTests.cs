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
