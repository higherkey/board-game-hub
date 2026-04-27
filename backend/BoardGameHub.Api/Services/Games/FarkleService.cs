using BoardGameHub.Api.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

namespace BoardGameHub.Api.Services.Games;

public class FarkleService : IGameService
{
    private readonly ILogger<FarkleService> _logger;
    private readonly IServiceProvider _serviceProvider;

    public GameType GameType => GameType.Farkle;

    public FarkleService(ILogger<FarkleService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public Task StartRound(Room room, GameSettings settings)
    {
        _logger.LogInformation("Starting Farkle in room {Code}", room.Code);
        var state = new FarkleState { RoomCode = room.Code };

        foreach (var player in room.Players.Where(p => !p.IsScreen))
        {
            state.PlayerStates[player.ConnectionId] = new FarklePlayerState
            {
                PlayerId = player.ConnectionId,
                PlayerName = player.Name
            };
        }

        if (state.PlayerStates.Any())
        {
            state.ActivePlayerId = state.PlayerStates.Keys.First();
            ResetDice(state);
            RollDice(state);
        }

        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room.GameData is not FarkleState state) return Task.CompletedTask;

        foreach (var pState in state.PlayerStates.Values)
        {
            var player = room.Players.FirstOrDefault(p => p.ConnectionId == pState.PlayerId);
            if (player != null)
            {
                player.Score = pState.TotalScore;
            }
        }

        return Task.CompletedTask;
    }

