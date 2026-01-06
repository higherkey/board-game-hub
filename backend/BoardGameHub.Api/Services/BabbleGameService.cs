using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class BabbleState
{
    public bool IsPlaying { get; set; }
    public bool IsIntermission { get; set; }
    public int TimeLeft { get; set; }
    public bool IsPaused { get; set; }
    public int BoardSize { get; set; } = 4;
    public List<char> Grid { get; set; } = new();
    public List<BabbleResult> LastRoundResults { get; set; } = new();
}

public class BabbleResult
{
    public string Word { get; set; } = "";
    public string? Definition { get; set; }
    public bool IsOnGrid { get; set; }
    public bool IsInDictionary { get; set; } = true;
    public bool IsHostValidated { get; set; }
    public bool IsHostRejected { get; set; }
    public bool IsDuplicate { get; set; }
    public List<string> FoundBy { get; set; } = new(); // Player Ids
    public int Points { get; set; }
}

public class BabbleGameService : IGameService
{
    private readonly IBabbleService _babbleService;
    private readonly IDictionaryService _dictionaryService;

    public BabbleGameService(IBabbleService babbleService, IDictionaryService dictionaryService)
    {
        _babbleService = babbleService;
        _dictionaryService = dictionaryService;
    }

    public GameType GameType => GameType.Babble;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new BabbleState
        {
            IsPlaying = true,
            IsIntermission = false,
            TimeLeft = settings.TimerDurationSeconds,
            BoardSize = settings.BoardSize,
            Grid = _babbleService.GenerateGrid(settings.BoardSize)
        };
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null) return Task.CompletedTask;

        try 
        {
            // Must use JSON element conversion because GameData is generic object
            BabbleState state;
            if (room.GameData is JsonElement element)
            {
                state = (DeserializeState(element) as BabbleState) ?? new BabbleState();
            }
            else if (room.GameData is BabbleState typedState)
            {
                state = typedState;
            }
            else 
            {
                state = new BabbleState();
            }

            // Final safety: ensure Grid and Results are not null
            state.Grid ??= new List<char>();
            state.LastRoundResults ??= new List<BabbleResult>();

            // Ensure RoundScores is initialized
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();

            // 0. Subtract OLD round scores from player total BEFORE resetting them
            // This prevents double-counting when host toggles validation
            foreach (var p in room.Players)
            {
                if (room.RoundScores.TryGetValue(p.ConnectionId, out var oldScore))
                {
                    p.Score -= oldScore;
                }
                // Reset for this calculation
                room.RoundScores[p.ConnectionId] = 0;
            }

            var allFoundWords = new List<(string PlayerId, string Word)>();

            // 1. Collect all words with null safety
            foreach (var player in room.Players)
            {
                if (player == null || player.IsHost) continue;

                if (room.PlayerAnswers.TryGetValue(player.ConnectionId, out var pAnswers) && pAnswers != null)
                {
                    foreach (var word in pAnswers)
                    {
                        if (word == null) continue;
                        var cleanWord = word.Trim().ToUpperInvariant();
                        if (!string.IsNullOrWhiteSpace(cleanWord))
                        {
                            // Prevent duplicates from same player
                            if (!allFoundWords.Any(x => x.PlayerId == player.ConnectionId && x.Word == cleanWord))
                            {
                                allFoundWords.Add((player.ConnectionId, cleanWord));
                            }
                        }
                    }
                }
            }

            // Dictionary of previously validated words to preserve host overrides
            var preservedValidations = state.LastRoundResults?
                .ToDictionary(r => r.Word, r => (Accepted: r.IsHostValidated, Rejected: r.IsHostRejected)) 
                ?? new Dictionary<string, (bool Accepted, bool Rejected)>();

            var results = new List<BabbleResult>();
            var grouped = allFoundWords.GroupBy(x => x.Word).OrderBy(g => g.Key);

            // 2. Process words
            foreach (var group in grouped)
            {
                var word = group.Key;
                var playerIds = group.Select(x => x.PlayerId).Distinct().ToList();
                bool onGrid = _babbleService.IsWordOnGrid(word, state.Grid);
                bool inDict = _dictionaryService.IsValid(word); 
                bool isHostValidated = preservedValidations.TryGetValue(word, out var pVal) && pVal.Accepted;
                bool isHostRejected = preservedValidations.TryGetValue(word, out var pVal2) && pVal2.Rejected;
                string? definition = _dictionaryService.GetDefinition(word);
                bool duplicate = playerIds.Count > 1;

                bool effectivelyValid = (inDict || isHostValidated) && !isHostRejected;
                int points = 0;

                // Award points if on grid, effectively valid, and not duplicate
                if (onGrid && effectivelyValid && !duplicate)
                {
                    points = _babbleService.CalculateScore(word);
                    // Award points
                    foreach(var pid in playerIds)
                    {
                        if (room.RoundScores.ContainsKey(pid)) 
                        {
                            room.RoundScores[pid] += points;
                        }
                        var pl = room.Players.FirstOrDefault(p => p.ConnectionId == pid);
                        if (pl != null) pl.Score += points;
                    }
                }

                results.Add(new BabbleResult
                {
                    Word = word,
                    Definition = definition,
                    IsOnGrid = onGrid,
                    IsInDictionary = inDict,
                    IsHostValidated = isHostValidated,
                    IsHostRejected = isHostRejected,
                    IsDuplicate = duplicate,
                    FoundBy = playerIds,
                    Points = points
                });
            }

            state.IsPlaying = false;
            state.IsIntermission = true;
            state.LastRoundResults = results;
            room.GameData = state; // Update room state
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Babble CalculateScores: {ex.Message}");
            throw;
        }

        return Task.CompletedTask;
    }

    public async Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_ANSWERS" && action.Payload.HasValue)
        {
             var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
             if (player == null || player.IsHost) return false;

             if (action.Payload.Value.TryGetProperty("answers", out var answersProp) && answersProp.ValueKind == System.Text.Json.JsonValueKind.Array)
             {
                 var list = new List<string>();
                 foreach(var item in answersProp.EnumerateArray())
                 {
                     list.Add(item.GetString() ?? "");
                 }
                 room.PlayerAnswers[connectionId] = list;
                 return true;
             }
        }

        if (action.Type == "VALIDATE_WORD" && action.Payload.HasValue)
        {
            var caller = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
            if (caller == null || !caller.IsHost) return false;

            if (action.Payload.Value.TryGetProperty("word", out var wordProp) && 
                action.Payload.Value.TryGetProperty("isValid", out var validProp))
            {
                var word = wordProp.GetString();
                var isValid = validProp.GetBoolean();

                BabbleState state;
                if (room.GameData is JsonElement element)
                {
                    state = (DeserializeState(element) as BabbleState) ?? new BabbleState();
                }
                else if (room.GameData is BabbleState typedState)
                {
                    state = typedState;
                }
                else 
                {
                    state = new BabbleState();
                }

                var result = state.LastRoundResults.FirstOrDefault(r => r.Word == word);
                if (result != null)
                {
                    // If isValid is true, we Accept (Forced Valid). 
                    // If isValid is false, we Reject (Forced Invalid).
                    // This allows host to override dictionary both ways.
                    result.IsHostValidated = isValid;
                    result.IsHostRejected = !isValid;
                    
                    await CalculateScores(room); // Recalculate
                    return true;
                }
            }
        }
        return false;
    }
    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
    }

    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        try 
        {
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, IncludeFields = true };
            return json.Deserialize<BabbleState>(options) ?? new BabbleState();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deserializing BabbleState: {ex.Message}");
            return new BabbleState();
        }
    }
}
