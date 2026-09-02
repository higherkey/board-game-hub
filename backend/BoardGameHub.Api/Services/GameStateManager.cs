using System.Collections.Concurrent;
using System.Collections.Frozen;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading.Channels;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace BoardGameHub.Api.Services;

public class GameStateManager : IHostedService, IDisposable
{
    private readonly IHubContext<GameHub> _hubContext;
    private readonly StateDiffService _diffService;
    private readonly ILogger<GameStateManager> _logger;
    private readonly IRoomPersistenceService? _persistenceService;
    private readonly IRoomStateSerializer? _serializer;

    // The "Live" state. Modified by Game Services.
    private readonly ConcurrentDictionary<string, Room> _activeRooms = new();

    // The "Last Broadcasted" state (Snapshot). Used for diffing.
    // Storing as JsonNode to ensure we capture the serialized form exactly as sent.
    private readonly ConcurrentDictionary<string, JsonNode> _lastSnapshots = new();

    // Set of "Dirty" room codes that need a broadcast
    private readonly ConcurrentDictionary<string, bool> _dirtyRooms = new();

    // Unbounded channel for high-throughput event-driven room state updates
    private readonly Channel<string> _channel = Channel.CreateUnbounded<string>(new UnboundedChannelOptions
    {
        SingleReader = false,
        SingleWriter = false
    });

