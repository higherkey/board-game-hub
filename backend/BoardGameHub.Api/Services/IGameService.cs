using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public interface IGameService
{
    GameType GameType { get; }
    /// <summary>Seconds of "get ready" before play starts each round. The server owns it so a refresh never replays it.</summary>
    int RoundLeadInSeconds => 0;
    Task StartRound(Room room, GameSettings settings);
    Task CalculateScores(Room room);
    Task EndRound(Room room);
    Task<bool> HandleAction(Room room, GameAction action, string connectionId);
    object DeserializeState(System.Text.Json.JsonElement json);
    void RebindPlayer(Room room, string oldConnectionId, string newConnectionId);
}
