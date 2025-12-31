using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BoardGameHub.Api.Services;

public class GameHistoryService : IGameHistoryService
{
    private readonly AppDbContext _context;

    public GameHistoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task RecordGameSession(Room room)
    {
        // This accepts the in-memory Room object and saves it as a GameSession
        if (room.Players.Count == 0) return; // Don't save empty games

        // Find all User IDs in the room and check which ones actually exist in the DB
        var potentialUserIds = room.Players
            .Select(p => p.UserId)
            .Where(id => !string.IsNullOrEmpty(id))
            .Distinct()
            .ToList();

        var validUserIds = new HashSet<string>();
        if (potentialUserIds.Any())
        {
            validUserIds = (await _context.Users
                .Where(u => potentialUserIds.Contains(u.Id))
                .Select(u => u.Id)
                .ToListAsync())
                .ToHashSet();
        }

        var session = new GameSession
        {
            RoomCode = room.Code,
            GameType = room.GameType.ToString(),
            IsPublic = room.IsPublic,
            StartTime = DateTime.UtcNow.AddMinutes(-1), // Approximation if not tracked in Room
            EndTime = DateTime.UtcNow
        };

        var sessionPlayers = new List<GameSessionPlayer>();
        
        // Sorting players by score to determine rank
        var sortedPlayers = room.Players.OrderByDescending(p => p.Score).ToList();
        
        for (int i = 0; i < sortedPlayers.Count; i++)
        {
            var p = sortedPlayers[i];
            var userId = p.UserId;
            
            // If UserId is empty string or not found in DB (Guest UUID), set to null
            if (string.IsNullOrEmpty(userId) || !validUserIds.Contains(userId))
            {
                userId = null;
            }

            sessionPlayers.Add(new GameSessionPlayer
            {
                GameSessionId = session.Id,
                UserId = userId,
                DisplayName = p.Name,
                Score = p.Score,
                Rank = i + 1
            });
        }
        
        session.Players = sessionPlayers;
        
        _context.GameSessions.Add(session);
        await _context.SaveChangesAsync();
    }

    public async Task<List<GameSessionPlayer>> GetUserGameHistory(string userId, int count = 20)
    {
        return await _context.GameSessionPlayers
            .Where(p => p.UserId == userId)
            .Include(p => p.GameSession)
                .ThenInclude(gs => gs.Players)
            .OrderByDescending(p => p.GameSession!.EndTime)
            .Take(count)
            .ToListAsync();
    }
}
