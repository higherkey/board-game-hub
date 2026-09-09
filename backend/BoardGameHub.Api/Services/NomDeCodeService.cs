using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class NomDeCodeService : BaseGameService<NomDeCodeState>
{
    public override GameType GameType => GameType.NomDeCode;

    public override Task StartRound(Room room, GameSettings settings)
    {
        // Stub: Initialize Basic State
        var state = new NomDeCodeState
        {
            Phase = NomDeCodePhase.ClueGiving,
            CurrentTeam = "Red",
            Grid = GenerateGrid()
        };
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    private List<NomDeCodeCard> GenerateGrid()
    {
        // Stub: Generate 5x5 Grid
        var grid = new List<NomDeCodeCard>();
        for (int i = 0; i < 25; i++)
        {
            grid.Add(new NomDeCodeCard { Id = i, Word = $"Word{i}", Type = "Neutral" });
        }
        return grid;
    }

    public override Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        return Task.CompletedTask;
    }
}

public class NomDeCodeState
{
    public NomDeCodePhase Phase { get; set; }
    public string CurrentTeam { get; set; } = "Red";
    public List<NomDeCodeCard> Grid { get; set; } = new();
    public NomDeCodeClue? CurrentClue { get; set; }
}

public class NomDeCodeCard
{
    public int Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string Type { get; set; } = "Neutral"; // Red, Blue, Neutral, Assassin
    public bool IsRevealed { get; set; }
}

public class NomDeCodeClue
{
    public string Word { get; set; } = string.Empty;
    public int Number { get; set; }
}

public enum NomDeCodePhase
{
    ClueGiving,
    Guessing,
    GameOver
}
