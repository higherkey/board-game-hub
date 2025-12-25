using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class GameHistoryServiceTests
{
    private readonly AppDbContext _context;
    private readonly GameHistoryService _sut;

    public GameHistoryServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique DB per test
            .Options;

        _context = new AppDbContext(options);
        _sut = new GameHistoryService(_context);
    }

    [Fact]
    public async Task RecordGameSession_ShouldSaveSession_WithCorrectRankings()
    {
        // Arrange
        var room = new Room
        {
            Code = "TEST",
            GameType = GameType.Scatterbrain,
            Players = new List<Player>
            {
                new Player { Name = "Winner", Score = 100, UserId = "u1" },
                new Player { Name = "RunnerUp", Score = 50, UserId = "u2" },
                new Player { Name = "Loser", Score = 0 } // Guest
            }
        };

        // Act
        await _sut.RecordGameSession(room);

        // Assert
        var session = await _context.GameSessions.Include(s => s.Players).FirstOrDefaultAsync();
        session.Should().NotBeNull();
        session!.Players.Should().HaveCount(3);
        
        var winner = session.Players.First(p => p.Rank == 1);
        winner.DisplayName.Should().Be("Winner");
        winner.Score.Should().Be(100);
        
        var guest = session.Players.First(p => p.Rank == 3);
        guest.UserId.Should().BeNull();
    }

    [Fact]
    public async Task RecordGameSession_ShouldIgnoreEmptyRoom()
    {
        // Arrange
        var room = new Room { Code = "EMPTY", Players = new List<Player>() };

        // Act
        await _sut.RecordGameSession(room);

        // Assert
        (await _context.GameSessions.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task GetUserGameHistory_ShouldReturnUserGames()
    {
        // Arrange
        var userId = "target_user";
        var session = new GameSession
        {
            RoomCode = "HIST",
            EndTime = DateTime.UtcNow,
            Players = new List<GameSessionPlayer>
            {
                new GameSessionPlayer { UserId = userId, DisplayName = "Me", Rank = 1 }
            }
        };
        _context.GameSessions.Add(session);
        await _context.SaveChangesAsync();

        // Act
        var history = await _sut.GetUserGameHistory(userId);

        // Assert
        history.Should().HaveCount(1);
        history.First().UserId.Should().Be(userId);
    }
}
