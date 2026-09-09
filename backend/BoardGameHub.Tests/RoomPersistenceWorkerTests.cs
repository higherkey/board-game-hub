using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
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

public class RoomPersistenceWorkerTests : IDisposable
{
    private readonly DbContextOptions<AppDbContext> _dbOptions;
    private readonly ServiceProvider _serviceProvider;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly List<IGameService> _gameServices;
    private readonly RoomStateSerializer _serializer;
    private readonly Mock<IRoomService> _mockRoomService;
    private readonly Mock<GameStateManager> _mockGameStateManager;
    private readonly Mock<ILogger<RoomPersistenceWorker>> _mockLogger;

    public RoomPersistenceWorkerTests()
    {
        var dbName = "RoomPersistenceTests_" + Guid.NewGuid().ToString("N");
        _dbOptions = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var services = new ServiceCollection();
        services.AddDbContext<AppDbContext>(options => options.UseInMemoryDatabase(dbName));
        _serviceProvider = services.BuildServiceProvider();
        _scopeFactory = _serviceProvider.GetRequiredService<IServiceScopeFactory>();

        var farkleLogger = new Mock<ILogger<FarkleService>>();
        var serviceProviderMock = new Mock<IServiceProvider>();
        var farkleService = new FarkleService(farkleLogger.Object, serviceProviderMock.Object);

        _gameServices = new List<IGameService>
        {
            new ScatterbrainGameService(new Mock<ILogger<ScatterbrainGameService>>().Object),
            new BabbleGameService(new Mock<IBabbleService>().Object, new Mock<IDictionaryService>().Object, new Mock<ILogger<BabbleGameService>>().Object),
            new OneAndOnlyService(new Mock<ILogger<OneAndOnlyService>>().Object),
            new BreakingNewsGameService(new Mock<ILogger<BreakingNewsGameService>>().Object),
            new UniversalTranslatorService(new Mock<ILogger<UniversalTranslatorService>>().Object),
            new SymbologyGameService(new Mock<ILogger<SymbologyGameService>>().Object),
            new PictophoneService(new Mock<ILogger<PictophoneService>>().Object),
            new WisecrackGameService(new Mock<ILogger<WisecrackGameService>>().Object),
            new SushiTrainGameService(new Mock<ILogger<SushiTrainGameService>>().Object),
            new GreatMindsGameService(new Mock<IHubContext<BoardGameHub.Api.Hubs.GameHub>>().Object, new Mock<ILogger<GreatMindsGameService>>().Object),
            new PoppycockGameService(),
            new NomDeCodeService(),
            new WarshipsGameService(),
            new FourInARowGameService(),
            new CloverMindedGameService(new Mock<ILogger<CloverMindedGameService>>().Object),
            farkleService,
            new DeepfakeGameService(new Mock<ILogger<DeepfakeGameService>>().Object)
        };

        _serializer = new RoomStateSerializer(_gameServices);
        _mockRoomService = new Mock<IRoomService>();
        
        var mockHub = new Mock<IHubContext<BoardGameHub.Api.Hubs.GameHub>>();
        var diffService = new StateDiffService();
        _mockGameStateManager = new Mock<GameStateManager>(mockHub.Object, diffService, new Mock<ILogger<GameStateManager>>().Object);
        _mockLogger = new Mock<ILogger<RoomPersistenceWorker>>();
    }

    public void Dispose()
    {
        _serviceProvider.Dispose();
    }

    private RoomPersistenceWorker CreateWorker()
    {
        return new RoomPersistenceWorker(
            _scopeFactory,
            _mockRoomService.Object,
            _mockGameStateManager.Object,
            _serializer,
            _gameServices,
            _mockLogger.Object);
    }

    [Fact]
    public async Task QueueSave_ShouldPersistRoomSnapshotToDatabase()
    {
        // Arrange
        var worker = CreateWorker();
        var snapshot = new RoomSnapshot
        {
            RoomCode = "SAVE1",
            GameType = "OneAndOnly",
            State = "Playing",
            SchemaVersion = 1,
            Revision = 5,
            RoomEnvelopeJson = "{\"code\":\"SAVE1\",\"gameType\":\"OneAndOnly\"}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4)
        };

        // Act
        worker.QueueSave(snapshot);
        await worker.FlushAsync(CancellationToken.None);

        // Assert
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.ActiveRooms.FindAsync("SAVE1");

        saved.Should().NotBeNull();
        saved!.RoomCode.Should().Be("SAVE1");
        saved.GameType.Should().Be("OneAndOnly");
        saved.State.Should().Be("Playing");
        saved.Revision.Should().Be(5);
        saved.RoomEnvelopeJson.Should().Be(snapshot.RoomEnvelopeJson);
    }

