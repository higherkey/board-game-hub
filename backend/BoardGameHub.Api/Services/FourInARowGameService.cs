using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class FourInARowGameService : IGameService
{
    public GameType GameType => GameType.FourInARow;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new FourInARowState
        {
            Phase = FourInARowPhase.Playing,
            CurrentPlayerId = room.Players.FirstOrDefault()?.ConnectionId ?? ""
        };
        // 7 cols, 6 rows
        state.Grid = new int[7, 6]; 
        
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
        return json.Deserialize<FourInARowState>(new JsonSerializerOptions { IncludeFields = true }) ?? new FourInARowState();
    }
}

public class FourInARowState
{
    public FourInARowPhase Phase { get; set; }
    public int[,] Grid { get; set; } = new int[7, 6]; // 0=Empty, 1=Red, 2=Yellow
    public string CurrentPlayerId { get; set; } = string.Empty;
    public string WinnerId { get; set; } = string.Empty;
}

public enum FourInARowPhase
{
    Playing,
    GameOver
}
