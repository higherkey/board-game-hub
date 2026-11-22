using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public static class RoomLifecyclePolicy
{
    public static (GameState State, ResultPhase? ResultPhase) GetState(Room room)
    {
        if (room.State == GameState.Lobby) return (GameState.Lobby, null);
        if (room.State == GameState.Finished && room.ResultPhase.HasValue)
            return (GameState.Finished, room.ResultPhase);

        var terminal = room.GameData switch
        {
            FarkleState s => s.Phase == FarklePhase.GameOver,
            YachtState s => s.Phase == "GameOver",
            FourInARowState s => s.Phase == FourInARowPhase.GameOver,
            CloverMindedState s => s.Phase == CloverMindedPhase.GameOver.ToString(),
            SushiTrainState s => s.IsGameOver,
            GreatMindsGameState s => s.IsGameOver,
            NomDeCodeState s => s.Phase == NomDeCodePhase.GameOver,
            WarshipsState s => s.Phase == WarshipsPhase.GameOver,
            _ => false
        };
        // These native result phases have already resolved scoring. Reveal and validation phases remain interactive.
        var roundComplete = room.GameData switch
        {
            WisecrackState s => s.Phase == WisecrackPhase.Result,
            PoppycockState s => s.Phase == PoppycockPhase.Result,
            DeepfakeState s => s.Phase == DeepfakePhase.Results,
            ScatterbrainState s => s.Phase == ScatterbrainPhase.Result,
            OneAndOnlyState s => s.Phase == OneAndOnlyPhase.Result,
            UniversalTranslatorState s => s.Phase == UniversalTranslatorPhase.Result,
            _ => false
        };
        if (room.State == GameState.Playing && !terminal && !roundComplete)
            return (GameState.Playing, null);

        var selfManaged = room.GameType is GameType.Farkle or GameType.Yacht or GameType.FourInARow
            or GameType.CloverMinded or GameType.SushiTrain or GameType.NomDeCode or GameType.Warships or GameType.None;
        var finalRound = room.GameType == GameType.Wisecrack ? 3
            : Math.Clamp(room.Settings.TotalRounds, GameSettings.MinTotalRounds, GameSettings.MaxTotalRounds);
        return (GameState.Finished, terminal || selfManaged || room.RoundNumber >= finalRound
            ? ResultPhase.GameOver : ResultPhase.RoundResults);
    }

    // Caller holds the room state lock, including when normalizing delayed plugin updates for broadcast.
    public static bool Normalize(Room room)
    {
        var (state, phase) = GetState(room);
        var changed = room.State != state || room.ResultPhase != phase;
        room.State = state;
        room.ResultPhase = phase;
        return changed;
    }
}
