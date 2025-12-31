using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class CheckersGameService : IGameService
{
    public GameType GameType => GameType.Checkers;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new CheckersState
        {
            Phase = CheckersPhase.Playing,
            CurrentPlayerId = room.Players.FirstOrDefault()?.ConnectionId ?? ""
        };
        // Initialize Board 8x8
        state.Board = InitializeBoard();
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    private int[,] InitializeBoard()
    {
        var board = new int[8, 8];
        // 1=Red, 2=Black, 3=RedKing, 4=BlackKing
        // Setup standard checkers
        return board;
    }

    public Task CalculateScores(Room room)
    {
        return Task.CompletedTask;
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        return Task.FromResult(false);
    }

    public Task EndRound(Room room)
    {
        return Task.CompletedTask;
    }

    public object DeserializeState(JsonElement json)
    {
        return json.Deserialize<CheckersState>(new JsonSerializerOptions { IncludeFields = true }) ?? new CheckersState();
    }
}

public class CheckersState
{
    public CheckersPhase Phase { get; set; }
    public int[,] Board { get; set; } = new int[8, 8];
    public string CurrentPlayerId { get; set; } = string.Empty;
    public string WinnerId { get; set; } = string.Empty;
}

public enum CheckersPhase
{
    Playing,
    GameOver
}
