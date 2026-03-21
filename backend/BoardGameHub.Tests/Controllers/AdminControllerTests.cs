using BoardGameHub.Api.Controllers;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Controllers;

public class AdminControllerTests : IDisposable
{
    private readonly Mock<IRoomService> _mockRoomService;
    private readonly Mock<ISocialService> _mockSocialService;
    private readonly Mock<IHubContext<GameHub>> _mockGameHub;
    private readonly Mock<IHubContext<SocialHub>> _mockSocialHub;
    private readonly Mock<IWebHostEnvironment> _mockEnv;
    private readonly Mock<UserManager<User>> _mockUserManager;
    private readonly AppDbContext _context;
    private readonly AdminController _sut;
    private readonly Mock<IClientProxy> _mockClientProxy;
    private readonly Mock<IHubClients> _mockHubClients;

    public AdminControllerTests()
    {
        _mockRoomService = new Mock<IRoomService>();
        _mockSocialService = new Mock<ISocialService>();
        _mockGameHub = new Mock<IHubContext<GameHub>>();
        _mockSocialHub = new Mock<IHubContext<SocialHub>>();
        _mockEnv = new Mock<IWebHostEnvironment>();
        
        var store = new Mock<IUserStore<User>>();
        _mockUserManager = new Mock<UserManager<User>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _mockClientProxy = new Mock<IClientProxy>();
        _mockHubClients = new Mock<IHubClients>();
        
        _mockGameHub.Setup(h => h.Clients).Returns(_mockHubClients.Object);
        _mockSocialHub.Setup(h => h.Clients).Returns(_mockHubClients.Object);
        _mockHubClients.Setup(c => c.All).Returns(_mockClientProxy.Object);
        _mockHubClients.Setup(c => c.Group(It.IsAny<string>())).Returns(_mockClientProxy.Object);

        _sut = new AdminController(_mockRoomService.Object, _mockSocialService.Object, _mockGameHub.Object, _mockSocialHub.Object, _mockEnv.Object, _mockUserManager.Object, _context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    [Fact]
    public void GetStats_ShouldReturnRoomServiceStats()
    {
        // Arrange
        var stats = new ServerStats { ActiveRooms = 5 };
        _mockRoomService.Setup(r => r.GetServerStats()).Returns(stats);

        // Act
        var result = _sut.GetStats() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.Value.Should().BeEquivalentTo(stats);
    }

    [Fact]
    public async Task GetGames_ShouldReturnGamesFromDb()
    {
        // Arrange
        _context.Games.Add(new GameDefinition { Id = "g1", Name = "Game 1", Status = GameStatus.Deployed });
        await _context.SaveChangesAsync();

        // Act
        var result = await _sut.GetGames() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var games = result!.Value as IEnumerable<GameDefinition>;
        games.Should().HaveCount(1);
    }

    [Fact]
    public async Task UpdateGame_ShouldUpdateAndNotifyRooms()
    {
        // Arrange
        _context.Games.Add(new GameDefinition { Id = "g1", Name = "Old Name" });
        await _context.SaveChangesAsync();
        
        var updated = new GameDefinition { Name = "New Name" };

        // Act
        var result = await _sut.UpdateGame("g1", updated) as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        var savedGame = await _context.Games.FindAsync("g1");
        savedGame!.Name.Should().Be("New Name");
        _mockRoomService.Verify(r => r.NotifyStatsChanged(), Times.Once);
    }

    [Fact]
    public async Task TerminateRoom_ShouldSendSignalAndCallTerminate()
    {
        // Act
        var result = await _sut.TerminateRoom("ABCD");

        // Assert
        result.Should().BeOfType<OkResult>();
        _mockClientProxy.Verify(c => c.SendCoreAsync("RoomTerminated", It.IsAny<object[]>(), default), Times.Once);
        _mockRoomService.Verify(r => r.TerminateRoom("ABCD"), Times.Once);
    }

    [Fact]
    public async Task SendMessage_ShouldCreateSystemAdminIfMissingAndSendGlobalMessage()
    {
        // Arrange
        _mockUserManager.Setup(u => u.FindByNameAsync("SystemAdmin")).ReturnsAsync((User?)null);
        _mockUserManager.Setup(u => u.CreateAsync(It.IsAny<User>(), It.IsAny<string>())).ReturnsAsync(IdentityResult.Success).Callback<User, string>((u, p) => u.Id = "sysadmin_id");
        
        var req = new AdminController.MsgReq("Test message", "global");

        // Act
        var result = await _sut.SendMessage(req) as OkResult;

        // Assert
        result.Should().NotBeNull();
        _mockSocialService.Verify(s => s.SaveGlobalMessage("sysadmin_id", "Test message"), Times.Once);
        _mockClientProxy.Verify(c => c.SendCoreAsync("ReceiveGlobalMessage", new object[] { "ADMIN", "Test message" }, default), Times.Once);
    }
}
