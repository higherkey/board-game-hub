using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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

    public AdminController(
        RoomService roomService, 
        SocialService socialService,
        IHubContext<GameHub> gameHub,
        IHubContext<SocialHub> socialHub,
        IWebHostEnvironment env)
    {
        _roomService = roomService;
        _socialService = socialService;
        _gameHub = gameHub;
        _socialHub = socialHub;
        _env = env;
    }

    [HttpGet]
    public IActionResult Index()
    {
        if (!_env.IsDevelopment()) return NotFound();

        var html = """
<!DOCTYPE html>
<html lang='en'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>Backend Admin</title>
    <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>
    <style>
        body { background: #f8f9fa; padding: 20px; }
        .card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: none; margin-bottom: 20px; }
        .metric-value { font-size: 2rem; font-weight: bold; }
        .badge-scatterbrain { background-color: #0d6efd; }
        .badge-babble { background-color: #ffc107; color: black; }
        .actions-col { width: 250px; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='d-flex justify-content-between align-items-center mb-4'>
            <h1>Backend Admin Dashboard</h1>
            <div>
                 <button class='btn btn-primary' data-bs-toggle='modal' data-bs-target='#createRoomModal'>+ Create Room</button>
                 <button class='btn btn-info text-white' data-bs-toggle='modal' data-bs-target='#messageModal'>Global Msg</button>
            </div>
        </div>

        <div class='row' id='metrics'></div>

        <div class='card'>
             <div class='card-header'>Active Rooms</div>
             <div class='card-body p-0'>
                 <table class='table table-striped mb-0'>
                     <thead>
                         <tr>
                             <th>Code</th>
                             <th>Game</th>
                             <th>Host</th>
                             <th>Players</th>
                             <th>State</th>
                             <th class='actions-col'>Actions</th>
                         </tr>
                     </thead>
                     <tbody id='rooms-table'></tbody>
                 </table>
             </div>
        </div>
    </div>

    <!-- Create Room Modal -->
    <div class='modal fade' id='createRoomModal' tabindex='-1'>
        <div class='modal-dialog'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title'>Create New Room</h5>
                    <button type='button' class='btn-close' data-bs-dismiss='modal'></button>
                </div>
                <div class='modal-body'>
                    <div class='mb-3'>
                        <label class='form-label'>Host Name (Bot)</label>
                        <input type='text' class='form-control' id='createHostName' value='AdminBot'>
                    </div>
                    <div class='mb-3'>
                        <label class='form-label'>Game Type</label>
                        <select class='form-select' id='createGameType'>
                            <option value='Scatterbrain'>Scatterbrain</option>
                            <option value='Boggle'>Boggle</option>
                        </select>
                    </div>
                </div>
                <div class='modal-footer'>
                   <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancel</button>
                   <button type='button' class='btn btn-primary' onclick='submitCreateRoom()'>Create</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Global Message Modal -->
    <div class='modal fade' id='messageModal' tabindex='-1'>
        <div class='modal-dialog'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title'>Send Global Message</h5>
                    <button type='button' class='btn-close' data-bs-dismiss='modal'></button>
                </div>
                <div class='modal-body'>
                    <div class='mb-3'>
                        <label class='form-label'>Message</label>
                        <textarea class='form-control' id='globalMessageContent' rows='3'></textarea>
                    </div>
                </div>
                <div class='modal-footer'>
                   <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancel</button>
                   <button type='button' class='btn btn-primary' onclick='submitGlobalMessage()'>Send</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Settings Modal -->
    <div class='modal fade' id='settingsModal' tabindex='-1'>
        <div class='modal-dialog'>
            <div class='modal-content'>
                <div class='modal-header'>
                    <h5 class='modal-title'>Room Settings</h5>
                    <button type='button' class='btn-close' data-bs-dismiss='modal'></button>
                </div>
                <div class='modal-body'>
                    <input type='hidden' id='settingsRoomCode'>
                    <div class='mb-3'>
                        <label class='form-label'>Timer Duration (Seconds)</label>
                        <input type='number' class='form-control' id='settingsDuration' value='60'>
                    </div>
                </div>
                <div class='modal-footer'>
                   <button type='button' class='btn btn-secondary' data-bs-dismiss='modal'>Cancel</button>
                   <button type='button' class='btn btn-primary' onclick='submitSettings()'>Save Changes</button>
                </div>
            </div>
        </div>
    </div>

    <script src='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'></script>
    <script>
        // API Helpers
        async function post(url, data) {
            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error(await res.text());
                loadStats(); // Reload
                return true;
            } catch (e) {
                alert('Error: ' + e.message);
                return false;
            }
        }

        // --- Actions ---

        async function submitCreateRoom() {
            const host = document.getElementById('createHostName').value;
            const game = document.getElementById('createGameType').value;
            if(!host) return;

            if (await post('/admin/rooms/create', { hostName: host, gameType: game })) {
                bootstrap.Modal.getInstance(document.getElementById('createRoomModal')).hide();
            }
        }

        async function submitGlobalMessage() {
            const msg = document.getElementById('globalMessageContent').value;
            if(!msg) return;

            if (await post('/admin/rooms/message', { message: msg, target: 'global' })) {
                document.getElementById('globalMessageContent').value = ''; // Clear
                bootstrap.Modal.getInstance(document.getElementById('messageModal')).hide();
            }
        }

        function openSettings(code) {
             document.getElementById('settingsRoomCode').value = code;
             // Ideally fetch current settings here, but defaulting to 60 for now
             new bootstrap.Modal(document.getElementById('settingsModal')).show();
        }

        async function submitSettings() {
             const code = document.getElementById('settingsRoomCode').value;
             const duration = document.getElementById('settingsDuration').value;
             if(!code || !duration) return;

             if (await post(`/admin/rooms/${code}/settings`, { timerDurationSeconds: parseInt(duration) })) {
                bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
             }
        }

        async function terminateRoom(code) {
            if (!confirm(`Are you sure you want to terminate room ${code}?`)) return;
            await post(`/admin/rooms/${code}/terminate`, {});
        }

        // Render Logic
        async function loadStats() {
            try {
                const response = await fetch('/admin/stats');
                if (!response.ok) throw new Error('Failed to load');
                const stats = await response.json();
                render(stats);
            } catch (e) { console.error(e); }
        }

        function render(stats) {
            // Metrics
            document.getElementById('metrics').innerHTML = `
                <div class='col-md-4'><div class='card p-3'><div class='text-muted'>Rooms</div><div class='metric-value'>${stats.activeRooms}</div></div></div>
                <div class='col-md-4'><div class='card p-3'><div class='text-muted'>Players</div><div class='metric-value'>${stats.totalOnlinePlayers}</div></div></div>
                <div class='col-md-4'><div class='card p-3'><div class='text-muted'>Uptime</div><div class='metric-value'>${stats.uptime.split('.')[0]}</div></div></div>
            `;

            // Rooms table
            const tbody = document.getElementById('rooms-table');
            if (stats.rooms.length === 0) {
                tbody.innerHTML = '<tr><td colspan=\'6\' class=\'text-center p-3\'>No active rooms</td></tr>';
                return;
            }

            tbody.innerHTML = stats.rooms.map(room => {
                const isLobby = room.globalState === 'Lobby';
                
                // Players List Logic
                const playersHtml = room.players.map(p => `
                    <li class='list-group-item d-flex justify-content-between align-items-center'>
                        <span>
                            ${p.isHost ? '<span class=\'badge bg-primary me-2\'>Host</span>' : ''}
                            ${p.name} 
                            ${p.userId ? `<a href='http://localhost:4200/profile/${p.userId}' target='_blank' class='ms-2 badge bg-secondary text-decoration-none'>Profile</a>` : '<span class=\'badge bg-light text-dark ms-2\'>Guest</span>'}
                        </span>
                        <span class='badge bg-info text-dark rounded-pill'>Score: ${p.score}</span>
                    </li>
                `).join('');

                return `
                <tr>
                    <td><code>${room.code}</code></td>
                    <td><span class='badge ${room.gameType === 'Scatterbrain' ? 'badge-scatterbrain' : 'badge-babble'}'>${room.gameType}</span></td>
                    <td>${room.hostName}</td>
                    <td>${room.playerCount}</td>
                    <td>${room.globalState}</td>
                    <td>
                        ${isLobby ? `<button class='btn btn-sm btn-success me-1' onclick='startGame("${room.code}")'>Start</button>` : ''}
                        <button class='btn btn-sm btn-outline-secondary' onclick='openSettings("${room.code}")'>Settings</button>
                        <button class='btn btn-sm btn-outline-danger' onclick='terminateRoom("${room.code}")'>End</button>
                        <button class='btn btn-sm btn-link' type='button' data-bs-toggle='collapse' data-bs-target='#details-${room.code}'>
                             Details &#9660;
                        </button>
                    </td>
                </tr>
                <tr class='collapse' id='details-${room.code}'>
                    <td colspan='6' class='p-3 bg-light'>
                        <div class='row'>
                            <div class='col-md-4'>
                                <h6>Game Info</h6>
                                <ul class='list-unstyled'>
                                    <li><strong>Round:</strong> ${room.roundNumber}</li>
                                    <li><strong>Timer Duration:</strong> ${room.settingsTimer}s</li>
                                    <li><strong>Access:</strong> ${room.isPublic ? 'Public' : 'Private'}</li>
                                </ul>
                            </div>
                            <div class='col-md-8'>
                                <h6>Players (${room.players.length})</h6>
                                <ul class='list-group list-group-flush small'>
                                    ${playersHtml}
                                </ul>
                            </div>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');
        }
        
        async function startGame(code) {
             if (!confirm(`Start game for room ${code}?`)) return;
             await post(`/admin/rooms/${code}/start`, {});
        }

        setInterval(loadStats, 3000);
        loadStats();
    </script>
</body>
</html>
""";
        return Content(html, "text/html");
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
             await _socialService.SaveGlobalMessage("ADMIN", req.Message);
             await _socialHub.Clients.All.SendAsync("ReceiveGlobalMessage", "ADMIN", req.Message);
        }
        return Ok();
    }
}
