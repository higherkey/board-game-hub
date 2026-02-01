using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Nodes;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.SignalR;

namespace BoardGameHub.Api.Services;

public class GameStateManager
{
    private readonly IHubContext<GameHub> _hubContext;
    private readonly StateDiffService _diffService;
    private readonly ILogger<GameStateManager> _logger;

    // The "Live" state. Modified by Game Services.
    private readonly ConcurrentDictionary<string, Room> _activeRooms = new();

    // The "Last Broadcasted" state (Snapshot). Used for diffing.
    // Storing as JsonNode to ensure we capture the serialized form exactly as sent.
    private readonly ConcurrentDictionary<string, JsonNode> _lastSnapshots = new();

    // Set of "Dirty" room codes that need a broadcast
    private readonly ConcurrentDictionary<string, bool> _dirtyRooms = new();

    private Timer? _tickTimer;
    private const int TickRateMs = 50; // 20 ticks/sec

    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter(namingPolicy: null) }
    };

    public GameStateManager(
        IHubContext<GameHub> hubContext, 
        StateDiffService diffService,
        ILogger<GameStateManager> logger)
    {
        _hubContext = hubContext;
        _diffService = diffService;
        _logger = logger;
    }

    public void StartGameLoop()
    {
        _tickTimer = new Timer(async _ => await GameTick(), null, TickRateMs, TickRateMs);
        _logger.LogInformation("GameStateManager Game Loop Started.");
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
        // If we want to track specific members, we need to access the room and add to its set.
        // But referencing the room here implies a lock? 
        // Actually, MarkDirty is called FROM RoomService, which usually holds a lock.
        // However, this method just sets a flag.
        
        // Strategy:
        // 1. If 'member' is null, it means "Something changed, I don't know what" -> Full Diff.
        // 2. If 'member' is provided, we assume the caller has put it in Room.DirtyMembers?
        //    OR we do it here. Doing it here requires looking up the room.
        
        _dirtyRooms.TryAdd(roomCode, true);
        
        if (member != null)
        {
            if (_activeRooms.TryGetValue(roomCode, out var room))
            {
                // We don't lock here to avoid deadlock risks if caller already has lock?
                // But DirtyMembers is not thread safe? 
                // Actually HashSet isn't thread safe. 
                // Caller (RoomService) SHOULD have locked the StateLock.
                // But MarkDirty might be called from outside lock?
                // Let's rely on RoomService protecting this.
                lock(room.DirtyMembers) 
                {
                    room.DirtyMembers.Add(member);
                }
            }
        }
        else
        {
             // Null member -> Force full diff? 
             if (_activeRooms.TryGetValue(roomCode, out var room))
             {
                 lock(room.DirtyMembers)
                 {
                     room.DirtyMembers.Add("ALL");
                 }
             }
        }
    }

    private async Task GameTick()
    {
        // Snapshot the dirty list keys to avoid contentions
        var dirtyCodes = _dirtyRooms.Keys.ToList();
        
        var parallelOptions = new ParallelOptions { MaxDegreeOfParallelism = Environment.ProcessorCount * 2 };
        
        await Parallel.ForEachAsync(dirtyCodes, parallelOptions, async (roomCode, ct) =>
        {
            try 
            {
                if (!_activeRooms.TryGetValue(roomCode, out var liveRoom))
                {
                    _dirtyRooms.TryRemove(roomCode, out _);
                    return;
                }

                _dirtyRooms.TryRemove(roomCode, out _);

                // Check Dirty Members
                HashSet<string> dirtyMembers;
                lock (liveRoom.DirtyMembers)
                {
                    dirtyMembers = new HashSet<string>(liveRoom.DirtyMembers);
                    liveRoom.DirtyMembers.Clear();
                }

                // If no specific members tracked, OR "ALL" is present, do Full Diff
                bool fullDiff = dirtyMembers.Count == 0 || dirtyMembers.Contains("ALL");

                JsonNode? patch = null;
                JsonNode? lastJson = null;
                _lastSnapshots.TryGetValue(roomCode, out lastJson);

                if (fullDiff)
                {
                    // --- FULL SERIALIZATION (Fallback) ---
                    JsonNode? currentJson;
                    await liveRoom.StateLock.WaitAsync(ct);
                    try
                    {
                        currentJson = JsonSerializer.SerializeToNode(liveRoom, _jsonOptions);
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
                    // --- PARTIAL SERIALIZATION (Optimization) ---
                    // We only serialize the properties that changed.
                    // And we construct the patch manually from those diffs.
                    // We ALSO need to update _lastSnapshots with the new values.
                    
                    // Ensure we have a base snapshot
                    if (lastJson == null)
                    {
                        // No previous snapshot? Must do full diff first to establish baseline.
                        // Recursively force full diff logic (simplest way is to just fall through, but let's copy-paste for safety or refactor)
                        // Actually, if lastJson is null, we can't do partial diff.
                        // Fallback to Full.
                        JsonNode? currentJson;
                        await liveRoom.StateLock.WaitAsync(ct);
                        try { currentJson = JsonSerializer.SerializeToNode(liveRoom, _jsonOptions); }
                        finally { liveRoom.StateLock.Release(); }
                        if (currentJson == null) return;
                        _lastSnapshots[roomCode] = currentJson;
                        patch = currentJson; // First send is full state? Or Diff(null, curr).
                    }
                    else
                    {
                        var patchObj = new JsonObject();
                        // We need the lock to read properties safely
                        await liveRoom.StateLock.WaitAsync(ct);
                        try
                        {
                           foreach(var member in dirtyMembers)
                           {
                               // Reflection or known switch? Reflection is slow. 
                               // Switch is fast but brittle.
                               // Use JsonSerializer on the property?
                               // GetProperty via Reflection is fast enough for 5-10 properties compared to full serialize.
                               // Actually, `liveRoom` is a POCO.
                               var propInfo = typeof(Room).GetProperty(member);
                               if (propInfo != null)
                               {
                                   var val = propInfo.GetValue(liveRoom);
                                   var key = JsonNamingPolicy.CamelCase.ConvertName(member); 
                                   
                                   var valNode = JsonSerializer.SerializeToNode(val, _jsonOptions);
                                   
                                   // Diff against old (Snapshot keys are already camelCased IF we did a full diff, 
                                   // but partial diffs need to be consistent)
                                   var oldVal = lastJson[key]; 
                                   var partialDiff = _diffService.GetDiff(oldVal, valNode);
                                   
                                   if (partialDiff != null)
                                   {
                                       patchObj[key] = partialDiff;
                                       // Update Snapshot Cache immediately
                                       // Note: lastJson is a reference to the Node in the dictionary.
                                       // Modifying it updates the "Snapshot".
                                       if (lastJson is JsonObject oldObj)
                                       {
                                           oldObj[key] = valNode; 
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
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GameTick for room {RoomCode}", roomCode);
            }
        });
    }
}
