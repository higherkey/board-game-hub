using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;

using System.Security.Claims;

namespace BoardGameHub.Api.Hubs;

[Authorize]
public class SocialHub : Hub
{
    private readonly SocialService _socialService;

    public SocialHub(SocialService socialService)
    {
        _socialService = socialService;
    }

    public async Task SendMessage(string targetUserId, string message)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

        await _socialService.SaveChatMessage(senderId, targetUserId, message);
        await Clients.User(targetUserId).SendAsync("ReceiveMessage", senderId, message);
    }

    public async Task SendGlobalMessage(string message)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

        await _socialService.SaveGlobalMessage(senderId, message);
        await Clients.All.SendAsync("ReceiveGlobalMessage", senderId, message);
    }

    public async Task SendFriendRequest(string targetUserId)
    {
        var senderId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(senderId)) return;

        await _socialService.SendFriendRequest(senderId, targetUserId);
        await Clients.User(targetUserId).SendAsync("ReceiveFriendRequest", senderId);
    }

    public async Task AcceptFriendRequest(string requesterId)
    {
        var currentUserId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(currentUserId)) return;

        await _socialService.AcceptFriendRequest(requesterId, currentUserId);
        await Clients.User(requesterId).SendAsync("FriendRequestAccepted", currentUserId);
    }

    public async Task<List<ChatMessage>> GetGlobalChatHistory()
    {
        return await _socialService.GetGlobalChatHistory(50);
    }

    public async Task<List<Models.User>> GetFriends()
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return new List<Models.User>();
        return await _socialService.GetFriends(userId);
    }
    
    public async Task<List<Friendship>> GetFriendRequests()
    {
        var userId = Context.UserIdentifier;
        if (string.IsNullOrEmpty(userId)) return new List<Friendship>();
        return await _socialService.GetFriendRequests(userId);
    }
}
