using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class FourInARowGameService : BaseGameService<FourInARowState>
{
    public override GameType GameType => GameType.FourInARow;

    public override Task StartRound(Room room, GameSettings settings)
    {
        var state = new FourInARowState
        {
            Phase = FourInARowPhase.Playing,
            CurrentPlayerId = room.Players.FirstOrDefault()?.ConnectionId ?? ""
        };
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    public override Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        return Task.CompletedTask;
    }
}

public class FourInARowState
{
    public FourInARowPhase Phase { get; set; }
    public int[][] Grid { get; set; } = Enumerable.Range(0, 7).Select(_ => new int[6]).ToArray(); // 0=Empty, 1=Red, 2=Yellow
    public string CurrentPlayerId { get; set; } = string.Empty;
    public string WinnerId { get; set; } = string.Empty;
}

public enum FourInARowPhase
{
    Playing,
    GameOver
}
