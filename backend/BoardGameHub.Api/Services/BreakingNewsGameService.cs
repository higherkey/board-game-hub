using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class BreakingNewsState
{
    public string AnchorConnectionId { get; set; } = string.Empty;
    public string ScriptTitle { get; set; } = string.Empty;
    // The full raw text with placeholders like {0}, {1}
    public string ScriptTemplate { get; set; } = string.Empty;
    
    // Ordered list of slots that writers need to fill
    public List<ScriptSlot> Slots { get; set; } = new();

    // Mapping of slot index to the Player who "owns" it (for writing)
    // Multiple players might own the same slot if we want chaos, or we round-robin.
    public Dictionary<int, string> SlotOwners { get; set; } = new();
}

public class ScriptSlot
{
    public int Id { get; set; }
    public string Type { get; set; } = "Noun"; // Noun, Adjective, Verb, etc.
    public string CurrentValue { get; set; } = string.Empty;
    public bool IsLocked { get; set; } = false;
    public string LastEditedBy { get; set; } = string.Empty;
}

public class BreakingNewsGameService : IGameService
{
    public GameType GameType => GameType.BreakingNews;

    public void StartRound(Room room, GameSettings settings)
    {
        var state = new BreakingNewsState();

        // 1. Assign Anchor (Round Robin or Random)
        // For simplicity, pick random or iterate based on RoundNumber if mapped
        // Let's rely on the Client/SignalR to tell us who the Anchor is? 
        // Or better: The server picks.
        if (room.Players.Any())
        {
            var anchorIndex = room.RoundNumber % room.Players.Count;
            state.AnchorConnectionId = room.Players[anchorIndex].ConnectionId;
        }

        // 2. Load Script
        // Hardcoded for now.
        var script = GetRandomScript();
        state.ScriptTitle = script.Title;
        state.ScriptTemplate = script.Template;
        state.Slots = script.Slots.Select(s => new ScriptSlot 
        { 
            Id = s.Id, 
            Type = s.Type, 
            CurrentValue = "______" // Placeholder
        }).ToList();

        // 3. Assign Slots to Writers (All players except Anchor)
        var writers = room.Players.Where(p => p.ConnectionId != state.AnchorConnectionId).ToList();
        if (writers.Any())
        {
            // Assign every slot to a random writer, or round robin?
            // "Real-time" means multiple people might fight over slots, or they have dedicated ones.
            // Design Doc says "Writers see upcoming slots".
            // Let's assign specific slots to specific writers to prevent total collision chaos for MVP.
            for (int i = 0; i < state.Slots.Count; i++)
            {
                var writer = writers[i % writers.Count];
                state.SlotOwners[i] = writer.ConnectionId;
            }
        }

        room.GameData = state;
    }

    public void CalculateScores(Room room)
    {
        // Handled by voting phase usually, but standard simple implementation required by interface
        // We can leave this empty or implement simple "1 point for playing" logic
        if (room.GameData is not BreakingNewsState state) return;

        // Maybe give points to the Anchor if they finished?
        // Implementation pending "Voting" feature.
    }

    public bool UpdateSlot(Room room, int slotId, string value, string connectionId)
    {
        if (room.GameData is not BreakingNewsState state) return false;

        // Verify slot/owner
        if (slotId < 0 || slotId >= state.Slots.Count) return false;

        // Optional: Check if player owns this slot
        // For chaos mode, maybe allow anyone? Design doc said "assigned slots".
        if (state.SlotOwners.TryGetValue(slotId, out var ownerId))
        {
            if (ownerId != connectionId) return false; // Not your slot
        }

        var slot = state.Slots[slotId];
        if (slot.IsLocked) return false; 

        slot.CurrentValue = value;
        slot.LastEditedBy = connectionId;

        return true;
    }

    private (string Title, string Template, List<(int Id, string Type)> Slots) GetRandomScript()
    {
        // Simple Template
        return (
            "The Weather Report",
            "Good evening. I'm your host, and here is tonight's {0} weather forecast. To start, we have a massive front of {1} pressure moving in from the {2}. This will cause significant {3} in the lower valleys.",
            new List<(int, string)>
            {
                (0, "Adjective"),
                (1, "Adjective"),
                (2, "Cardinal Direction"),
                (3, "Plural Noun")
            }
        );
    }
}
