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
using System.Text.Json;

namespace BoardGameHub.Tests.Services.Games;

public class UniversalTranslatorServiceTests
{
    private readonly UniversalTranslatorService _service;

    public UniversalTranslatorServiceTests()
    {
        _service = new UniversalTranslatorService(new Mock<ILogger<UniversalTranslatorService>>().Object);
    }

    private Room CreateMockRoom(int playerCount)
    {
        var room = new Room { Code = "TEST" };
        for (int i = 0; i < playerCount; i++)
        {
            room.Players.Add(new Player { ConnectionId = $"p{i}", Name = $"Player {i}" });
        }
        return room;
    }

    [Fact]
    public async Task StartRound_ShouldAssignRolesCorrectly_ForThreePlayers()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());

        var state = (UniversalTranslatorState)room.GameData;
        state.Roles.Should().HaveCount(3);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.MainComputer);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.J);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.Crew);
        state.Roles.Values.Should().NotContain(UniversalTranslatorRole.Empath);
    }

    [Fact]
    public async Task StartRound_ShouldAssignRolesCorrectly_ForFourPlayers()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());

        var state = (UniversalTranslatorState)room.GameData;
        state.Roles.Should().HaveCount(4);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.MainComputer);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.J);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.Empath);
        state.Roles.Values.Should().Contain(UniversalTranslatorRole.Crew);
    }

    [Fact]
    public async Task PickWord_ShouldTransitionToDayPhase()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        var computerId = state.Roles.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        var word = state.WordChoices.First();

        var success = await _service.PickWord(room, computerId, word);

        success.Should().BeTrue();
        state.TargetWord.Should().Be(word);
        state.Phase.Should().Be(UniversalTranslatorPhase.Day);
        room.RoundEndTime.Should().BeAfter(DateTime.UtcNow);
    }

    [Fact]
    public async Task SubmitToken_Correct_ShouldTriggerResult_WithoutEmpath()
    {
        var room = CreateMockRoom(3); // Computer, J, Crew
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        var computerId = state.Roles.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        state.Phase = UniversalTranslatorPhase.Day;

        var success = await _service.SubmitToken(room, computerId, "Correct");

        success.Should().BeTrue();
        state.Phase.Should().Be(UniversalTranslatorPhase.Result);
        state.Winner.Should().Be("Crew");
    }

    [Fact]
    public async Task SubmitToken_Correct_ShouldTriggerJGuessingEmpath_WithEmpath()
    {
        var room = CreateMockRoom(4); // Computer, J, Empath, Crew
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        var computerId = state.Roles.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        state.Phase = UniversalTranslatorPhase.Day;

        await _service.SubmitToken(room, computerId, "Correct");

        state.Phase.Should().Be(UniversalTranslatorPhase.JGuessingEmpath);
    }

    [Fact]
    public async Task SubmitToken_ShouldEnforceLimits()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        var computerId = state.Roles.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        state.Phase = UniversalTranslatorPhase.Day;
        state.TokenLimits["So Close"] = 1;

        await _service.SubmitToken(room, computerId, "So Close");
        var secondAttempt = await _service.SubmitToken(room, computerId, "So Close");

        secondAttempt.Should().BeFalse();
        state.TokenLimits["So Close"].Should().Be(0);
    }

    [Fact]
    public async Task SubmitVote_VotingForJ_ShouldResolveWhenAllVoted()
    {
        var room = CreateMockRoom(4); // 1 MC, 3 Voters (J, Empath, Crew)
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        state.Phase = UniversalTranslatorPhase.VotingForJ;

        var jId = state.Roles.First(r => r.Value == UniversalTranslatorRole.J).Key;
        var empathId = state.Roles.First(r => r.Value == UniversalTranslatorRole.Empath).Key;
        var crewId = state.Roles.First(r => r.Value == UniversalTranslatorRole.Crew).Key;

        await _service.SubmitVote(room, jId, crewId);
        await _service.SubmitVote(room, empathId, jId);
        await _service.SubmitVote(room, crewId, jId);

        state.Phase.Should().Be(UniversalTranslatorPhase.Result);
        state.Winner.Should().Be("Crew"); // J found
        state.EndReason.Should().Be(GameEndReason.JFound);
    }

    [Fact]
    public async Task SubmitVote_JGuessingEmpath_ShouldWork()
    {
        var room = CreateMockRoom(4);
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        state.Phase = UniversalTranslatorPhase.JGuessingEmpath;

        var jId = state.Roles.First(r => r.Value == UniversalTranslatorRole.J).Key;
        var empathId = state.Roles.First(r => r.Value == UniversalTranslatorRole.Empath).Key;

        await _service.SubmitVote(room, jId, empathId);

        state.Phase.Should().Be(UniversalTranslatorPhase.Result);
        state.Winner.Should().Be("J");
        state.EndReason.Should().Be(GameEndReason.EmpathAssassinated);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new UniversalTranslatorState() };
        await _service.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }

    [Fact]
    public async Task HandleAction_SubmitToken_ShouldWork()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        state.Phase = UniversalTranslatorPhase.Day;
        var computerId = state.Roles.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        var payload = JsonSerializer.SerializeToElement(new { token = "Yes" });
        var action = new GameAction("SUBMIT_TOKEN", payload);

        var result = await _service.HandleAction(room, action, computerId);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAction_SubmitVote_ShouldWork()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData;
        state.Phase = UniversalTranslatorPhase.VotingForJ;
        var jId = state.Roles.First(r => r.Value == UniversalTranslatorRole.J).Key;
        var crewId = state.Roles.First(r => r.Value == UniversalTranslatorRole.Crew).Key;
        var payload = JsonSerializer.SerializeToElement(new { accusedId = crewId });
        var action = new GameAction("SUBMIT_VOTE", payload);

        var result = await _service.HandleAction(room, action, jId);

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAction_PickWord_ShouldWork()
    {
        var room = CreateMockRoom(3);
        await _service.StartRound(room, new GameSettings());
        var state = (UniversalTranslatorState)room.GameData!;
        var computerId = state.Roles!.First(r => r.Value == UniversalTranslatorRole.MainComputer).Key;
        var word = state.WordChoices!.First();
        var payload = JsonSerializer.SerializeToElement(new { word });
        var action = new GameAction("PICK_WORD", payload);

        var result = await _service.HandleAction(room, action, computerId);

        result.Should().BeTrue();
    }
}
