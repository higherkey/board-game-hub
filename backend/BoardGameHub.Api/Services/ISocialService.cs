using BoardGameHub.Api.Models;
using BoardGameHub.Api.Models.Dtos;

namespace BoardGameHub.Api.Services;

public interface ISocialService
{
    Task SaveChatMessage(string senderId, string? receiverId, string message);
    Task SaveGlobalMessage(string senderId, string message);
    Task<List<ChatMessageDto>> GetPrivateChatHistory(string userId1, string userId2, int count = 50, int skip = 0);
    Task<List<ChatMessageDto>> GetGlobalChatHistory(int count = 50);
    Task SendFriendRequest(string requesterId, string targetId);
    Task AcceptFriendRequest(string requesterId, string currentUserId);
    Task RemoveFriend(string currentUserId, string friendId);
    Task<List<UserDto>> GetFriends(string userId);
    Task<List<FriendRequestDto>> GetFriendRequests(string userId);
}
