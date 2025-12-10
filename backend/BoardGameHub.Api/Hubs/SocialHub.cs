using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace BoardGameHub.Api.Hubs;

[Authorize]
public class SocialHub : Hub
{
    // Mapped userId -> connectionId for quick lookup if needed, 
    // though SignalR Users group is usually sufficient.
    
    public async Task SendMessage(string targetUserId, string message)
    {
        var senderId = Context.UserIdentifier;
        // In a real app, save to DB here via service
        await Clients.User(targetUserId).SendAsync("ReceiveMessage", senderId, message);
    }

    public async Task SendGlobalMessage(string message)
    {
        var senderId = Context.UserIdentifier;
        await Clients.All.SendAsync("ReceiveGlobalMessage", senderId, message);
    }

    public async Task SendFriendRequest(string targetUserId)
    {
        var senderId = Context.UserIdentifier;
        // Logic to create friendship request in DB
        await Clients.User(targetUserId).SendAsync("ReceiveFriendRequest", senderId);
    }

    public async Task AcceptFriendRequest(string requesterId)
    {
        var currentUserId = Context.UserIdentifier;
        // Logic to update friendship status in DB
        await Clients.User(requesterId).SendAsync("FriendRequestAccepted", currentUserId);
    }
}
