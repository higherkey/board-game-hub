using System.Collections.Concurrent;
using System.Text.Json;
using BoardGameHub.Api.Models;
using Microsoft.Extensions.Logging;

namespace BoardGameHub.Api.Services;

/// <summary>Clover-Minded (inspired by So Clover!) — cooperative word association.</summary>
public class CloverMindedGameService : IGameService
{
    private readonly ILogger<CloverMindedGameService> _logger;
    private readonly Random _rng = new();
    private readonly ConcurrentDictionary<string, Dictionary<string, string[]>> _privateClues = new();
    private readonly ConcurrentDictionary<string, CloverRoundSolution> _roundSolutions = new();

    public GameType GameType => GameType.CloverMinded;

    public CloverMindedGameService(ILogger<CloverMindedGameService> logger)
    {
        _logger = logger;
    }

    public Task StartRound(Room room, GameSettings settings)
    {
        room.Settings.CloverAllowPerPlayerSingleCardRotation = settings.CloverAllowPerPlayerSingleCardRotation;
        if (room.Settings.TimerDurationSeconds < 600)
            room.Settings.TimerDurationSeconds = 3600;

        _privateClues.TryRemove(room.Code, out _);
        _roundSolutions.TryRemove(room.Code, out _);

        var participants = room.Players.Where(p => !p.IsScreen).ToList();
        if (participants.Count < 2)
        {
            room.GameData = new CloverMindedState
            {
                Phase = CloverMindedPhase.GameOver.ToString(),
                Message = "Need at least two Hand players (join without Table-only mode).",
                ParticipantIds = participants.Select(p => p.ConnectionId).ToList()
            };
            return Task.CompletedTask;
        }

        var state = new CloverMindedState
        {
            Phase = CloverMindedPhase.ClueWriting.ToString(),
            ParticipantIds = participants.Select(p => p.ConnectionId).ToList(),
            ClueSubmitted = participants.ToDictionary(p => p.ConnectionId, _ => false),
            PrepByPlayer = new Dictionary<string, CloverPlayerPrep>(),
            RotationCardIdByPlayerThisAttempt = participants.ToDictionary(p => p.ConnectionId, _ => (string?)null),
            TotalScore = 0
        };

        foreach (var p in participants)
        {
            var prep = BuildPlayerPrep(p.Name, p.ConnectionId);
            state.PrepByPlayer[p.ConnectionId] = prep;
        }

        room.GameData = state;
        _logger.LogInformation("Clover-Minded started in room {Code} with {Count} players", room.Code, participants.Count);
        return Task.CompletedTask;
    }

    private CloverPlayerPrep BuildPlayerPrep(string name, string connectionId)
    {
        var words = PickWords(20);
        var cards = new List<CloverCardModel>();
        for (var i = 0; i < 4; i++)
        {
            var chunk = words.Skip(i * 4).Take(4).ToArray();
            cards.Add(new CloverCardModel
            {
                Id = $"c-{Guid.NewGuid():N}"[..12],
                Words = chunk
            });
        }

        var perm = Enumerable.Range(0, 4).OrderBy(_ => _rng.Next()).ToArray();
        var rot = Enumerable.Range(0, 4).Select(_ => _rng.Next(4)).ToArray();

        var pairWords = new string[4][];
        for (var i = 0; i < 4; i++)
        {
            var (a, b) = CloverGeometry.PairEdgeIndices(i);
            var wA = GetWord(cards[perm[i]], rot[i], a);
            var wB = GetWord(cards[perm[(i + 1) % 4]], rot[(i + 1) % 4], b);
            pairWords[i] = new[] { wA, wB };
        }

        return new CloverPlayerPrep
        {
            ConnectionId = connectionId,
            Name = name,
            Cards = cards,
            SlotPermutation = perm,
            SlotRotations = rot,
            PairWords = pairWords
        };
    }

    private static string GetWord(CloverCardModel card, int rotation, int edgeLocal)
        => card.Words[(edgeLocal + rotation) % 4];

    private List<string> PickWords(int count)
    {
        var pool = WordBank.Words.OrderBy(_ => _rng.Next()).Take(count).ToList();
        if (pool.Count < count)
        {
            while (pool.Count < count)
                pool.Add(WordBank.Words[_rng.Next(WordBank.Words.Length)]);
        }
        return pool;
    }

    public Task CalculateScores(Room room)
    {
        return Task.CompletedTask;
    }