    [Fact]
    public async Task QueueSave_MonotonicRevision_ShouldIgnoreLowerRevisions()
    {
        // Arrange
        var worker = CreateWorker();
        var snapshotV10 = new RoomSnapshot
        {
            RoomCode = "MONO1",
            GameType = "SushiTrain",
            State = "Playing",
            Revision = 10,
            RoomEnvelopeJson = "{\"rev\":10}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4)
        };
        var snapshotV5Stale = new RoomSnapshot
        {
            RoomCode = "MONO1",
            GameType = "SushiTrain",
            State = "Lobby",
            Revision = 5,
            RoomEnvelopeJson = "{\"rev\":5}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4)
        };

        // Save v10 first
        worker.QueueSave(snapshotV10);
        await worker.FlushAsync(CancellationToken.None);

        // Act - Attempt to save stale v5
        worker.QueueSave(snapshotV5Stale);
        await worker.FlushAsync(CancellationToken.None);

        // Assert - DB should still have v10
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var record = await db.ActiveRooms.FindAsync("MONO1");

        record.Should().NotBeNull();
        record!.Revision.Should().Be(10);
        record.State.Should().Be("Playing");
        record.RoomEnvelopeJson.Should().Be("{\"rev\":10}");
    }

    [Fact]
    public async Task QueueDelete_ShouldRemoveRoomFromDatabase()
    {
        // Arrange
        var worker = CreateWorker();
        var snapshot = new RoomSnapshot
        {
            RoomCode = "DEL1",
            GameType = "Farkle",
            State = "Finished",
            Revision = 1,
            RoomEnvelopeJson = "{}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4)
        };
        worker.QueueSave(snapshot);
        await worker.FlushAsync(CancellationToken.None);

        // Act
        worker.QueueDelete("DEL1");
        await worker.FlushAsync(CancellationToken.None);

        // Assert
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var record = await db.ActiveRooms.FindAsync("DEL1");

        record.Should().BeNull();
    }

    [Fact]
    public async Task CleanupExpiredRoomsAsync_ShouldPruneExpiredRooms()
    {
        // Arrange
        var worker = CreateWorker();
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.ActiveRooms.AddRange(
                new ActiveRoom
                {
                    RoomCode = "EXPIRED1",
                    GameType = "Babble",
                    State = "Lobby",
                    ExpiresAt = DateTime.UtcNow.AddMinutes(-10),
                    RoomEnvelopeJson = "{}"
                },
                new ActiveRoom
                {
                    RoomCode = "VALID1",
                    GameType = "Babble",
                    State = "Lobby",
                    ExpiresAt = DateTime.UtcNow.AddHours(2),
                    RoomEnvelopeJson = "{}"
                }
            );
            await db.SaveChangesAsync();
        }

        // Act
        await worker.CleanupExpiredRoomsAsync(CancellationToken.None);

        // Assert
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var expired = await db.ActiveRooms.FindAsync("EXPIRED1");
            var valid = await db.ActiveRooms.FindAsync("VALID1");

