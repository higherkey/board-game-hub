using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public interface IRoomService
{
    // Host & Room Management
    Room CreateRoom(string hostConnectionId, string hostName, bool isPublic, GameType gameType = GameType.Scatterbrain, string? userId = null, string? avatarUrl = null);
    Room? JoinRoom(string code, string connectionId, string playerName, string? userId = null, string? avatarUrl = null);
    void RemovePlayer(string connectionId);
    Room? GetRoom(string code);
    List<Room> GetPublicRooms();
    Room? PromoteToHost(string code, string connectionId);
    Room? RenamePlayer(string connectionId, string newName);
    void TerminateRoom(string code);

    // Game Flow
    Task<Room?> StartGame(string code, GameSettings? settings = null);
    Room? PauseGame(string code);
    Room? ResumeGame(string code);
    Room? EndGame(string code);
    Task<Room?> SubmitAction(string code, string connectionId, string actionType, System.Text.Json.JsonElement? payload);
    Task<Room?> CalculateRoundScores(string code);
    
    // Settings & Configuration
    Room? SetGameType(string code, GameType gameType);
    Room? UpdateSettings(string code, GameSettings settings);
    Room? UpdateUndoSettings(string code, UndoSettings settings);
    Room? VoteNextGame(string code, string playerId, GameType vote);
    
    // Undo System
    Room? RequestUndo(string code, string connectionId);
    Room? SubmitUndoVote(string code, string connectionId, bool vote);

    // Stats & Helpers
    List<string> ValidateRooms(List<string> codes);
    ServerStats GetServerStats();
    T? GetGameService<T>(GameType type) where T : class;
}
