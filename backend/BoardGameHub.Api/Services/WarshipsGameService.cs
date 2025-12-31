using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class WarshipsGameService : IGameService
{
    public GameType GameType => GameType.Warships;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new WarshipsState
        {
            Phase = WarshipsPhase.Placement,
            // Initialize Grids for Players
        };
        
        foreach(var p in room.Players)
        {
            state.PlayerBoards[p.ConnectionId] = new WarshipsBoard();
        }

        room.GameData = state;
        return Task.CompletedTask;
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
        room.State = GameState.Finished;
        return Task.CompletedTask;
    }

    public object DeserializeState(JsonElement json)
    {
        return json.Deserialize<WarshipsState>(new JsonSerializerOptions { IncludeFields = true }) ?? new WarshipsState();
    }
}

public class WarshipsState
{
    public WarshipsPhase Phase { get; set; }
    public Dictionary<string, WarshipsBoard> PlayerBoards { get; set; } = new();
    public string ActivePlayerId { get; set; } = string.Empty;
}

public class WarshipsBoard
{
    // Grid 10x10. 0=Empty, 1=Ship, 2=Hit, 3=Miss
    public int[,] Grid { get; set; } = new int[10, 10]; 
    public List<Warship> Ships { get; set; } = new();
}

public class Warship
{
    public string Type { get; set; } = string.Empty;
    public int Size { get; set; }
    public List<(int Row, int Col)> Coordinates { get; set; } = new();
    public bool IsSunk { get; set; }
}

public enum WarshipsPhase
{
    Placement,
    Battle,
    GameOver
}
