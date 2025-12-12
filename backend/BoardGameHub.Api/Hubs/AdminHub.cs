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
}
