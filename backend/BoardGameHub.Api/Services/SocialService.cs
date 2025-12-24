using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BoardGameHub.Api.Services;

public class SocialService : ISocialService
{
    private readonly AppDbContext _context;

    public SocialService(AppDbContext context)
    {
        _context = context;
    }

    public async Task SaveChatMessage(string senderId, string? receiverId, string message)
    {
        var chatMessage = new ChatMessage
        {
            SenderId = senderId,
            ReceiverId = receiverId, // Null for global chat usually, but here we might enforce it
            Content = message,
            Timestamp = DateTime.UtcNow
        };
        
        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();
    }
    
    // Adjusted: If connection has no receiverId, it's global
    public async Task SaveGlobalMessage(string senderId, string message)
    {
        var chatMessage = new ChatMessage
        {
            SenderId = senderId,
            ReceiverId = null,
            Content = message,
            Timestamp = DateTime.UtcNow
        };
        
        _context.ChatMessages.Add(chatMessage);
        await _context.SaveChangesAsync();
    }

    public async Task<List<ChatMessage>> GetPrivateChatHistory(string userId1, string userId2, int count = 50, int skip = 0)
    {
        return await _context.ChatMessages
            .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                        (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderByDescending(m => m.Timestamp)
            .Skip(skip)
            .Take(count)
            .Include(m => m.Sender) // Include sender details
            .OrderBy(m => m.Timestamp) // Return in chronological order
            .ToListAsync();
    }

    public async Task<List<ChatMessage>> GetGlobalChatHistory(int count = 50)
    {
        return await _context.ChatMessages
            .Where(m => m.ReceiverId == null)
            .OrderByDescending(m => m.Timestamp)
            .Take(count)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .ToListAsync();
    }

    public async Task SendFriendRequest(string requesterId, string targetId)
    {
        // Check if exists
        var exists = await _context.Friendships.AnyAsync(f => 
            (f.RequesterId == requesterId && f.AddresseeId == targetId) ||
            (f.RequesterId == targetId && f.AddresseeId == requesterId));
            
        if (exists) return; // Already friends or pending

        var friendship = new Friendship
        {
            RequesterId = requesterId,
            AddresseeId = targetId,
            Status = FriendshipStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.Friendships.Add(friendship);
        await _context.SaveChangesAsync();
    }

    public async Task AcceptFriendRequest(string requesterId, string currentUserId)
    {
        var friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.RequesterId == requesterId && f.AddresseeId == currentUserId && f.Status == FriendshipStatus.Pending);
            
        if (friendship == null) return;
        
        friendship.Status = FriendshipStatus.Accepted;
        await _context.SaveChangesAsync();
    }

    public async Task<List<User>> GetFriends(string userId)
    {
        var sentComp = await _context.Friendships
            .Where(f => f.RequesterId == userId && f.Status == FriendshipStatus.Accepted && f.Addressee != null)
            .Select(f => f.Addressee!)
            .ToListAsync();
            
        var receivedComp = await _context.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Accepted && f.Requester != null)
            .Select(f => f.Requester!)
            .ToListAsync();
            
        return sentComp.Concat(receivedComp).ToList();
    }
    
    public async Task<List<Friendship>> GetFriendRequests(string userId) 
    {
        return await _context.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .ToListAsync();
    }
}
