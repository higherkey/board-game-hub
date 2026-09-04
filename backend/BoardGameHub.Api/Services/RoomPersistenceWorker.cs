using System.Threading.Channels;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace BoardGameHub.Api.Services;

public class RoomPersistenceWorker : IHostedService, IRoomPersistenceService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IRoomService? _roomService;
    private readonly GameStateManager? _gameStateManager;
    private readonly IRoomStateSerializer _serializer;
    private readonly IEnumerable<IGameService> _gameServices;
    private readonly ILogger<RoomPersistenceWorker> _logger;

    private readonly Channel<RoomPersistenceMessage> _channel;
    private CancellationTokenSource? _cts;
    private Task? _processingTask;
    private Timer? _cleanupTimer;
    private int _isCleaningUp = 0;

    public const int ChannelCapacity = 10_000;
    public const int BatchSize = 100;
    public const int CleanupIntervalSeconds = 60;

    [ActivatorUtilitiesConstructor]
    public RoomPersistenceWorker(
        IServiceScopeFactory scopeFactory,
        IRoomStateSerializer serializer,
        IEnumerable<IGameService> gameServices,
        ILogger<RoomPersistenceWorker> logger)
    {
        _scopeFactory = scopeFactory;
        _roomService = null;
        _gameStateManager = null;
        _serializer = serializer;
        _gameServices = gameServices;
        _logger = logger;

        _channel = Channel.CreateBounded<RoomPersistenceMessage>(new BoundedChannelOptions(ChannelCapacity)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });
    }

    public RoomPersistenceWorker(
        IServiceScopeFactory scopeFactory,
        IRoomService roomService,
        GameStateManager gameStateManager,
        IRoomStateSerializer serializer,
        IEnumerable<IGameService> gameServices,
        ILogger<RoomPersistenceWorker> logger)
        : this(scopeFactory, serializer, gameServices, logger)
    {
        _roomService = roomService;
        _gameStateManager = gameStateManager;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RoomPersistenceWorker is starting.");

        // 1. Cold Boot Hydration
        try
        {
            await RehydrateActiveRoomsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed during cold boot active room rehydration.");
        }

        // 2. Start Background Consumer Loop
        _cts = new CancellationTokenSource();
        _processingTask = Task.Run(() => ProcessChannelLoopAsync(_cts.Token), CancellationToken.None);

        // 3. Start Periodic Cleanup Timer
        _cleanupTimer = new Timer(static state =>
        {
            if (state is RoomPersistenceWorker self)
            {
                _ = self.RunPeriodicCleanupAsync();
            }
        }, this, TimeSpan.FromSeconds(CleanupIntervalSeconds), TimeSpan.FromSeconds(CleanupIntervalSeconds));

        _logger.LogInformation("RoomPersistenceWorker started successfully.");
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RoomPersistenceWorker is stopping.");

        _cleanupTimer?.Change(Timeout.Infinite, 0);

        _channel.Writer.TryComplete();

        if (_cts != null && !_cts.IsCancellationRequested)
        {
            try
            {
                await _cts.CancelAsync();
            }
            catch (ObjectDisposedException) { }
        }

        if (_processingTask != null)
        {
            try
            {
                await _processingTask.WaitAsync(cancellationToken);
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Exception while awaiting RoomPersistenceWorker task during StopAsync.");
            }
        }

        // Final flush of any pending messages
        try
        {
            await FlushPendingMessagesAsync(CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while flushing active room persistence messages during stop.");
        }

        _logger.LogInformation("RoomPersistenceWorker stopped.");
    }

    public bool QueueSave(RoomSnapshot snapshot)
    {
        if (snapshot == null || string.IsNullOrWhiteSpace(snapshot.RoomCode)) return false;
        var written = _channel.Writer.TryWrite(RoomPersistenceMessage.Upsert(snapshot));
        if (!written)
        {
            var sanitizedRoomCode = System.Text.RegularExpressions.Regex.Replace(snapshot.RoomCode ?? string.Empty, @"[\r\n\x00-\x1F\x7F]", " ");
            _logger.LogWarning(
                "RoomPersistenceWorker channel full (capacity {Capacity}): dropped save for room {RoomCode} at revision {Revision}. Consumer may be lagging.",
                ChannelCapacity, sanitizedRoomCode, snapshot.Revision);
        }
        return written;
    }

    public bool QueueDelete(string roomCode)
    {
        if (string.IsNullOrWhiteSpace(roomCode)) return false;
        var written = _channel.Writer.TryWrite(RoomPersistenceMessage.Delete(roomCode.ToUpperInvariant()));
        if (!written)
        {
            var sanitizedRoomCode = System.Text.RegularExpressions.Regex.Replace(roomCode ?? string.Empty, @"[\r\n\x00-\x1F\x7F]", " ");
            _logger.LogWarning(
                "RoomPersistenceWorker channel full (capacity {Capacity}): dropped delete for room {RoomCode}. Consumer may be lagging.",
                ChannelCapacity, sanitizedRoomCode);
        }
        return written;
    }

    public async Task RehydrateActiveRoomsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var roomService = _roomService ?? scope.ServiceProvider.GetRequiredService<IRoomService>();
            var gameStateManager = _gameStateManager ?? scope.ServiceProvider.GetRequiredService<GameStateManager>();

            var now = DateTime.UtcNow;
            var activeRooms = await db.ActiveRooms
                .AsNoTracking()
                .Where(r => r.ExpiresAt > now)
                .ToListAsync(cancellationToken);

            int rehydratedCount = 0;
            foreach (var entity in activeRooms)
            {
                try
                {
                    var room = _serializer.Deserialize(entity.RoomEnvelopeJson, _gameServices);
                    room.Revision = entity.Revision;
                    room.CreatedAt = entity.CreatedAt;
                    room.UpdatedAt = entity.UpdatedAt;
                    room.ExpiresAt = entity.ExpiresAt;

                    // Reset player active socket connection flags on cold boot
                    foreach (var player in room.Players)
                    {
                        player.IsConnected = false;
                    }

                    roomService.RehydrateRoom(room);
                    gameStateManager.TrackRoom(room);
                    rehydratedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to rehydrate room {RoomCode} from database envelope.", entity.RoomCode);
                }
            }

            _logger.LogInformation("Rehydrated {Count} active rooms from PostgreSQL.", rehydratedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while querying active rooms for rehydration.");
        }
    }

    public async Task CleanupExpiredRoomsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var roomService = _roomService ?? scope.ServiceProvider.GetRequiredService<IRoomService>();

            var now = DateTime.UtcNow;

            // Load expired entities for eviction and removal.
            // TODO: Replace with ExecuteDeleteAsync once EF InMemory is retired from test infrastructure
            // (ExecuteDeleteAsync is unsupported by the InMemory provider).
            var expiredRooms = await db.ActiveRooms
                .Where(r => r.ExpiresAt <= now)
                .ToListAsync(cancellationToken);

            if (expiredRooms.Count == 0) return;

            db.ActiveRooms.RemoveRange(expiredRooms);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var expired in expiredRooms)
            {
                roomService.EvictRoom(expired.RoomCode);
            }

            _logger.LogInformation("Pruned {Count} expired active rooms from PostgreSQL and memory.", expiredRooms.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while cleaning up expired active rooms.");
        }
    }

    public async Task FlushAsync(CancellationToken cancellationToken = default)
    {
        await FlushPendingMessagesAsync(cancellationToken);
    }

    private async Task RunPeriodicCleanupAsync()
    {
        if (Interlocked.CompareExchange(ref _isCleaningUp, 1, 0) != 0) return;

        try
        {
            await CleanupExpiredRoomsAsync(_cts?.Token ?? CancellationToken.None);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during periodic TTL cleanup of active rooms.");
        }
        finally
        {
            Interlocked.Exchange(ref _isCleaningUp, 0);
        }
    }

    private async Task ProcessChannelLoopAsync(CancellationToken ct)
    {
        try
        {
            while (await _channel.Reader.WaitToReadAsync(ct))
            {
                await FlushPendingMessagesAsync(ct);
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Clean exit
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in RoomPersistenceWorker Channel loop.");
        }
    }

    private async Task FlushPendingMessagesAsync(CancellationToken ct)
    {
        var batch = new List<RoomPersistenceMessage>();
        while (batch.Count < BatchSize && _channel.Reader.TryRead(out var msg))
        {
            batch.Add(msg);
        }

        if (batch.Count == 0) return;

        // Coalesce messages by RoomCode
        var upserts = new Dictionary<string, RoomSnapshot>(StringComparer.OrdinalIgnoreCase);
        var deletes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var msg in batch)
        {
            var code = msg.RoomCode.ToUpperInvariant();
            if (msg.Action == RoomPersistenceAction.Delete)
            {
                deletes.Add(code);
                upserts.Remove(code);
            }
            else if (msg.Action == RoomPersistenceAction.Upsert && msg.Snapshot != null)
            {
                deletes.Remove(code);
                if (upserts.TryGetValue(code, out var existingSnapshot))
                {
                    if (msg.Snapshot.Revision >= existingSnapshot.Revision)
                    {
                        upserts[code] = msg.Snapshot;
                    }
                }
                else
                {
                    upserts[code] = msg.Snapshot;
                }
            }
        }

        if (upserts.Count == 0 && deletes.Count == 0) return;

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Handle Deletions
            if (deletes.Count > 0)
            {
                var entitiesToDelete = await db.ActiveRooms
                    .Where(r => deletes.Contains(r.RoomCode))
                    .ToListAsync(ct);

                if (entitiesToDelete.Count > 0)
                {
                    db.ActiveRooms.RemoveRange(entitiesToDelete);
                }
            }

            // Handle Upserts
            if (upserts.Count > 0)
            {
                var roomCodes = upserts.Keys.ToList();
                var existingList = await db.ActiveRooms
                    .Where(r => roomCodes.Contains(r.RoomCode))
                    .ToListAsync(ct);
                var existingEntities = existingList.ToDictionary(r => r.RoomCode, StringComparer.OrdinalIgnoreCase);

                foreach (var (code, snapshot) in upserts)
                {
                    if (existingEntities.TryGetValue(code, out var entity))
                    {
                        // Monotonic revision check: only apply updates with strictly higher revision
                        if (snapshot.Revision > entity.Revision)
                        {
                            entity.GameType = snapshot.GameType;
                            entity.State = snapshot.State;
                            entity.SchemaVersion = snapshot.SchemaVersion;
                            entity.Revision = snapshot.Revision;
                            entity.RoomEnvelopeJson = snapshot.RoomEnvelopeJson;
                            entity.UpdatedAt = snapshot.UpdatedAt;
                            entity.ExpiresAt = snapshot.ExpiresAt;
                        }
                    }
                    else
                    {
                        db.ActiveRooms.Add(new ActiveRoom
                        {
                            RoomCode = snapshot.RoomCode.ToUpperInvariant(),
                            GameType = snapshot.GameType,
                            State = snapshot.State,
                            SchemaVersion = snapshot.SchemaVersion,
                            Revision = snapshot.Revision,
                            RoomEnvelopeJson = snapshot.RoomEnvelopeJson,
                            CreatedAt = snapshot.CreatedAt,
                            UpdatedAt = snapshot.UpdatedAt,
                            ExpiresAt = snapshot.ExpiresAt
                        });
                    }
                }
            }

            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateConcurrencyException cex)
        {
            _logger.LogWarning(cex, "Optimistic concurrency conflict while saving active room batch.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to persist active room batch to PostgreSQL.");
        }
    }

    public void Dispose()
    {
        _cleanupTimer?.Dispose();
        if (_cts != null)
        {
            try
            {
                if (!_cts.IsCancellationRequested)
                {
                    _cts.Cancel();
                }
                _cts.Dispose();
            }
            catch (ObjectDisposedException) { }
            _cts = null;
        }
        GC.SuppressFinalize(this);
    }
}
