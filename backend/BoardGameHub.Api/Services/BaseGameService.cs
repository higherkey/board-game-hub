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

    protected TState? GetState(Room? room)
    {
        if (room == null) return null;
        if (room.GameData is TState s) return s;
        if (room.GameData is JsonElement element)
        {
            try
            {
                var deserialized = (TState)DeserializeState(element);
                room.GameData = deserialized;
                return deserialized;
            }
            catch
            {
                return null;
            }
        }
        return null;
    }

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

    public virtual void RebindPlayer(Room room, string oldConnectionId, string newConnectionId)
    {
        // Base empty implementation for games with no internal connectionId mapping
    }
}
