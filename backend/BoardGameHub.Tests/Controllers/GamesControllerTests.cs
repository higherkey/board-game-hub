using BoardGameHub.Api.Controllers;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BoardGameHub.Tests.Controllers;

public class GamesControllerTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly GamesController _sut;

    public GamesControllerTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _sut = new GamesController(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public async Task GetGames_ShouldReturnGamesFromDb()
    {
        // Arrange
        _context.Games.Add(new GameDefinition { Id = "test-game", Name = "Test Game", Status = GameStatus.Deployed });
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetGames();

        // Assert
        result.Value.Should().NotBeNull();
        result.Value.Should().HaveCount(1);
        result.Value!.First().Name.Should().Be("Test Game");
    }
}
