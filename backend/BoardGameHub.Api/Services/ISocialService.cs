using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public interface ISocialService
{
    Task SaveChatMessage(string senderId, string? receiverId, string message);
    Task SaveGlobalMessage(string senderId, string message);
    Task<List<ChatMessage>> GetPrivateChatHistory(string userId1, string userId2, int count = 50, int skip = 0);
    Task<List<ChatMessage>> GetGlobalChatHistory(int count = 50);
    Task SendFriendRequest(string requesterId, string targetId);
    Task AcceptFriendRequest(string requesterId, string currentUserId);
    Task<List<User>> GetFriends(string userId);
    Task<List<Friendship>> GetFriendRequests(string userId);
}
