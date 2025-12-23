using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Identity;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Hubs;

namespace BoardGameHub.Api.Controllers;

[Route("admin")]
public class AdminController : Controller
{
    private readonly RoomService _roomService;
    private readonly SocialService _socialService;
    private readonly IHubContext<GameHub> _gameHub;
    private readonly IHubContext<SocialHub> _socialHub;
    private readonly IWebHostEnvironment _env;
    private readonly UserManager<User> _userManager;

    public AdminController(
        RoomService roomService, 
        SocialService socialService,
        IHubContext<GameHub> gameHub,
        IHubContext<SocialHub> socialHub,
        IWebHostEnvironment env,
        UserManager<User> userManager)
    {
        _roomService = roomService;
        _socialService = socialService;
        _gameHub = gameHub;
        _socialHub = socialHub;
        _env = env;
        _userManager = userManager;
    }



    [HttpGet("stats")]
    public IActionResult GetStats()
    {
        if (!_env.IsDevelopment()) return NotFound();
        return Ok(_roomService.GetServerStats());
    }

    // --- Actions ---

    public record CreateRoomAuth(string HostName, string GameType);
    [HttpPost("rooms/create")]
    public IActionResult CreateRoom([FromBody] CreateRoomAuth req)
    {
        if (!_env.IsDevelopment()) return NotFound();
        Enum.TryParse<GameType>(req.GameType, true, out var type);
        var room = _roomService.CreateRoom(Guid.NewGuid().ToString(), req.HostName, true, type);
        return Ok(new { room.Code });
    }

    public record StartGameReq();
    [HttpPost("rooms/{code}/start")]
    public async Task<IActionResult> StartGame(string code)
    {
        if (!_env.IsDevelopment()) return NotFound();
        
        var room = _roomService.StartGame(code);
        if (room == null) return NotFound();

        await _gameHub.Clients.Group(code.ToUpper()).SendAsync("GameStarted", room);
        return Ok();
    }

    [HttpPost("rooms/{code}/terminate")]
    public async Task<IActionResult> TerminateRoom(string code)
    {
        if (!_env.IsDevelopment()) return NotFound();
        
        // Notify players first
        await _gameHub.Clients.Group(code.ToUpper()).SendAsync("RoomTerminated", "Room closed by administrator.");
        
        _roomService.TerminateRoom(code);
        return Ok();
    }

    public record UpdateSettingsReq(int TimerDurationSeconds);
    [HttpPost("rooms/{code}/settings")]
    public async Task<IActionResult> UpdateSettings(string code, [FromBody] UpdateSettingsReq req)
    {
        if (!_env.IsDevelopment()) return NotFound();
        var room = _roomService.GetRoom(code);
        if (room == null) return NotFound();

        var settings = new GameSettings { TimerDurationSeconds = req.TimerDurationSeconds }; // Simplified override
        _roomService.UpdateSettings(code, settings);

        await _gameHub.Clients.Group(code.ToUpper()).SendAsync("SettingsUpdated", settings);
        return Ok();
    }

    public record MsgReq(string Message, string Target);
    [HttpPost("rooms/message")]
    public async Task<IActionResult> SendMessage([FromBody] MsgReq req)
    {
        if (!_env.IsDevelopment()) return NotFound();
        
        if (req.Target == "global")
        {
             var adminUser = await _userManager.FindByNameAsync("SystemAdmin");
             if (adminUser == null)
             {
                 adminUser = new User { UserName = "SystemAdmin", DisplayName = "SYSTEM" };
                 var result = await _userManager.CreateAsync(adminUser, "AdminPassword123!");
                 if (!result.Succeeded) return StatusCode(500, "Failed to create system user");
             }

             await _socialService.SaveGlobalMessage(adminUser.Id, req.Message);
             await _socialHub.Clients.All.SendAsync("ReceiveGlobalMessage", "ADMIN", req.Message);
        }
        return Ok();
    }
}
