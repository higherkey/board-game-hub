using Xunit;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace BoardGameHub.Tests.Services.Games;

public class SymbologyGameServiceTests
{
    private readonly SymbologyGameService _service;

    public SymbologyGameServiceTests()
    {
        _service = new SymbologyGameService(new Mock<ILogger<SymbologyGameService>>().Object);
    }

    private Room CreateMockRoom(int playerCount)
    {
        var room = new Room { Code = "TEST", RoundNumber = 1 };
        for (int i = 0; i < playerCount; i++)
        {
            room.Players.Add(new Player { ConnectionId = $"p{i}", Name = $"Player {i}", Score = 0 });
        }
        return room;
    }

    [Fact]
    public async Task StartRound_ShouldInitializeStateCorrectly()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());

        var state = (SymbologyState)room.GameData;
        state.CurrentWord.Should().NotBeNullOrEmpty();
        state.ActivePlayerId.Should().Be("p1"); // 1 % 3 = 1
        state.IsRoundActive.Should().BeTrue();
        state.Markers.Should().BeEmpty();
    }

    [Fact]
    public async Task PlaceMarker_ShouldAddMarker_WhenActivePlayer()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (SymbologyState)room.GameData;

        var success = await _service.PlaceMarker(room, "p1", "🔥", "Main", "green");

        success.Should().BeTrue();
        state.Markers.Should().HaveCount(1);
        state.Markers[0].Icon.Should().Be("🔥");
    }

    [Fact]
    public async Task PlaceMarker_ShouldFail_WhenNotActivePlayer()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());

        var success = await _service.PlaceMarker(room, "p0", "🔥", "Main", "green");

        success.Should().BeFalse();
    }

    [Fact]
    public async Task RemoveMarker_ShouldWork()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (SymbologyState)room.GameData;

        await _service.PlaceMarker(room, "p1", "🔥", "Main", "green");
        var markerId = state.Markers[0].Id;

        var success = await _service.RemoveMarker(room, "p1", markerId);

        success.Should().BeTrue();
        state.Markers.Should().BeEmpty();
    }

    [Fact]
    public async Task SubmitGuess_Correct_ShouldAwardPointsAndEndRound()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (SymbologyState)room.GameData;
        var word = state.CurrentWord;

        var success = await _service.SubmitGuess(room, "p0", word);

        success.Should().BeTrue();
        state.IsRoundActive.Should().BeFalse();
        state.Scores["p0"].Should().Be(10);
        state.Scores["p1"].Should().Be(10); // Active player also gets points
    }

    [Fact]
    public async Task SubmitGuess_Incorrect_ShouldLogGuess()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (SymbologyState)room.GameData;

        var success = await _service.SubmitGuess(room, "p0", "Wrong Guess");

        success.Should().BeFalse();
        state.IsRoundActive.Should().BeTrue();
        state.GuessLog.Should().Contain(g => g.Contains("Wrong Guess"));
    }

    [Fact]
    public async Task CalculateScores_ShouldSyncToRoom()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (SymbologyState)room.GameData;
        
        // Mock a win
        state.Scores["p0"] = 10;
        state.Scores["p1"] = 10;

        await _service.CalculateScores(room);

        room.Players.First(p => p.ConnectionId == "p0").Score.Should().Be(10);
        room.Players.First(p => p.ConnectionId == "p1").Score.Should().Be(10);
        room.RoundScores["p0"].Should().Be(10);
    }
}
