using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public interface IGameService
{
    GameType GameType { get; }
    void StartRound(Room room, GameSettings settings);
    void CalculateScores(Room room);
}
