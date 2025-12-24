using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public interface IGameHistoryService
{
    Task RecordGameSession(Room room);
    Task<List<GameSessionPlayer>> GetUserGameHistory(string userId, int count = 20);
}
