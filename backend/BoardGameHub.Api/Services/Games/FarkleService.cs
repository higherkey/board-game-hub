using BoardGameHub.Api.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;

namespace BoardGameHub.Api.Services.Games;

public class FarkleService : BaseGameService<FarkleState>
{
    private readonly ILogger<FarkleService> _logger;
    private readonly IServiceProvider _serviceProvider;

    public override GameType GameType => GameType.Farkle;

    public FarkleService(ILogger<FarkleService> logger, IServiceProvider serviceProvider)
    {
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    public override Task StartRound(Room room, GameSettings settings)
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

    public override Task CalculateScores(Room room)
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

    public override Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        return CalculateScores(room);
    }

    public override Task<bool> HandleAction(Room room, GameAction action, string connectionId)
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

    private bool HandleRoll(FarkleState state)
    {
        if (state.Phase != FarklePhase.Picking) return false;

        // Must have selected at least one NEW scoring die since the last roll
        var newlyReserved = state.Dice.Where(d => !d.IsHeld && d.IsReserved).ToList();
        if (!newlyReserved.Any()) return false; // No free re-rolls

        // Every die picked must contribute to the score
        var scoringResult = CalculateDetailedScore(newlyReserved.Select(d => d.Value).ToList());
        if (scoringResult.DiceUsed != newlyReserved.Count) return false;

        state.CurrentTurnScore += scoringResult.Score;

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
        var scoringResult = CalculateDetailedScore(newlyReserved.Select(d => d.Value).ToList());
        
        // Every die picked must contribute to the score
        if (scoringResult.DiceUsed != newlyReserved.Count) return false;
        
        int potentialTurnScore = state.CurrentTurnScore + scoringResult.Score;
        if (potentialTurnScore == 0) return false; // Can't bank 0

        if (state.PlayerStates.TryGetValue(state.ActivePlayerId, out var pState))
        {
            // Official Rule: First score entered on Score Pad must be at least 500 points
            if (pState.TotalScore == 0 && potentialTurnScore < 500)
            {
                return false;
            }

            state.CurrentTurnScore = potentialTurnScore;
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
        var possibleScore = CalculateDetailedScore(availableDiceValues);

        if (possibleScore.Score == 0)
        {
            state.Phase = FarklePhase.Farkled;
            state.CurrentTurnScore = 0;
            
            // Auto-advance after 3 seconds so players can see the "FARKLE!" animation
            var roomCode = state.RoomCode; 
            _ = Task.Run(async () => {
                await Task.Delay(3000);
                await ExecuteAutoAdvance(roomCode);
            });
        }
        else
        {
            state.Phase = FarklePhase.Picking;
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

    public record ScoringResult(int Score, int DiceUsed);

    public static int CalculateDiceScore(List<int> dice)
    {
        return CalculateDetailedScore(dice).Score;
    }

    public static ScoringResult CalculateDetailedScore(List<int> dice)
    {
        if (dice == null || !dice.Any()) return new ScoringResult(0, 0);

        var counts = new int[7];
        foreach (var d in dice) counts[d]++;
        int totalDice = dice.Count;

        // Check 6-dice special combinations first
        int best6Score = 0;
        if (totalDice == 6)
        {
            // 1-6 straight (1,500 pts)
            if (counts[1] == 1 && counts[2] == 1 && counts[3] == 1 && counts[4] == 1 && counts[5] == 1 && counts[6] == 1)
                best6Score = Math.Max(best6Score, 1500);

            // Two triplets (2,500 pts)
            int tripletsCount = 0;
            for (int i = 1; i <= 6; i++) if (counts[i] == 3) tripletsCount++;
            if (tripletsCount == 2)
                best6Score = Math.Max(best6Score, 2500);

            // Four of any number with a pair (1,500 pts)
            bool hasFour = false, hasPair = false;
            for (int i = 1; i <= 6; i++)
            {
                if (counts[i] == 4) hasFour = true;
                if (counts[i] == 2) hasPair = true;
            }
            if (hasFour && hasPair)
                best6Score = Math.Max(best6Score, 1500);

            // Three pairs (1,500 pts)
            int totalPairs = 0;
            for (int i = 1; i <= 6; i++) totalPairs += counts[i] / 2;
            if (totalPairs == 3)
                best6Score = Math.Max(best6Score, 1500);

            // Six of any number (3,000 pts)
            if (counts.Any(c => c == 6))
                best6Score = Math.Max(best6Score, 3000);
        }

        // Standard combination scoring
        int score = 0;
        int usedDice = 0;
        var remCounts = (int[])counts.Clone();

        for (int i = 1; i <= 6; i++)
        {
            if (remCounts[i] >= 6)
            {
                score += 3000;
                usedDice += 6;
                remCounts[i] -= 6;
            }
            else if (remCounts[i] == 5)
            {
                score += 2000;
                usedDice += 5;
                remCounts[i] -= 5;
            }
            else if (remCounts[i] == 4)
            {
                score += 1000;
                usedDice += 4;
                remCounts[i] -= 4;
            }
            else if (remCounts[i] == 3)
            {
                int tripletVal = (i == 1) ? 300 : i * 100;
                score += tripletVal;
                usedDice += 3;
                remCounts[i] -= 3;
            }
        }

        // Add singles (1s = 100 pts, 5s = 50 pts)
        if (remCounts[1] > 0)
        {
            score += remCounts[1] * 100;
            usedDice += remCounts[1];
        }
        if (remCounts[5] > 0)
        {
            score += remCounts[5] * 50;
            usedDice += remCounts[5];
        }

        if (totalDice == 6 && best6Score > score)
        {
            return new ScoringResult(best6Score, 6);
        }

        return new ScoringResult(score, usedDice);
    }
}