    public Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        return Task.CompletedTask;
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room.GameData is not CloverMindedState state) return Task.FromResult(false);

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
        if (player == null) return Task.FromResult(false);

        return action.Type switch
        {
            "CLOVER_SUBMIT_CLUES" when action.Payload.HasValue => Task.FromResult(TrySubmitClues(room, state, connectionId, action.Payload.Value)),
            "CLOVER_SET_SLOT" when action.Payload.HasValue => Task.FromResult(TrySetSlot(room, state, connectionId, action.Payload.Value)),
            "CLOVER_CLEAR_SLOT" when action.Payload.HasValue => Task.FromResult(TryClearSlot(room, state, connectionId, action.Payload.Value)),
            "CLOVER_ROTATE_SLOT" when action.Payload.HasValue => Task.FromResult(TryRotateSlot(room, state, connectionId, action.Payload.Value)),
            "CLOVER_SUBMIT_GUESS" => Task.FromResult(TrySubmitGuess(room, state, connectionId)),
            "CLOVER_GRAB_CARD" when action.Payload.HasValue => Task.FromResult(TryGrabCard(state, connectionId, action.Payload.Value)),
            "CLOVER_RELEASE_CARD" when action.Payload.HasValue => Task.FromResult(TryReleaseCard(state, connectionId, action.Payload.Value)),
            _ => Task.FromResult(false)
        };
    }

    private bool TryGrabCard(CloverMindedState state, string connectionId, JsonElement payload)
    {
        if (state.Phase != CloverMindedPhase.Resolution.ToString() &&
            state.Phase != CloverMindedPhase.ResolutionSecond.ToString()) return false;

        if (!payload.TryGetProperty("cardId", out var cid)) return false;
        var cardId = cid.GetString();
        if (string.IsNullOrEmpty(cardId)) return false;

        state.CardOccupants ??= new ConcurrentDictionary<string, string?>();
        return state.CardOccupants.TryAdd(cardId, connectionId);
    }

    private bool TryReleaseCard(CloverMindedState state, string connectionId, JsonElement payload)
    {
        if (!payload.TryGetProperty("cardId", out var cid)) return false;
        var cardId = cid.GetString();
        if (string.IsNullOrEmpty(cardId)) return false;

        if (state.CardOccupants != null && state.CardOccupants.TryGetValue(cardId, out var occupant) && occupant == connectionId)
        {
            state.CardOccupants.TryRemove(cardId, out _);
            return true;
        }
        return false;
    }

    private bool TrySubmitClues(Room room, CloverMindedState state, string connectionId, JsonElement payload)
    {
        if (state.Phase != CloverMindedPhase.ClueWriting.ToString()) return false;
        var p = room.Players.FirstOrDefault(x => x.ConnectionId == connectionId);
        if (p == null || p.IsScreen) return false;
        if (!state.ParticipantIds.Contains(connectionId)) return false;

        if (!payload.TryGetProperty("clues", out var cluesEl) || cluesEl.ValueKind != JsonValueKind.Array) return false;
        var clues = cluesEl.EnumerateArray().Select(e => e.GetString() ?? "").Take(4).ToArray();
        if (clues.Length != 4 || clues.Any(string.IsNullOrWhiteSpace)) return false;

        for (var i = 0; i < 4; i++) clues[i] = clues[i].Trim();

        var dict = _privateClues.GetOrAdd(room.Code, _ => new Dictionary<string, string[]>());
        dict[connectionId] = clues;
        state.ClueSubmitted[connectionId] = true;

        if (state.ClueSubmitted.Values.All(v => v))
            BeginResolutionForCurrentSpectator(room, state);

        return true;
    }

    private void BeginResolutionForCurrentSpectator(Room room, CloverMindedState state)
    {
        if (state.SpectatorIndex >= state.ParticipantIds.Count)
        {
            state.Phase = CloverMindedPhase.GameOver.ToString();
            return;
        }

        var specId = state.ParticipantIds[state.SpectatorIndex];
        state.CurrentSpectatorId = specId;
        state.ResolutionAttempt = 1;
        state.Phase = CloverMindedPhase.Resolution.ToString();
        // Reset per Hand for this spectator's resolution attempt.
        state.RotationCardIdByPlayerThisAttempt = state.ParticipantIds.ToDictionary(id => id, _ => (string?)null);

        if (!_privateClues.TryGetValue(room.Code, out var clueMap) || !clueMap.TryGetValue(specId, out var clueArr))
            clueArr = new[] { "?", "?", "?", "?" };
        state.CurrentClues = clueArr;

        if (!state.PrepByPlayer.TryGetValue(specId, out var prep))
        {
            state.Message = "Missing prep for spectator.";
            return;
        }

        var decoyWords = PickWords(4);
        var decoy = new CloverCardModel
        {
            Id = $"d-{Guid.NewGuid():N}"[..12],
            Words = decoyWords.ToArray()
        };

        var pool = prep.Cards.Concat(new[] { decoy }).OrderBy(_ => _rng.Next()).ToList();
        state.Pool = pool;

        state.Slots = Enumerable.Range(0, 4).Select(_ => new CloverSlotState()).ToArray();

        var sol = new CloverRoundSolution();
        for (var s = 0; s < 4; s++)
        {
            var cardIdx = prep.SlotPermutation[s];
            sol.SlotCardIds[s] = prep.Cards[cardIdx].Id;
            sol.SlotRotations[s] = prep.SlotRotations[s];
        }
        sol.DecoyCardId = decoy.Id;
        sol.SpectatorId = specId;
        _roundSolutions[room.Code] = sol;

        state.LastResult = null;
    }

    private bool TrySetSlot(Room room, CloverMindedState state, string connectionId, JsonElement payload)
    {
        if (state.Phase != CloverMindedPhase.Resolution.ToString() &&
            state.Phase != CloverMindedPhase.ResolutionSecond.ToString()) return false;

        var p = room.Players.FirstOrDefault(x => x.ConnectionId == connectionId);
        if (p == null || p.IsScreen) return false;
        if (connectionId == state.CurrentSpectatorId) return false;

        if (!payload.TryGetProperty("slotIndex", out var si) || si.ValueKind != JsonValueKind.Number) return false;
        if (!payload.TryGetProperty("cardId", out var cid) || cid.ValueKind != JsonValueKind.String) return false;
        if (!payload.TryGetProperty("rotation", out var rot) || rot.ValueKind != JsonValueKind.Number) return false;

        var slotIndex = si.GetInt32();
        if (slotIndex is < 0 or > 3) return false;
        var cardId = cid.GetString() ?? "";
        var rotation = rot.GetInt32() % 4;
        if (rotation < 0) rotation += 4;

        if (state.Slots == null || state.Pool == null) return false;
        if (state.Pool.All(c => c.Id != cardId)) return false;

        for (var i = 0; i < 4; i++)
        {
            if (i == slotIndex) continue;
            if (state.Slots[i].CardId == cardId) return false;
        }

        state.Slots[slotIndex].CardId = cardId;
        state.Slots[slotIndex].Rotation = rotation;

        // Auto-release on placement
        state.CardOccupants?.TryRemove(cardId, out _);

        return true;
    }

    private bool TryClearSlot(Room room, CloverMindedState state, string connectionId, JsonElement payload)
    {
        if (state.Phase != CloverMindedPhase.Resolution.ToString() &&
            state.Phase != CloverMindedPhase.ResolutionSecond.ToString()) return false;

        var p = room.Players.FirstOrDefault(x => x.ConnectionId == connectionId);
        if (p == null || p.IsScreen) return false;
        if (connectionId == state.CurrentSpectatorId) return false;

        if (!payload.TryGetProperty("slotIndex", out var si) || si.ValueKind != JsonValueKind.Number) return false;
        var slotIndex = si.GetInt32();
        if (slotIndex is < 0 or > 3 || state.Slots == null) return false;
        var cardId = state.Slots[slotIndex].CardId;
        state.Slots[slotIndex].CardId = null;
        state.Slots[slotIndex].Rotation = 0;

        // Auto-release if it was cleared
        if (!string.IsNullOrEmpty(cardId))
        {
            state.CardOccupants?.TryRemove(cardId, out _);
        }

        return true;
    }

    private bool TryRotateSlot(Room room, CloverMindedState state, string connectionId, JsonElement payload)
    {
        if (!room.Settings.CloverAllowPerPlayerSingleCardRotation) return false;
        if (state.Phase != CloverMindedPhase.Resolution.ToString() &&
            state.Phase != CloverMindedPhase.ResolutionSecond.ToString()) return false;

        var p = room.Players.FirstOrDefault(x => x.ConnectionId == connectionId);
        if (p == null || p.IsScreen) return false;
        if (connectionId == state.CurrentSpectatorId) return false;

        if (state.RotationCardIdByPlayerThisAttempt == null)
            state.RotationCardIdByPlayerThisAttempt = new Dictionary<string, string?>();

        if (!payload.TryGetProperty("slotIndex", out var si) || si.ValueKind != JsonValueKind.Number) return false;
        var slotIndex = si.GetInt32();
        if (slotIndex is < 0 or > 3 || state.Slots == null) return false;
        var slot = state.Slots[slotIndex];
        if (string.IsNullOrEmpty(slot.CardId)) return false;

        // Enforce: once a Hand rotates one card in this attempt, they may only rotate that same card.
        state.RotationCardIdByPlayerThisAttempt.TryGetValue(connectionId, out var usedCardId);
        if (!string.IsNullOrEmpty(usedCardId) && usedCardId != slot.CardId)
            return false;

        slot.Rotation = (slot.Rotation + 1) % 4;
        state.RotationCardIdByPlayerThisAttempt[connectionId] = slot.CardId;
        return true;
    }

    private bool TrySubmitGuess(Room room, CloverMindedState state, string connectionId)
    {
        if (state.Phase != CloverMindedPhase.Resolution.ToString() &&
            state.Phase != CloverMindedPhase.ResolutionSecond.ToString()) return false;

        var p = room.Players.FirstOrDefault(x => x.ConnectionId == connectionId);
        if (p == null || p.IsScreen) return false;
        if (connectionId == state.CurrentSpectatorId) return false;

        if (state.Slots == null || !_roundSolutions.TryGetValue(room.Code, out var sol)) return false;

        for (var i = 0; i < 4; i++)
        {
            if (state.Slots[i].CardId == null) return false;
        }

        var allCorrect = true;
        var wrong = new bool[4];
        for (var i = 0; i < 4; i++)
        {
            var ok = state.Slots[i].CardId == sol.SlotCardIds[i] && state.Slots[i].Rotation == sol.SlotRotations[i];
            wrong[i] = !ok;
            if (!ok) allCorrect = false;
        }

        if (allCorrect)
        {
            var add = state.ResolutionAttempt == 1 ? 6 : CountCorrect(state.Slots, sol);
            state.TotalScore += add;
            state.LastResult = state.ResolutionAttempt == 1
                ? $"Perfect! +{add} points."
                : $"Second attempt. +{add} points.";
            AdvanceSpectator(room, state);
            return true;
        }

        if (state.ResolutionAttempt == 1)
        {
            // Rulebook: the Spectator removes incorrect cards from the middle.
            // We model this by removing wrong card IDs from `state.Pool` before attempt 2.
            var wrongCardIds = new List<string>();
            for (var i = 0; i < 4; i++)
            {
                if (wrong[i])
                {
                    if (state.Slots[i].CardId != null)
                        wrongCardIds.Add(state.Slots[i].CardId!);
                    state.Slots[i].CardId = null;
                    state.Slots[i].Rotation = 0;
                }
            }

            wrongCardIds = wrongCardIds.Distinct().ToList();
            if (state.Pool != null && wrongCardIds.Count > 0)
            {
                state.Pool = state.Pool.Where(c => !wrongCardIds.Contains(c.Id)).ToList();
            }

            state.ResolutionAttempt = 2;
            state.Phase = CloverMindedPhase.ResolutionSecond.ToString();
            state.LastResult = "Some cards were wrong — one more try.";
            state.RotationCardIdByPlayerThisAttempt = state.ParticipantIds.ToDictionary(id => id, _ => (string?)null);
            return true;
        }

        var partial = CountCorrect(state.Slots, sol);
        state.TotalScore += partial;
        state.LastResult = $"Final attempt scored +{partial} points.";
        AdvanceSpectator(room, state);
        return true;
    }

    private static int CountCorrect(CloverSlotState[] slots, CloverRoundSolution sol)
    {
        var n = 0;
        for (var i = 0; i < 4; i++)
        {
            if (slots[i].CardId == sol.SlotCardIds[i] && slots[i].Rotation == sol.SlotRotations[i])
                n++;
        }
        return n;
    }

    private void AdvanceSpectator(Room room, CloverMindedState state)
    {
        state.SpectatorIndex++;
        state.CurrentClues = null;
        state.Pool = new List<CloverCardModel>();
        state.Slots = null;
        state.Phase = CloverMindedPhase.BetweenRounds.ToString();
        _roundSolutions.TryRemove(room.Code, out _);

        if (state.SpectatorIndex >= state.ParticipantIds.Count)
        {
            state.Phase = CloverMindedPhase.GameOver.ToString();
            state.Message = $"Game over. Total score: {state.TotalScore}.";
            return;
        }

        state.ResolutionAttempt = 1;
        BeginResolutionForCurrentSpectator(room, state);
    }

    public object DeserializeState(JsonElement json)
    {
        return json.Deserialize<CloverMindedState>(new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
               ?? new CloverMindedState();
    }
}

