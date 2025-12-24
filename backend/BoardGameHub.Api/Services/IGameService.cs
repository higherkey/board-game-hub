using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public interface IGameService
{
    GameType GameType { get; }
    Task StartRound(Room room, GameSettings settings);
    Task CalculateScores(Room room);
    Task EndRound(Room room);
    Task<bool> HandleAction(Room room, GameAction action, string connectionId);
    object DeserializeState(System.Text.Json.JsonElement json);
}