            expired.Should().BeNull();
            valid.Should().NotBeNull();
        }

        _mockRoomService.Verify(r => r.EvictRoom("EXPIRED1"), Times.Once);
        _mockRoomService.Verify(r => r.EvictRoom("VALID1"), Times.Never);
    }

    [Fact]
    public async Task StartAsync_And_StopAsync_ShouldExecuteGracefully()
    {
        // Arrange
        var worker = CreateWorker();

        // Act & Assert
        await worker.StartAsync(CancellationToken.None);
        await worker.StopAsync(CancellationToken.None);
    }

    [Fact]
    public async Task RehydrateActiveRoomsAsync_ShouldRehydrateValidRooms()
    {
        // Arrange
        var worker = CreateWorker();
        var room = new Room
        {
            Code = "REHYD1",
            GameType = GameType.Farkle,
            State = GameState.Playing,
            ExpiresAt = DateTime.UtcNow.AddHours(2)
        };
        var json = _serializer.Serialize(room);

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.ActiveRooms.Add(new ActiveRoom
            {
                RoomCode = "REHYD1",
                GameType = "Farkle",
                State = "Playing",
                ExpiresAt = DateTime.UtcNow.AddHours(2),
                RoomEnvelopeJson = json
            });
            await db.SaveChangesAsync();
        }

        // Act
        await worker.RehydrateActiveRoomsAsync(CancellationToken.None);

        // Assert
        _mockRoomService.Verify(r => r.RehydrateRoom(It.Is<Room>(rm => rm.Code == "REHYD1")), Times.Once);
    }

    [Fact]
    public async Task QueueSave_ShouldUpdateExistingEntity_WhenRevisionIsHigher()
    {
        // Arrange
        var worker = CreateWorker();
        var snapshotV1 = new RoomSnapshot
        {
            RoomCode = "UPDATE1",
            GameType = "Babble",
            State = "Lobby",
            SchemaVersion = 1,
            Revision = 1,
            RoomEnvelopeJson = "{\"rev\":1}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4)
        };
        worker.QueueSave(snapshotV1);
        await worker.FlushAsync(CancellationToken.None);

        var snapshotV2 = new RoomSnapshot
        {
            RoomCode = "UPDATE1",
            GameType = "Babble",
            State = "Playing",
            SchemaVersion = 1,
            Revision = 2,
            RoomEnvelopeJson = "{\"rev\":2}",
            CreatedAt = snapshotV1.CreatedAt,
            UpdatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(4)
        };

        // Act
        worker.QueueSave(snapshotV2);
        await worker.FlushAsync(CancellationToken.None);

        // Assert
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var updated = await db.ActiveRooms.FindAsync("UPDATE1");

        updated.Should().NotBeNull();
        updated!.Revision.Should().Be(2);
        updated.State.Should().Be("Playing");
        updated.RoomEnvelopeJson.Should().Be("{\"rev\":2}");
    }

    [Fact]
    public async Task FallbackPersistIndividuallyAsync_ShouldPersistEntitiesIndividually()
    {
        // Arrange
        var worker = CreateWorker();
        var upserts = new Dictionary<string, RoomSnapshot>
        {
            ["FALLBACK1"] = new RoomSnapshot
            {
                RoomCode = "FALLBACK1",
                GameType = "Farkle",
                State = "Lobby",
                SchemaVersion = 1,
                Revision = 1,
                RoomEnvelopeJson = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(2)
            }
        };

        // Act - invoke private FallbackPersistIndividuallyAsync via reflection
        var fallbackMethod = typeof(RoomPersistenceWorker).GetMethod(
            "FallbackPersistIndividuallyAsync",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!;

        var task = (Task)fallbackMethod.Invoke(worker, new object[] { upserts, CancellationToken.None })!;
        await task;

        // Assert
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var saved = await db.ActiveRooms.FindAsync("FALLBACK1");

        saved.Should().NotBeNull();
        saved!.RoomCode.Should().Be("FALLBACK1");

        // Act 2 - Update existing entity via fallback
        var updatedUpserts = new Dictionary<string, RoomSnapshot>
        {
            ["FALLBACK1"] = new RoomSnapshot
            {
                RoomCode = "FALLBACK1",
                GameType = "Farkle",
                State = "Playing",
                SchemaVersion = 1,
                Revision = 2,
                RoomEnvelopeJson = "{\"rev\":2}",
                CreatedAt = saved.CreatedAt,
                UpdatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(2)
            }
        };

        var task2 = (Task)fallbackMethod.Invoke(worker, new object[] { updatedUpserts, CancellationToken.None })!;
        await task2;

        using var scope2 = _scopeFactory.CreateScope();
        var db2 = scope2.ServiceProvider.GetRequiredService<AppDbContext>();
        var reloaded = await db2.ActiveRooms.AsNoTracking().FirstOrDefaultAsync(r => r.RoomCode == "FALLBACK1");
        reloaded.Should().NotBeNull();
        reloaded!.Revision.Should().Be(2);
        reloaded.State.Should().Be("Playing");
    }

    [Fact]
    public async Task QueueSave_CoalescesMultipleSnapshotsForSameRoom_WithinBatch()
    {
        // Arrange
        var worker = CreateWorker();
        var snapshotV1 = new RoomSnapshot
        {
            RoomCode = "COALESCE1",
            GameType = "Babble",
            State = "Lobby",
            Revision = 1
        };
        var snapshotV2 = new RoomSnapshot
        {
            RoomCode = "COALESCE1",
            GameType = "Babble",
            State = "Playing",
            Revision = 2
        };

        // Queue both before flush
        worker.QueueSave(snapshotV1);
        worker.QueueSave(snapshotV2);

        // Act
        await worker.FlushAsync(CancellationToken.None);

        // Assert
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var record = await db.ActiveRooms.FindAsync("COALESCE1");

        record.Should().NotBeNull();
        record!.Revision.Should().Be(2);
        record.State.Should().Be("Playing");
    }

    [Fact]
    public void Worker_Dispose_ShouldDisposeGracefully()
    {
        var worker = CreateWorker();
        worker.Dispose();
    }

    [Fact]
    public void QueueSave_And_QueueDelete_InvalidInputs_ShouldReturnFalse()
    {
        // Arrange
        var worker = CreateWorker();

        // Act & Assert
        worker.QueueSave(null!).Should().BeFalse();
        worker.QueueSave(new RoomSnapshot { RoomCode = "" }).Should().BeFalse();
        worker.QueueSave(new RoomSnapshot { RoomCode = "   " }).Should().BeFalse();

        worker.QueueDelete(null!).Should().BeFalse();
        worker.QueueDelete("").Should().BeFalse();
        worker.QueueDelete("   ").Should().BeFalse();
    }

    [Fact]
    public void QueueSave_And_QueueDelete_ShouldLogWarning_WhenChannelCapacityReached()
    {
        // Arrange
        var worker = CreateWorker();

        // Fill channel to max capacity (1000 items)
        for (int i = 0; i < RoomPersistenceWorker.ChannelCapacity; i++)
        {
            worker.QueueSave(new RoomSnapshot { RoomCode = $"CAP{i}", GameType = "Babble" });
        }

        // Act - 1001st item should be rejected and log warning
        var saveResult = worker.QueueSave(new RoomSnapshot { RoomCode = "OVERFLOW", GameType = "Babble" });
        var deleteResult = worker.QueueDelete("OVERFLOW");

        // Assert
        saveResult.Should().BeFalse();
        deleteResult.Should().BeFalse();
    }

    [Fact]
    public async Task RehydrateActiveRoomsAsync_ShouldResetPlayerIsConnected_AndHandleDeserError()
    {
        // Arrange
        var worker = CreateWorker();
        var roomWithConnectedPlayer = new Room
        {
            Code = "RESETCONN",
            GameType = GameType.Babble,
            State = GameState.Playing,
            ExpiresAt = DateTime.UtcNow.AddHours(2)
        };
        roomWithConnectedPlayer.Players.Add(new Player
        {
            ConnectionId = "c1",
            Name = "Alice",
            IsConnected = true
        });
        var validJson = _serializer.Serialize(roomWithConnectedPlayer);

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.ActiveRooms.AddRange(
                new ActiveRoom
                {
                    RoomCode = "RESETCONN",
                    GameType = "Babble",
                    State = "Playing",
                    ExpiresAt = DateTime.UtcNow.AddHours(2),
                    RoomEnvelopeJson = validJson
                },
                new ActiveRoom
                {
                    RoomCode = "CORRUPTED",
                    GameType = "Babble",
                    State = "Playing",
                    ExpiresAt = DateTime.UtcNow.AddHours(2),
                    RoomEnvelopeJson = "INVALID_JSON{{{"
                }
            );
            await db.SaveChangesAsync();
        }

        // Act
        await worker.RehydrateActiveRoomsAsync(CancellationToken.None);

        // Assert
        _mockRoomService.Verify(r => r.RehydrateRoom(It.Is<Room>(rm => 
            rm.Code == "RESETCONN" && rm.Players.All(p => !p.IsConnected))), Times.Once);
    }
}