internal static class CloverGeometry
{
    /// <summary>Local edge indices for pair between slot i and (i+1)%4.</summary>
    public static (int edgeOnSlotI, int edgeOnSlotIp1) PairEdgeIndices(int i)
    {
        var edgeA = new[] { 1, 2, 3, 0 };
        var edgeB = new[] { 0, 0, 2, 3 };
        return (edgeA[i], edgeB[i]);
    }
}

internal sealed class CloverRoundSolution
{
    public string[] SlotCardIds { get; set; } = new string[4];
    public int[] SlotRotations { get; set; } = new int[4];
    public string DecoyCardId { get; set; } = string.Empty;
    public string SpectatorId { get; set; } = string.Empty;
}

public class CloverMindedState
{
    public string Phase { get; set; } = CloverMindedPhase.ClueWriting.ToString();
    public string? Message { get; set; }
    public List<string> ParticipantIds { get; set; } = new();
    public Dictionary<string, CloverPlayerPrep> PrepByPlayer { get; set; } = new();
    public Dictionary<string, bool> ClueSubmitted { get; set; } = new();
    public int SpectatorIndex { get; set; }
    public int ResolutionAttempt { get; set; } = 1;
    public string? CurrentSpectatorId { get; set; }
    public string[]? CurrentClues { get; set; }
    public List<CloverCardModel> Pool { get; set; } = new();
    public CloverSlotState[]? Slots { get; set; }
    public int TotalScore { get; set; }
    public string? LastResult { get; set; }
    // Hand-only rule: in a given resolution attempt, a Hand can rotate exactly one card.
    // Value is the CardId they locked to (null means they haven't rotated yet).
    public Dictionary<string, string?> RotationCardIdByPlayerThisAttempt { get; set; } = new();

