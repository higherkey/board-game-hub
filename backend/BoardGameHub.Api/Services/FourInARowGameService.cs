using System.Text.Json;
using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

/// <summary>Server-authoritative drops; RoomService serializes mutations with StateLock.</summary>
public class FourInARowGameService : BaseGameService<FourInARowState>
{
    public override GameType GameType => GameType.FourInARow;

    public override Task StartRound(Room room, GameSettings settings)
    {
        var players = room.Players.Where(p => !p.IsScreen).ToList();
        if (players.Count != 2)
            throw new InvalidOperationException("Four in a Row requires exactly two Hand players.");

        room.GameData = new FourInARowState
        {
            PlayerOrder = players.Select(p => p.ConnectionId).ToList(),
            CurrentPlayerId = players[0].ConnectionId
        };
        room.RoundScores.Clear();
        settings.TimerDurationSeconds = 0;
        return Task.CompletedTask;
    }

    public override Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        var state = GetState(room);
        if (state == null || room.State != GameState.Playing || room.IsPaused ||
            state.Phase != FourInARowPhase.Playing || state.CurrentPlayerId != connectionId ||
            state.PlayerOrder.Count != 2 || !state.PlayerOrder.Contains(connectionId) ||
            !room.Players.Any(p => p.ConnectionId == connectionId && !p.IsScreen) ||
            action.Type != "DROP" || !TryColumn(action.Payload, out var column))
            return Task.FromResult(false);

        var row = Array.FindLastIndex(state.Grid[column], cell => cell == 0);
        if (row < 0) return Task.FromResult(false);
        var token = state.PlayerOrder.IndexOf(connectionId) + 1;
        state.Grid[column][row] = token;
        state.LastMove = new FourInARowCell(column, row);
        state.MoveCount++;
        state.WinningCells = FindWinningCells(state.Grid, column, row, token);
        if (state.WinningCells.Count > 0 || state.MoveCount == 42)
        {
            state.WinnerId = state.WinningCells.Count > 0 ? connectionId : string.Empty;
            state.Phase = FourInARowPhase.GameOver;
            state.CurrentPlayerId = string.Empty;
            foreach (var id in state.PlayerOrder)
            {
                var score = id == state.WinnerId ? 1 : 0;
                room.RoundScores[id] = score;
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == id);
                if (player != null) player.Score += score;
            }
            room.State = GameState.Finished;
            room.RoundEndTime = null;
        }
        else
        {
            state.CurrentPlayerId = state.PlayerOrder[token % 2];
        }
        return Task.FromResult(true);
    }

    private static bool TryColumn(JsonElement? payload, out int column)
    {
        column = -1;
        return payload is { ValueKind: JsonValueKind.Object } value &&
            value.TryGetProperty("column", out var property) && property.ValueKind == JsonValueKind.Number &&
            property.TryGetInt32(out column) && column is >= 0 and < 7;
    }

    private static List<FourInARowCell> FindWinningCells(int[][] grid, int column, int row, int token)
    {
        foreach (var (dx, dy) in new[] { (1, 0), (0, 1), (1, 1), (1, -1) })
        {
            var cells = new List<FourInARowCell> { new(column, row) };
            foreach (var sign in new[] { -1, 1 })
            {
                var x = column + dx * sign;
                var y = row + dy * sign;
                while (x is >= 0 and < 7 && y is >= 0 and < 6 && grid[x][y] == token)
                {
                    cells.Add(new(x, y));
                    x += dx * sign;
                    y += dy * sign;
                }
            }
            if (cells.Count >= 4) return cells;
        }
        return [];
    }

    // A match ends on a win/draw, never on a generic timer or score request.
    public override Task EndRound(Room room) => Task.CompletedTask;

    public override void RebindPlayer(Room room, string oldConnectionId, string newConnectionId)
    {
        var state = GetState(room);
        if (state == null) return;
        state.PlayerOrder = state.PlayerOrder.Select(id => id == oldConnectionId ? newConnectionId : id).ToList();
        if (state.CurrentPlayerId == oldConnectionId) state.CurrentPlayerId = newConnectionId;
        if (state.WinnerId == oldConnectionId) state.WinnerId = newConnectionId;
        if (room.RoundScores.Remove(oldConnectionId, out var score)) room.RoundScores[newConnectionId] = score;
    }
}

public record FourInARowCell(int Column, int Row);

public class FourInARowState
{
    public FourInARowPhase Phase { get; set; } = FourInARowPhase.Playing;
    // Column-major; row zero is the top of the board.
    public int[][] Grid { get; set; } = Enumerable.Range(0, 7).Select(_ => new int[6]).ToArray();
    public List<string> PlayerOrder { get; set; } = [];
    public string CurrentPlayerId { get; set; } = string.Empty;
    public string WinnerId { get; set; } = string.Empty;
    public int MoveCount { get; set; }
    public FourInARowCell? LastMove { get; set; }
    public List<FourInARowCell> WinningCells { get; set; } = [];
}

public enum FourInARowPhase { Playing, GameOver }
