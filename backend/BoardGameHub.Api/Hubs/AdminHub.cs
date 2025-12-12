using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace BoardGameHub.Api.Hubs;

[Authorize]
public class AdminHub : Hub
{
    private readonly RoomService _roomService;

    public AdminHub(RoomService roomService)
    {
        _roomService = roomService;
    }

    public async Task<ServerStats> GetStats()
    {
        return await Task.FromResult(_roomService.GetServerStats());
    }

    public async Task KickPlayer(string roomCode, string connectionId)
    {
        // This should probably notify the kicked player and the room
        _roomService.RemovePlayer(connectionId);
        
        var room = _roomService.GetRoom(roomCode);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("PlayerJoined", room.Players);
        }
        await Clients.Client(connectionId).SendAsync("Kicked");
    }

    public async Task PromoteToHost(string roomCode, string connectionId)
    {
        var room = _roomService.PromoteToHost(roomCode, connectionId);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
             await Clients.Group(roomCode).SendAsync("HostPromoted", connectionId);
        }
    }

    public async Task ForceAddPlayer(string roomCode, string playerName)
    {
         // Debug method to add a fake player
         var room = _roomService.JoinRoom(roomCode, Guid.NewGuid().ToString(), playerName, null, null);
         if (room != null)
         {
             await Clients.Group(roomCode).SendAsync("PlayerJoined", room.Players);
         }
    }
}