    /// <summary>Who is currently dragging which card (cardId -> connectionId)</summary>
    public ConcurrentDictionary<string, string?> CardOccupants { get; set; } = new();
}

public class CloverPlayerPrep
{
    public string ConnectionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public List<CloverCardModel> Cards { get; set; } = new();
    /// <summary>Slot s holds card index permutation[s] from the four-card list.</summary>
    public int[] SlotPermutation { get; set; } = Array.Empty<int>();
    public int[] SlotRotations { get; set; } = Array.Empty<int>();
    public string[][] PairWords { get; set; } = Array.Empty<string[]>();
}

public class CloverCardModel
{
    public string Id { get; set; } = string.Empty;
    public string[] Words { get; set; } = Array.Empty<string>();
}

public class CloverSlotState
{
    public string? CardId { get; set; }
    public int Rotation { get; set; }
}

public enum CloverMindedPhase
{
    ClueWriting,
    Resolution,
    ResolutionSecond,
    BetweenRounds,
    GameOver
}

internal static class WordBank
{
    public static readonly string[] Words =
    {
        "House", "Hood", "Pear", "Lamp", "Firefighter", "Sheep", "Climbing", "Pond", "Shirt", "Tail",
        "Menu", "Child", "Doe", "Clothing", "Banana", "Tattoo", "Memory", "Down", "Guide", "Love",
        "Ocean", "Castle", "Thunder", "Garden", "Piano", "Rocket", "Mirror", "Shadow", "Forest", "Bridge",
        "Candle", "Diamond", "Feather", "Glacier", "Hammer", "Island", "Jungle", "Kitchen", "Lantern", "Marble",
        "Nebula", "Orbit", "Puzzle", "Quartz", "River", "Station", "Tunnel", "Umbrella", "Volcano", "Window",
        "Anchor", "Basket", "Canyon", "Dragon", "Echo", "Flame", "Globe", "Harbor", "Icicle", "Journey"
    };
}