    private CancellationTokenSource? _cts;
    private Task? _processingTask;

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(namingPolicy: null) }
    };

    // Compiled O(1) property accessors to eliminate runtime reflection in the hot diff path (resolves #87)
    private static readonly FrozenDictionary<string, (string CamelKey, Func<Room, object?> Getter)> _propertyAccessors =
        new Dictionary<string, (string CamelKey, Func<Room, object?> Getter)>(StringComparer.OrdinalIgnoreCase)
        {
            [nameof(Room.Code)] = ("code", r => r.Code),
            [nameof(Room.Players)] = ("players", r => r.Players),
            [nameof(Room.State)] = ("state", r => r.State),
            [nameof(Room.Settings)] = ("settings", r => r.Settings),
            [nameof(Room.GameType)] = ("gameType", r => r.GameType),
            [nameof(Room.IsPublic)] = ("isPublic", r => r.IsPublic),
            [nameof(Room.HostScreenId)] = ("hostScreenId", r => r.HostScreenId),
            [nameof(Room.HostPlayerId)] = ("hostPlayerId", r => r.HostPlayerId),
            [nameof(Room.CreatorConnectionId)] = ("creatorConnectionId", r => r.CreatorConnectionId),
            [nameof(Room.IsHostOverride)] = ("isHostOverride", r => r.IsHostOverride),
            [nameof(Room.GameData)] = ("gameData", r => r.GameData),
            [nameof(Room.RoundNumber)] = ("roundNumber", r => r.RoundNumber),
            [nameof(Room.NextGameVotes)] = ("nextGameVotes", r => r.NextGameVotes),
            [nameof(Room.RoundEndTime)] = ("roundEndTime", r => r.RoundEndTime),
            [nameof(Room.IsPaused)] = ("isPaused", r => r.IsPaused),
            [nameof(Room.TimeRemainingWhenPaused)] = ("timeRemainingWhenPaused", r => r.TimeRemainingWhenPaused),
            [nameof(Room.PlayerAnswers)] = ("playerAnswers", r => r.PlayerAnswers),
            [nameof(Room.RoundScores)] = ("roundScores", r => r.RoundScores),
            [nameof(Room.UndoSettings)] = ("undoSettings", r => r.UndoSettings),
            [nameof(Room.CurrentVote)] = ("currentVote", r => r.CurrentVote)
        }.ToFrozenDictionary(StringComparer.OrdinalIgnoreCase);

    public GameStateManager(
        IHubContext<GameHub> hubContext, 
        StateDiffService diffService,
        ILogger<GameStateManager> logger)
        : this(hubContext, diffService, logger, null, null)
    {
    }

    public GameStateManager(
        IHubContext<GameHub> hubContext, 
        StateDiffService diffService,
        ILogger<GameStateManager> logger,
        IRoomPersistenceService? persistenceService,
        IRoomStateSerializer? serializer)
    {
        _hubContext = hubContext;
        _diffService = diffService;
        _logger = logger;
        _persistenceService = persistenceService;
        _serializer = serializer;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _cts = new CancellationTokenSource();
        _processingTask = Task.Run(() => ProcessChannelAsync(_cts.Token), CancellationToken.None);
        _logger.LogInformation("GameStateManager Event-Driven Loop Started.");
        return Task.CompletedTask;
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
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
                _logger.LogWarning(ex, "Exception while awaiting GameStateManager task during StopAsync.");
            }
        }

        _logger.LogInformation("GameStateManager Event-Driven Loop Stopped.");
    }

    public void TrackRoom(Room room)
    {
        _activeRooms.AddOrUpdate(room.Code, room, (key, oldValue) => room);
        MarkDirty(room.Code);
    }

    public void UntrackRoom(string roomCode)
    {
        _activeRooms.TryRemove(roomCode, out _);
        _lastSnapshots.TryRemove(roomCode, out _);
        _dirtyRooms.TryRemove(roomCode, out _);
    }

    public Room? GetRoom(string roomCode)
    {
        _activeRooms.TryGetValue(roomCode, out var room);
        return room;
    }

    public void MarkDirty(string roomCode, string? member = null)
    {
        _dirtyRooms.TryAdd(roomCode, true);
        
        if (_activeRooms.TryGetValue(roomCode, out var room))
        {
            room.Revision++;
            room.UpdatedAt = DateTime.UtcNow;
            room.ExpiresAt = DateTime.UtcNow.AddHours(4);

            if (member != null)
            {
                room.DirtyMembers.TryAdd(member, 0);
            }
            else
            {
                // Null member -> Force full diff
                room.DirtyMembers.TryAdd("ALL", 0);
            }
        }

        // Non-blocking channel push for event-driven dispatching
        _channel.Writer.TryWrite(roomCode);
    }

    private async Task ProcessChannelAsync(CancellationToken ct)
    {
        try
        {
            while (await _channel.Reader.WaitToReadAsync(ct))
            {
                while (_channel.Reader.TryRead(out var roomCode))
                {
                    if (ct.IsCancellationRequested) break;
                    await ProcessRoomUpdateAsync(roomCode, ct);
                }
            }
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Clean shutdown
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in GameStateManager Channel processing loop");
        }
    }

    internal async Task ProcessRoomUpdateAsync(string roomCode, CancellationToken ct = default)
    {
        try 
        {
            if (!_activeRooms.TryGetValue(roomCode, out var liveRoom))
            {
                _dirtyRooms.TryRemove(roomCode, out _);
                return;
            }

            _dirtyRooms.TryRemove(roomCode, out _);

            // Check Dirty Members - Extract and clear atomically
            var dirtyMembers = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (var key in liveRoom.DirtyMembers.Keys)
            {
                if (liveRoom.DirtyMembers.TryRemove(key, out _))
                {
                    dirtyMembers.Add(key);
                }
            }

            // If no specific members tracked, OR "ALL" is present, do Full Diff
            bool fullDiff = dirtyMembers.Count == 0 || dirtyMembers.Contains("ALL");

            JsonNode? patch = null;
            RoomSnapshot? snapshot = null;
            _lastSnapshots.TryGetValue(roomCode, out var lastJson);

            if (fullDiff)
            {
                // --- FULL SERIALIZATION (Fallback / Baseline) ---
                JsonNode? currentJson;
                await liveRoom.StateLock.WaitAsync(ct);
                try
                {
                    currentJson = JsonSerializer.SerializeToNode(liveRoom, _jsonOptions);
                    if (_persistenceService != null && _serializer != null)
                    {
                        snapshot = new RoomSnapshot
                        {
                            RoomCode = liveRoom.Code,
                            GameType = liveRoom.GameType.ToString(),
                            State = liveRoom.State.ToString(),
                            SchemaVersion = 1,
                            Revision = liveRoom.Revision,
                            RoomEnvelopeJson = _serializer.Serialize(liveRoom),
                            CreatedAt = liveRoom.CreatedAt,
                            UpdatedAt = liveRoom.UpdatedAt,
                            ExpiresAt = liveRoom.ExpiresAt
                        };
                    }
                }
                finally
                {
                    liveRoom.StateLock.Release();
                }
                
                if (currentJson == null) return;

                patch = _diffService.GetDiff(lastJson, currentJson);
                
                if (patch != null) _lastSnapshots[roomCode] = currentJson;
            }
            else
            {
                // --- PARTIAL SERIALIZATION (Zero-Reflection Fast Path) ---
                if (lastJson == null)
                {
                    // No baseline snapshot -> fallback to full serialization
                    JsonNode? currentJson;
                    await liveRoom.StateLock.WaitAsync(ct);
                    try
                    {
                        currentJson = JsonSerializer.SerializeToNode(liveRoom, _jsonOptions);
                        if (_persistenceService != null && _serializer != null)
                        {
                            snapshot = new RoomSnapshot
                            {
                                RoomCode = liveRoom.Code,
                                GameType = liveRoom.GameType.ToString(),
                                State = liveRoom.State.ToString(),
                                SchemaVersion = 1,
                                Revision = liveRoom.Revision,
                                RoomEnvelopeJson = _serializer.Serialize(liveRoom),
                                CreatedAt = liveRoom.CreatedAt,
                                UpdatedAt = liveRoom.UpdatedAt,
                                ExpiresAt = liveRoom.ExpiresAt
                            };
                        }
                    }
                    finally { liveRoom.StateLock.Release(); }
                    if (currentJson == null) return;
                    _lastSnapshots[roomCode] = currentJson;
                    patch = currentJson;
                }
                else
                {
                    var patchObj = new JsonObject();
                    await liveRoom.StateLock.WaitAsync(ct);
                    try
                    {
                        if (_persistenceService != null && _serializer != null)
                        {
                            snapshot = new RoomSnapshot
                            {
                                RoomCode = liveRoom.Code,
                                GameType = liveRoom.GameType.ToString(),
                                State = liveRoom.State.ToString(),
                                SchemaVersion = 1,
                                Revision = liveRoom.Revision,
                                RoomEnvelopeJson = _serializer.Serialize(liveRoom),
                                CreatedAt = liveRoom.CreatedAt,
                                UpdatedAt = liveRoom.UpdatedAt,
                                ExpiresAt = liveRoom.ExpiresAt
                            };
                        }

                        foreach (var member in dirtyMembers)
                        {
                            if (_propertyAccessors.TryGetValue(member, out var accessor))
                            {
                                var val = accessor.Getter(liveRoom);
                                var key = accessor.CamelKey;
                                var valNode = JsonSerializer.SerializeToNode(val, _jsonOptions);
                                
                                var oldVal = lastJson[key];
                                var partialDiff = _diffService.GetDiff(oldVal, valNode);
                                
                                if (partialDiff != null)
                                {
                                    patchObj[key] = partialDiff;
                                    if (lastJson is JsonObject oldObj)
                                    {
                                        oldObj[key] = valNode; 
                                    }
                                }
                            }
                            else
                            {
                                // Unknown custom member fallback
                                var propInfo = typeof(Room).GetProperty(member);
                                if (propInfo != null)
                                {
                                    var val = propInfo.GetValue(liveRoom);
                                    var key = JsonNamingPolicy.CamelCase.ConvertName(member);
                                    var valNode = JsonSerializer.SerializeToNode(val, _jsonOptions);
                                    var oldVal = lastJson[key];
                                    var partialDiff = _diffService.GetDiff(oldVal, valNode);
                                    if (partialDiff != null)
                                    {
                                        patchObj[key] = partialDiff;
                                        if (lastJson is JsonObject oldObj)
                                        {
                                            oldObj[key] = valNode;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    finally
                    {
                        liveRoom.StateLock.Release();
                    }
                    
                    if (patchObj.Count > 0) patch = patchObj;
                }
            }

            if (patch != null)
            {
                await _hubContext.Clients.Group(roomCode.ToUpper()).SendAsync("RoomStatePatch", patch, ct);
            }

            if (snapshot != null)
            {
                _persistenceService?.QueueSave(snapshot);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing room update for room {RoomCode}", roomCode);
        }
    }

    public void Dispose()
    {
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
    }
}
