using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class WarshipsGameService : BaseGameService<WarshipsState>
{
    public override GameType GameType => GameType.Warships;

    public override Task StartRound(Room room, GameSettings settings)
    {
        var state = new WarshipsState
        {
            Phase = WarshipsPhase.Placement
        };
        
        foreach(var p in room.Players)
        {
            state.PlayerBoards[p.ConnectionId] = new WarshipsBoard();
        }

        room.GameData = state;
        return Task.CompletedTask;
    }

    public override Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        return Task.CompletedTask;
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
    public int[][] Grid { get; set; } = Enumerable.Range(0, 10).Select(_ => new int[10]).ToArray(); 
    public List<Warship> Ships { get; set; } = new();
}

public record WarshipCoordinate(int Row, int Col);

public class Warship
{
    public string Type { get; set; } = string.Empty;
    public int Size { get; set; }
    public List<WarshipCoordinate> Coordinates { get; set; } = new();
    public bool IsSunk { get; set; }
}

public enum WarshipsPhase
{
    Placement,
    Battle,
    GameOver
}
