using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using System.Text.Json;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BoardGameHub.Tests.Services.Games;

public class WisecrackGameServiceTests
{
    private readonly WisecrackGameService _sut;

    public WisecrackGameServiceTests()
    {
        _sut = new WisecrackGameService(new Mock<ILogger<WisecrackGameService>>().Object);
    }

    [Fact]
    public async Task StartRound_ShouldAssignPrompts()
    {
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" },
                new Player { ConnectionId = "p3" }
            },
            RoundNumber = 1
        };
        var settings = new GameSettings();

        await _sut.StartRound(room, settings);

        var state = room.GameData as WisecrackState;
        state.Should().NotBeNull();
        state!.Phase.Should().Be(WisecrackPhase.Writing);
        // 3 Players -> 3 Assignments (each player involved in 2 prompts: A vs B, B vs C, C vs A)
        // Wait, AssignPrompts logic: loop i < playerCount.
        // Assigns to Players[i] and Players[i+1].
        state.Assignments.Should().HaveCount(3);
        state.Assignments.First().AssignedPlayerIds.Should().Contain(new[] { "p1", "p2" });
    }

    [Fact]
    public async Task SubmitAnswer_ShouldAdvanceToBattling_WhenAllAnswersReceived()
    {
        // Arrange
        var room = new Room
        {
            Players = new List<Player>
            {
                new Player { ConnectionId = "p1" },
                new Player { ConnectionId = "p2" }
            },
            RoundNumber = 1
        };
        await _sut.StartRound(room, new GameSettings());
        var state = room.GameData as WisecrackState;
        
        // 2 Players -> 2 Prompts assignment.
        // Expected Answers: Count * 2 = 4 (Each player answers 2 prompts).
        // Wait, players need to know WHICH prompts to answer.
        var a1 = state.Assignments[0];
        var a2 = state.Assignments[1];
        // p1 is assigned to a1 and a2 (if circular)?
        // p1 & p2 are in a1.
        // p2 & p1 are in a2.
        
        // Act - Submit all answers
        await _sut.SubmitAnswer(room, "p1", a1.PromptId, "Ans1-P1");
        await _sut.SubmitAnswer(room, "p2", a1.PromptId, "Ans1-P2");
        await _sut.SubmitAnswer(room, "p2", a2.PromptId, "Ans2-P2");
        await _sut.SubmitAnswer(room, "p1", a2.PromptId, "Ans2-P1");

        // Assert
        state.Phase.Should().Be(WisecrackPhase.Battling);
        state.Battles.Should().NotBeEmpty();
        state.CurrentBattle.Should().NotBeNull();
    }

    [Fact]
    public async Task SubmitVote_ShouldFinishBattle_AndAwardPoints()
    {
        // Arrange
        var p1 = new Player { ConnectionId = "p1", Score = 0 };
        var p2 = new Player { ConnectionId = "p2", Score = 0 };
        var voter = new Player { ConnectionId = "voter", Score = 0 };
        
        var room = new Room { Players = new List<Player> { p1, p2, voter } };
        var state = new WisecrackState { Phase = WisecrackPhase.Battling };
        
        // Setup Battle
        var battle = new WisecrackBattle
        {
            Id = Guid.NewGuid().ToString(),
            AnswerA = new WisecrackAnswer { PlayerId = "p1", Text = "A" },
            AnswerB = new WisecrackAnswer { PlayerId = "p2", Text = "B" }
        };
        state.Battles.Add(battle);
        state.CurrentBattleIndex = 0;
        
        room.GameData = state;
        
        // Act - Voter votes for Answer A (Choice 0)
        // Combatants cannot vote? Code: if (battle.AnswerA.PlayerId == playerId) return;
        // possibleVoters = 3 - 2 = 1.
        
        await _sut.SubmitVote(room, "voter", 0);

        // Assert
        battle.IsFinished.Should().BeTrue();
        battle.WinnerPlayerId.Should().Be("p1");
        
        // Logic: 100 + (votes * 25). 1 vote -> 125 pts.
        p1.Score.Should().Be(125);
        p2.Score.Should().Be(0);
    }

    [Fact]
    public async Task EndRound_ShouldSetStateToFinished()
    {
        var room = new Room { GameData = new WisecrackState() };
        await _sut.EndRound(room);
        room.State.Should().Be(GameState.Finished);
    }

    [Fact]
    public async Task HandleAction_SubmitAnswer_ShouldWork()
    {
        var room = new Room
        {
            Players = new List<Player> { new Player { ConnectionId = "p1", Name = "P1" } },
            RoundNumber = 1
        };
        var state = new WisecrackState 
        { 
            Phase = WisecrackPhase.Writing,
            Assignments = new List<WisecrackPromptAssignment> { new WisecrackPromptAssignment { PromptId = "a1", AssignedPlayerIds = new List<string> { "p1" } } }
        };
        room.GameData = state;
        var payload = JsonSerializer.SerializeToElement(new { promptId = "a1", answer = "Funny Ans" });
        var action = new GameAction("SUBMIT_ANSWER", payload);

        var result = await _sut.HandleAction(room, action, "p1");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAction_SubmitVote_ShouldWork()
    {
        var room = new Room { Players = new List<Player> { new Player { ConnectionId = "voter" }, new Player { ConnectionId = "p1" }, new Player { ConnectionId = "p2" } } };
        var state = new WisecrackState 
        { 
            Phase = WisecrackPhase.Battling,
            Battles = new List<WisecrackBattle> { new WisecrackBattle { Id = "b1", AnswerA = new WisecrackAnswer { PlayerId = "p1" }, AnswerB = new WisecrackAnswer { PlayerId = "p2" } } }
        };
        room.GameData = state;
        var payload = JsonSerializer.SerializeToElement(new { choice = 0 });
        var action = new GameAction("SUBMIT_VOTE", payload);

        var result = await _sut.HandleAction(room, action, "voter");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task HandleAction_NextBattle_ShouldWork()
    {
        var room = new Room { GameData = new WisecrackState { Phase = WisecrackPhase.Battling, Battles = new List<WisecrackBattle> { new WisecrackBattle() } } };
        var action = new GameAction("NEXT_BATTLE", null);

        var result = await _sut.HandleAction(room, action, "any");

        result.Should().BeTrue();
    }
}
