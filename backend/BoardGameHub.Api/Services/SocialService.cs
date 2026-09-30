using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Models.Dtos;
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

    public async Task<List<ChatMessageDto>> GetPrivateChatHistory(string userId1, string userId2, int count = 50, int skip = 0)
    {
        return await _context.ChatMessages
            .Where(m => (m.SenderId == userId1 && m.ReceiverId == userId2) ||
                        (m.SenderId == userId2 && m.ReceiverId == userId1))
            .OrderByDescending(m => m.Timestamp)
            .Skip(skip)
            .Take(count)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = m.ReceiverId,
                Content = m.Content,
                Timestamp = m.Timestamp,
                IsGlobal = false,
                Sender = m.Sender == null ? null : new UserDto
                {
                    Id = m.Sender.Id,
                    UserName = m.Sender.UserName ?? string.Empty,
                    DisplayName = m.Sender.DisplayName,
                    AvatarUrl = m.Sender.AvatarUrl
                }
            })
            .ToListAsync();
    }

    public async Task<List<ChatMessageDto>> GetGlobalChatHistory(int count = 50)
    {
        return await _context.ChatMessages
            .Where(m => m.ReceiverId == null)
            .OrderByDescending(m => m.Timestamp)
            .Take(count)
            .Include(m => m.Sender)
            .OrderBy(m => m.Timestamp)
            .Select(m => new ChatMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                ReceiverId = null,
                Content = m.Content,
                Timestamp = m.Timestamp,
                IsGlobal = true,
                Sender = m.Sender == null ? null : new UserDto
                {
                    Id = m.Sender.Id,
                    UserName = m.Sender.UserName ?? string.Empty,
                    DisplayName = m.Sender.DisplayName,
                    AvatarUrl = m.Sender.AvatarUrl
                }
            })
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

    public async Task RemoveFriend(string currentUserId, string friendId)
    {
        var friendship = await _context.Friendships.FirstOrDefaultAsync(f =>
            ((f.RequesterId == currentUserId && f.AddresseeId == friendId) ||
             (f.RequesterId == friendId && f.AddresseeId == currentUserId)) &&
            f.Status == FriendshipStatus.Accepted);

        if (friendship != null)
        {
            _context.Friendships.Remove(friendship);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<UserDto>> GetFriends(string userId)
    {
        var sentComp = await _context.Friendships
            .Where(f => f.RequesterId == userId && f.Status == FriendshipStatus.Accepted && f.Addressee != null)
            .Select(f => new UserDto
            {
                Id = f.Addressee!.Id,
                UserName = f.Addressee.UserName ?? string.Empty,
                DisplayName = f.Addressee.DisplayName,
                AvatarUrl = f.Addressee.AvatarUrl
            })
            .ToListAsync();
            
        var receivedComp = await _context.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Accepted && f.Requester != null)
            .Select(f => new UserDto
            {
                Id = f.Requester!.Id,
                UserName = f.Requester.UserName ?? string.Empty,
                DisplayName = f.Requester.DisplayName,
                AvatarUrl = f.Requester.AvatarUrl
            })
            .ToListAsync();
            
        return sentComp.Concat(receivedComp).ToList();
    }
    
    public async Task<List<FriendRequestDto>> GetFriendRequests(string userId) 
    {
        return await _context.Friendships
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .Include(f => f.Requester)
            .Select(f => new FriendRequestDto
            {
                Id = f.Id,
                RequesterId = f.RequesterId,
                AddresseeId = f.AddresseeId,
                Status = f.Status,
                CreatedAt = f.CreatedAt,
                Requester = f.Requester == null ? null : new UserDto
                {
                    Id = f.Requester.Id,
                    UserName = f.Requester.UserName ?? string.Empty,
                    DisplayName = f.Requester.DisplayName,
                    AvatarUrl = f.Requester.AvatarUrl
                }
            })
            .ToListAsync();
    }
}