    public Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        return CalculateScores(room);
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room.GameData is not FarkleState state) return Task.FromResult(false);
        if (state.ActivePlayerId != connectionId) return Task.FromResult(false);

        switch (action.Type)
        {
            case "ROLL":
                return Task.FromResult(HandleRoll(state));
            case "BANK":
                return Task.FromResult(HandleBank(state));
            case "TOGGLE_DIE":
                return Task.FromResult(HandleToggleDie(state, action.Payload));
            default:
                return Task.FromResult(false);
        }
    }

    public object DeserializeState(JsonElement json)
    {
        return json.Deserialize<FarkleState>(new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) ?? new FarkleState();
    }

    private bool HandleRoll(FarkleState state)
    {
        if (state.Phase != FarklePhase.Picking) return false;

        // Must have selected at least one NEW scoring die since the last roll
        var newlyReserved = state.Dice.Where(d => !d.IsHeld && d.IsReserved).ToList();
        if (!newlyReserved.Any() && state.Dice.Any(d => !d.IsHeld))
        {
            // First roll of turn doesn't require this, but state starts in "Rolling" or we handle it
            // Actually, if all dice are available (start of turn), we can roll.
            bool isStartOfTurn = state.Dice.All(d => !d.IsHeld && !d.IsReserved);
            if (!isStartOfTurn) return false; 
        }

        // Calculate score of newly reserved dice and add to turn score
        int additionalScore = CalculateDiceScore(newlyReserved.Select(d => d.Value).ToList());
        if (additionalScore == 0 && state.Dice.Any(d => !d.IsHeld)) 
        {
             // If they try to roll but haven't picked scoring dice (and it's not the first roll)
             if (state.Dice.Any(d => d.IsReserved || d.IsHeld)) return false;
        }

        state.CurrentTurnScore += additionalScore;

        // Move reserved to held
        foreach (var die in state.Dice.Where(d => d.IsReserved))
        {
            die.IsHeld = true;
            die.IsReserved = false;
        }

        // Hot dice check: if all dice are held, reset them but keep the score
        if (state.Dice.All(d => d.IsHeld))
        {
            ResetDice(state);
        }

        RollDice(state);
        return true;
    }

    private bool HandleBank(FarkleState state)
    {
        if (state.Phase != FarklePhase.Picking) return false;

        // Calculate score of currently reserved dice
        var newlyReserved = state.Dice.Where(d => !d.IsHeld && d.IsReserved).ToList();
        int additionalScore = CalculateDiceScore(newlyReserved.Select(d => d.Value).ToList());
        
        // Basic Farkle rule: you must be able to score at least 500 (or 300) to "get on the board" 
        // but let's keep it simple for now.
        
        state.CurrentTurnScore += additionalScore;
        
        if (state.CurrentTurnScore == 0) return false; // Can't bank 0 (unless Farkled, but that's automatic)

        if (state.PlayerStates.TryGetValue(state.ActivePlayerId, out var pState))
        {
            pState.TotalScore += state.CurrentTurnScore;
            pState.LastTurnScore = state.CurrentTurnScore;
            
            if (pState.TotalScore >= 10000 && !pState.IsFinalTurn)
            {
                pState.IsFinalTurn = true;
                // Game continues until it gets back to this player
            }
        }

        AdvanceTurn(state);
        return true;
    }

    private bool HandleToggleDie(FarkleState state, JsonElement? payload)
    {
        if (state.Phase != FarklePhase.Picking) return false;
        if (payload == null || !payload.Value.TryGetProperty("index", out var indexProp)) return false;

        int index = indexProp.GetInt32();
        if (index < 0 || index >= state.Dice.Count) return false;

        var die = state.Dice[index];
        if (die.IsHeld) return false; // Can't toggle already banked dice from previous rolls

        die.IsReserved = !die.IsReserved;
        return true;
    }

    private void RollDice(FarkleState state)
    {
        state.Phase = FarklePhase.Rolling;
        foreach (var die in state.Dice.Where(d => !d.IsHeld))
        {
            die.Value = Random.Shared.Next(1, 7);
            die.IsReserved = false;
            die.IsScoring = false;
        }

        // Check for Farkle
        var availableDiceValues = state.Dice.Where(d => !d.IsHeld).Select(d => d.Value).ToList();
        int possibleScore = CalculateDiceScore(availableDiceValues);

        if (possibleScore == 0)
        {
            state.Phase = FarklePhase.Farkled;
            state.CurrentTurnScore = 0;
            
            // Auto-advance after 3 seconds so players can see the "FARKLE!" animation
            var roomCode = state.RoomCode; // We'll need to add this to the state
            _ = Task.Run(async () => {
                await Task.Delay(3000);
                await ExecuteAutoAdvance(roomCode);
            });
        }
        else
        {
            state.Phase = FarklePhase.Picking;
            // Mark which dice ARE part of a scoring combination to help the user
            // This is actually tricky because a die might be part of multiple combos.
            // For now, let's just let the user pick and we validate on Bank/Roll.
        }
    }

    private async Task ExecuteAutoAdvance(string roomCode)
    {
        using var scope = _serviceProvider.CreateScope();
        var roomService = scope.ServiceProvider.GetRequiredService<IRoomService>();
        var gameStateManager = scope.ServiceProvider.GetRequiredService<GameStateManager>();
        
        var room = roomService.GetRoom(roomCode);
        if (room == null || room.GameData is not FarkleState state || state.Phase != FarklePhase.Farkled) return;

        await room.StateLock.WaitAsync();
        try
        {
            // Re-verify phase under lock
            if (state.Phase == FarklePhase.Farkled)
            {
                AdvanceTurn(state);
                gameStateManager.MarkDirty(room.Code);
            }
        }
        finally
        {
            room.StateLock.Release();
        }
    }

    private void AdvanceTurn(FarkleState state)
    {
        var playerIds = state.PlayerStates.Keys.ToList();
        int currentIndex = playerIds.IndexOf(state.ActivePlayerId);
        int nextIndex = (currentIndex + 1) % playerIds.Count;
        
        state.ActivePlayerId = playerIds[nextIndex];
        
        // Check for Game Over: if the next player is the one who triggered the final turn
        if (state.PlayerStates[state.ActivePlayerId].IsFinalTurn)
        {
            state.Phase = FarklePhase.GameOver;
            state.WinningPlayerId = state.PlayerStates.Values.OrderByDescending(p => p.TotalScore).First().PlayerId;
        }
        else
        {
            state.CurrentTurnScore = 0;
            ResetDice(state);
            RollDice(state);
        }
    }

    private void ResetDice(FarkleState state)
    {
        state.Dice = Enumerable.Range(0, 6).Select(_ => new FarkleDie()).ToList();
    }

    public static int CalculateDiceScore(List<int> dice)
    {
        if (dice == null || !dice.Any()) return 0;

        int score = 0;
        var counts = new int[7];
        foreach (var d in dice) counts[d]++;

        // 1. Check for 1-6 straight
        if (counts[1] == 1 && counts[2] == 1 && counts[3] == 1 && counts[4] == 1 && counts[5] == 1 && counts[6] == 1)
            return 1500;

        // 2. Check for 3 pairs
        int pairs = 0;
        for (int i = 1; i <= 6; i++) if (counts[i] == 2) pairs++;
        if (pairs == 3) return 1500;

        // 3. Check for triplets and above
        for (int i = 1; i <= 6; i++)
        {
            if (counts[i] >= 3)
            {
                int baseVal = (i == 1) ? 1000 : i * 100;
                int multiplier = counts[i] - 2; // 3->1, 4->2, 5->3, 6->4
                // Many variants here. Let's use: 3=base, 4=base*2, 5=base*4, 6=base*8
                score += baseVal * (1 << (multiplier - 1));
                counts[i] = 0; // "Consume" these dice
            }
        }

        // 4. Check for remaining 1s and 5s
        score += counts[1] * 100;
        score += counts[5] * 50;

        // IMPORTANT: In Farkle, every die used in the score MUST be part of a scoring combination.
        // If the user selects dice that DON'T score, the whole selection might be invalid depending on house rules.
        // For simplicity, we just return the score of whatever can be scored.
        
        return score;
    }
}
