using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public abstract class BaseGameService<TState> : IGameService where TState : class, new()
{
    public abstract GameType GameType { get; }

    public virtual Task StartRound(Room room, GameSettings settings) => Task.CompletedTask;
    public virtual Task CalculateScores(Room room) => Task.CompletedTask;
    public virtual Task EndRound(Room room) => Task.CompletedTask;
    public virtual Task<bool> HandleAction(Room room, GameAction action, string connectionId) => Task.FromResult(false);

    public virtual object DeserializeState(JsonElement json)
    {
        try
        {
            if (json.ValueKind == JsonValueKind.Null || json.ValueKind == JsonValueKind.Undefined)
            {
                return new TState();
            }

            return json.Deserialize<TState>(RoomStateSerializer.GameOptions) ?? new TState();
        }
        catch (Exception)
        {
            return new TState();
        }
    }
}
