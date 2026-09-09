using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests;

public class ActiveRoomHydrationTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly List<IGameService> _gameServices;
    private readonly RoomStateSerializer _serializer;
    private readonly Mock<IHubContext<BoardGameHub.Api.Hubs.AdminHub>> _mockAdminHub;
    private readonly Mock<IHubContext<BoardGameHub.Api.Hubs.GameHub>> _mockGameHub;
    private readonly Mock<ILogger<RoomService>> _mockRoomLogger;
    private readonly Mock<ILogger<GameStateManager>> _mockGsmLogger;
    private readonly GameStateManager _gameStateManager;
    private readonly string _dbName;

    public ActiveRoomHydrationTests()
    {
        _dbName = "HydrationTests_" + Guid.NewGuid().ToString("N");
        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(_dbName));
        _serviceProvider = services.BuildServiceProvider();
        _scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();
        var farkleLogger = new Mock<ILogger<FarkleService>>();
        var serviceProvider = new Mock<IServiceProvider>();
        var scatLogger = new Mock<ILogger<ScatterbrainGameService>>();
        var clovLogger = new Mock<ILogger<CloverMindedGameService>>();
        var babbleMock = new Mock<IBabbleService>();
        var dictMock = new Mock<IDictionaryService>();
        var babbleLogger = new Mock<ILogger<BabbleGameService>>();
        var sushiLogger = new Mock<ILogger<SushiTrainGameService>>();
        var wiseLogger = new Mock<ILogger<WisecrackGameService>>();
        var deepLogger = new Mock<ILogger<DeepfakeGameService>>();
        var symbLogger = new Mock<ILogger<SymbologyGameService>>();
        var pictoLogger = new Mock<ILogger<PictophoneService>>();
        var transLogger = new Mock<ILogger<UniversalTranslatorService>>();
        var mindHub = new Mock<IHubContext<BoardGameHub.Api.Hubs.GameHub>>();
        var mindLogger = new Mock<ILogger<GreatMindsGameService>>();
        var oneLogger = new Mock<ILogger<OneAndOnlyService>>();
        var newsLogger = new Mock<ILogger<BreakingNewsGameService>>();

        _gameServices = new List<IGameService>
        {
            new FarkleService(farkleLogger.Object, serviceProvider.Object),
            new ScatterbrainGameService(scatLogger.Object),
            new CloverMindedGameService(clovLogger.Object),
            new BabbleGameService(babbleMock.Object, dictMock.Object, babbleLogger.Object),
            new SushiTrainGameService(sushiLogger.Object),
            new WisecrackGameService(wiseLogger.Object),
            new FourInARowGameService(),
            new NomDeCodeService(),
            new WarshipsGameService(),
            new DeepfakeGameService(deepLogger.Object),
            new GreatMindsGameService(mindHub.Object, mindLogger.Object),
            new OneAndOnlyService(oneLogger.Object),
            new BreakingNewsGameService(newsLogger.Object),
            new UniversalTranslatorService(transLogger.Object),
            new SymbologyGameService(symbLogger.Object),
            new PictophoneService(pictoLogger.Object),
            new PoppycockGameService()
        };

        _serializer = new RoomStateSerializer(_gameServices);
        _mockAdminHub = new Mock<IHubContext<BoardGameHub.Api.Hubs.AdminHub>>();
        _mockGameHub = new Mock<IHubContext<BoardGameHub.Api.Hubs.GameHub>>();
        _mockRoomLogger = new Mock<ILogger<RoomService>>();
        _mockGsmLogger = new Mock<ILogger<GameStateManager>>();

        var diffService = new StateDiffService();
        _gameStateManager = new GameStateManager(_mockGameHub.Object, diffService, _mockGsmLogger.Object);
    }

    public void Dispose()
    {
        _serviceProvider.Dispose();
    }

    private RoomService CreateRoomService(IRoomPersistenceService? persistenceService = null)
    {
        return new RoomService(
            _gameServices,
            _mockAdminHub.Object,
            _mockGameHub.Object,
            _gameStateManager,
            _mockRoomLogger.Object,
            _scopeFactory,
            persistenceService,
            _serializer);
    }

    [Fact]
    public async Task GetRoom_OnCacheMiss_ShouldHydrateFromDatabase()
    {
        // Arrange
        var originalRoom = new Room
        {
            Code = "MISS1",
            GameType = GameType.Warships,
            State = GameState.Playing,
            Revision = 7,
            RoundNumber = 2,
            CreatedAt = DateTime.UtcNow.AddMinutes(-30),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-2),
            ExpiresAt = DateTime.UtcNow.AddHours(3),
            GameData = new WarshipsState
            {
                Phase = WarshipsPhase.Battle,
                ActivePlayerId = "player_bob"
            }
        };
        originalRoom.Players.Add(new Player
        {
            ConnectionId = "old_conn",
            Name = "Bob",
            SessionId = "sess_bob_999",
            IsHost = true,
            Score = 15
        });

        var jsonEnvelope = _serializer.Serialize(originalRoom);

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.ActiveRooms.Add(new ActiveRoom
            {
                RoomCode = "MISS1",
                GameType = "Warships",
                State = "Playing",
                Revision = 7,
                RoomEnvelopeJson = jsonEnvelope,
                CreatedAt = originalRoom.CreatedAt,
                UpdatedAt = originalRoom.UpdatedAt,
                ExpiresAt = originalRoom.ExpiresAt
            });
            await db.SaveChangesAsync();
        }

        var roomService = CreateRoomService();

        // Act - Cache miss triggers on-demand hydration from DbContext
        var hydrated = roomService.GetRoom("MISS1");

        // Assert
        hydrated.Should().NotBeNull();
        hydrated!.Code.Should().Be("MISS1");
        hydrated.GameType.Should().Be(GameType.Warships);
        hydrated.State.Should().Be(GameState.Playing);
        hydrated.Revision.Should().BeGreaterThanOrEqualTo(7);
        hydrated.RoundNumber.Should().Be(2);
        hydrated.Players.Should().HaveCount(1);
        hydrated.Players[0].Name.Should().Be("Bob");
        hydrated.Players[0].SessionId.Should().Be("sess_bob_999");
        hydrated.Players[0].Score.Should().Be(15);
        hydrated.Players[0].IsConnected.Should().BeFalse();

        // Verify GameData polymorphic deserialization
        hydrated.GameData.Should().BeOfType<WarshipsState>();
        var warshipsData = (WarshipsState)hydrated.GameData!;
        warshipsData.Phase.Should().Be(WarshipsPhase.Battle);
        warshipsData.ActivePlayerId.Should().Be("player_bob");
    }

    [Fact]
    public async Task JoinRoom_WithSessionToken_AfterHydration_ShouldRebindPlayer()
    {
        // Arrange
        var originalRoom = new Room
        {
            Code = "REBND",
            GameType = GameType.Scatterbrain,
            State = GameState.Playing,
            Revision = 3,
            CreatedAt = DateTime.UtcNow.AddMinutes(-10),
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(2)
        };
        var originalSessionId = Guid.NewGuid().ToString("N");
        originalRoom.Players.Add(new Player
        {
            ConnectionId = "old_socket_abc",
            Name = "Charlie",
            SessionId = originalSessionId,
            IsHost = true,
            IsConnected = false
        });

        var jsonEnvelope = _serializer.Serialize(originalRoom);

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.ActiveRooms.Add(new ActiveRoom
            {
                RoomCode = "REBND",
                GameType = "Scatterbrain",
                State = "Playing",
                Revision = 3,
                RoomEnvelopeJson = jsonEnvelope,
                CreatedAt = originalRoom.CreatedAt,
                UpdatedAt = originalRoom.UpdatedAt,
                ExpiresAt = originalRoom.ExpiresAt
            });
            await db.SaveChangesAsync();
        }

        var roomService = CreateRoomService();

        // Act - Reconnect with new connection ID and existing session token
        var room = roomService.JoinRoom("REBND", "new_socket_xyz", "Charlie", null, null, false, originalSessionId);

        // Assert
        room.Should().NotBeNull();
        room!.Players.Should().HaveCount(1);
        var player = room.Players[0];
        player.Name.Should().Be("Charlie");
        player.ConnectionId.Should().Be("new_socket_xyz"); // Rebound to new socket
        player.IsConnected.Should().BeTrue();
        player.SessionId.Should().NotBe(originalSessionId); // SessionId is rotated on reconnect
        player.SessionId.Should().NotBeNullOrWhiteSpace();
    }

    [Theory]
    [InlineData(GameType.Scatterbrain)]
    [InlineData(GameType.Babble)]
    [InlineData(GameType.OneAndOnly)]
    [InlineData(GameType.BreakingNews)]
    [InlineData(GameType.UniversalTranslator)]
    [InlineData(GameType.Symbology)]
    [InlineData(GameType.Pictophone)]
    [InlineData(GameType.Wisecrack)]
    [InlineData(GameType.SushiTrain)]
    [InlineData(GameType.GreatMinds)]
    [InlineData(GameType.Poppycock)]
    [InlineData(GameType.NomDeCode)]
    [InlineData(GameType.Warships)]
    [InlineData(GameType.FourInARow)]
    [InlineData(GameType.CloverMinded)]
    [InlineData(GameType.Farkle)]
    [InlineData(GameType.Deepfake)]
    public async Task AllGameTypes_StateRoundtripFidelity_AcrossDatabaseEnvelope(GameType gameType)
    {
        // Arrange
        var room = new Room
        {
            Code = $"TST{(int)gameType}",
            GameType = gameType,
            State = GameState.Playing,
            Revision = 12,
            RoundNumber = 3,
            CreatedAt = DateTime.UtcNow.AddMinutes(-45),
            UpdatedAt = DateTime.UtcNow.AddMinutes(-1),
            ExpiresAt = DateTime.UtcNow.AddHours(3)
        };
        room.Players.Add(new Player
        {
            ConnectionId = "conn_p1",
            Name = "Player1",
            SessionId = "sess_p1",
            Score = 100,
            IsHost = true
        });

        // Act
        var envelopeJson = _serializer.Serialize(room);
        var deserialized = _serializer.Deserialize(envelopeJson, _gameServices);

        // Assert
        deserialized.Code.Should().Be(room.Code);
        deserialized.GameType.Should().Be(gameType);
        deserialized.Revision.Should().Be(12);
        deserialized.RoundNumber.Should().Be(3);
        deserialized.Players.Should().HaveCount(1);
        deserialized.Players[0].Name.Should().Be("Player1");
        deserialized.Players[0].Score.Should().Be(100);
    }
}
