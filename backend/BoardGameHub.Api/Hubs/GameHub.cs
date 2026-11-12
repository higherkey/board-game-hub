using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace BoardGameHub.Api.Hubs;
using System.Security.Claims;
using System.Text.Json;
using BoardGameHub.Api.Models; // Explicitly for GameSettings


public class GameHub : Hub
{
    private readonly IRoomService _roomService;
    private readonly IGameHistoryService _historyService;
    private readonly IConfiguration _configuration;

    public async Task<List<GameSessionPlayer>> GetGameHistory()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return new List<GameSessionPlayer>();

        return await _historyService.GetUserGameHistory(userId, 20);
    }

    public async Task SubmitAction(string roomCode, string actionType, JsonElement payload)
    {
        // State update broadcast via GameStateManager
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, actionType, payload);
    }

    private readonly ILogger<GameHub> _logger;

    public GameHub(IRoomService roomService, IGameHistoryService historyService, ILogger<GameHub> logger, IConfiguration configuration)
    {
        _roomService = roomService;
        _historyService = historyService;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task JoinLobby()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, "LobbyGroup");
    }

    public async Task LeaveLobby()
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "LobbyGroup");
    }

    public Task<List<string>> ValidateRooms(List<string> codes)
    {
        return Task.FromResult(_roomService.ValidateRooms(codes));
    }

    public async Task<Room> CreateRoom(string playerName, bool isPublic, string gameType = "OneAndOnly", string? guestId = null, bool isScreen = false)
    {
        if (!Enum.TryParse<GameType>(gameType, true, out var type))
        {
            throw new HubException("Unknown game type.");
        }
        var userId = ResolveUserId(guestId);
        // If logged in, preferred username might come from claims, or they can override it. 
        // For now, let's prioritize the submitted name, but link the userId.
        var avatarUrl = Context.User?.FindFirst("AvatarUrl")?.Value;

        var room = _roomService.CreateRoom(Context.ConnectionId, playerName, isPublic, type, userId, avatarUrl, isScreen);
        
        // Log creation
        _logger.LogInformation("[GameHub] Room Created: {Code}, GameType: {GameType}, Host: {Host}", room.Code, room.GameType, playerName);

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        // Send TURN credentials to the creator
        await SendTurnCredentialsToClient();

        // Broadcast to the creator (and anyone else in the group, though it's just them)
        await Clients.Group(room.Code.ToUpper()).SendAsync("PlayerJoined", room.Players);

        // Private Session Token for Reconnection
        var callerPlayer = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
        if (callerPlayer != null)
        {
            await Clients.Caller.SendAsync("SessionAssigned", callerPlayer.SessionId);
        }
        
        // Public Lobby Update
        if (room.IsPublic)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomCreated", room);
        }

        return room;
    }

    public async Task StartGame(string roomCode, GameSettings settings)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        if (existingRoom.State == GameState.Lobby && !existingRoom.CanStartNewGame())
        {
            throw new HubException("Cannot start yet: every player must be ready, or the host must force room ready.");
        }

        var room = await _roomService.StartGame(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("GameStarted", room);
            // If game starts, does it vanish from public lobby? Usually "Lobby" state rooms are shown.
            // When State becomes "Playing", it disappears from GetPublicRooms().
            // So we should broadcast this as a deletion (or update that implies removal).
            // Let's assume frontend filters by state, or we send a delete if state changes.
            // GetPublicRooms filters by `r.State == GameState.Lobby`.
            // So if state changes to Playing, we should send "PublicRoomDeleted" (from the list perspective) or "PublicRoomUpdated".
            // Sending "PublicRoomDeleted" is cleaner for the list.
            if (room.IsPublic)
            {
                 // Removing from public view
                 await Clients.Group("LobbyGroup").SendAsync("PublicRoomDeleted", roomCode);
            }
        }
    }

    public async Task PauseGame(string roomCode)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        await _roomService.PauseGame(roomCode);
    }

    public async Task ResumeGame(string roomCode)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        await _roomService.ResumeGame(roomCode);
    }

    public async Task EndGame(string roomCode)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        var room = await _roomService.EndGame(roomCode);
        if (room == null || room.State != GameState.Lobby) return;

        // Ending from the results screen returns everyone to game selection (#79).
        await Clients.Group(NormalizeCode(roomCode)).SendAsync("GameTypeChanged", room.GameType.ToString());
        if (room.IsPublic)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
        }
    }

    public async Task SetGameType(string roomCode, string gameType)
    {
        _logger.LogInformation("[GameHub] SetGameType Request: Room={Room}, Type={GameType}", roomCode, gameType);
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            var existingRoom = _roomService.GetRoom(roomCode);
            if (existingRoom == null)
            {
                _logger.LogWarning("[GameHub] SetGameType Failed: Room {Room} not found in RoomService.", roomCode);
                return;
            }
            EnsureHost(existingRoom);

            var room = _roomService.SetGameType(roomCode, type);
            if (room != null)
            {
                _logger.LogInformation("[GameHub] SetGameType Success: Room={Room}, Enum={Enum}", roomCode, type);
                await Clients.Group(NormalizeCode(roomCode)).SendAsync("GameTypeChanged", type.ToString());
                // Redundant broadcast removed? Or kept for legacy? 
                // Clients.All is definitely bad. Removing it.
                // await Clients.All.SendAsync("RoomGameTypeChanged", roomCode.ToUpper(), type.ToString());
                
                if (room.IsPublic)
                {
                    // If switching back to Lobby state (SetGameType logic does this), it reappears!
                    if (room.State == GameState.Lobby)
                    {
                         await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
                         // Or "PublicRoomCreated" if it wasn't there? "Updated" is safer if upsert logic used.
                    }
                }
            }
            else
            {
                _logger.LogWarning("[GameHub] SetGameType Failed: Room {Room} not found in RoomService.", roomCode);
            }
        }
        else
        {
            _logger.LogWarning("[GameHub] SetGameType Failed: Could not parse {GameType} as GameType enum.", gameType);
        }
    }

    public async Task SetHostPlayer(string roomCode, string targetConnectionId)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        var room = _roomService.SetHostPlayer(roomCode, targetConnectionId);
        if (room != null && room.IsPublic && room.State == GameState.Lobby)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
        }
    }

    public async Task RemoveHostPlayer(string roomCode, string targetConnectionId)
    {
        var room = _roomService.RemoveHostPlayer(roomCode, Context.ConnectionId, targetConnectionId);
        if (room != null)
        {
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("RoomUpdated", room);
        }
    }

    public Task VoteNextGame(string roomCode, string gameType)
    {
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            _roomService.VoteNextGame(roomCode, Context.ConnectionId, type);
        }
        return Task.CompletedTask;
    }
    
    public async Task UpdateSettings(string roomCode, GameSettings settings)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        var room = _roomService.UpdateSettings(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("SettingsUpdated", settings);
            if (room.IsPublic && room.State == GameState.Lobby)
            {
                 // Settings (like timer) don't show on card usually, but good to keep sync.
                 await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
            }
        }
    }



    public Task UpdateUndoSettings(string roomCode, UndoSettings settings)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return Task.CompletedTask;
        EnsureHost(existingRoom);

        _roomService.UpdateUndoSettings(roomCode, settings);
        return Task.CompletedTask;
    }

    public async Task RequestUndo(string roomCode)
    {
        var room = await _roomService.RequestUndo(roomCode, Context.ConnectionId);
        if (room != null)
        {
            // If room returned, check if Vote started or Undo happened
            if (room.CurrentVote != null)
            {
                await Clients.Group(NormalizeCode(roomCode)).SendAsync("UndoVoteStarted", room.CurrentVote);
            }
            else
            {
                // Immediate undo happened
                // await Clients.Group(NormalizeCode(roomCode)).SendAsync("GameRestored", room); 
                // Let the GameStateManager handle the state update.
            }
        }
    }

    public async Task SubmitUndoVote(string roomCode, bool vote)
    {
        var submission = await _roomService.SubmitUndoVote(roomCode, Context.ConnectionId, vote);
        if (submission == null) return;

        if (submission.Result == UndoVoteResult.Pending)
        {
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("UndoVoteUpdate", submission.Room.CurrentVote);
        }
        else
        {
            // Retain the event name and single string argument for older clients.
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("UndoVoteFinished", submission.Result.ToString());
        }
    }

    public async Task<List<Room>> GetPublicRooms()
    {
        return await Task.FromResult(_roomService.GetPublicRooms());
    }

    public async Task<Room?> JoinRoom(string roomCode, string playerName, string? guestId = null, bool isScreen = false, string? sessionId = null)
    {
        var userId = ResolveUserId(guestId);
        var avatarUrl = Context.User?.FindFirst("AvatarUrl")?.Value;

        var room = _roomService.JoinRoom(roomCode, Context.ConnectionId, playerName, userId, avatarUrl, isScreen, sessionId);
        if (room == null) return null;

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        
        // Send TURN credentials to the joining player
        await SendTurnCredentialsToClient();

        // Private Session Token for Reconnection
        var callerPlayer = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
        if (callerPlayer != null)
        {
            await Clients.Caller.SendAsync("SessionAssigned", callerPlayer.SessionId);
        }
        
        // Notify others in group
        await Clients.Group(room.Code).SendAsync("PlayerJoined", room.Players);
        
        // Public Lobby Update
        if (room.IsPublic && room.State == GameState.Lobby)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
        }

        return room;
    }

    public async Task ToggleReady(string roomCode, bool? forcedState = null)
    {
        if (forcedState != null)
        {
            _logger.LogInformation("[Hub] Host override ToggleReady: {RoomCode}, ForcedState: {State}", roomCode, forcedState);
        }
        var room = _roomService.ToggleReady(roomCode, Context.ConnectionId, forcedState);
        if (room != null)
        {
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("RoomUpdated", room);
        }
    }

    public async Task RenamePlayer(string newName)
    {
        var room = _roomService.RenamePlayer(Context.ConnectionId, newName);
        if (room != null)
        {
            // Broadcast generic PlayerJoined to update the list, or we could make a specific PlayerRenamed event
            // Re-using PlayerJoined is easiest for now as the frontend likely just refreshes the list.
            await Clients.Group(room.Code).SendAsync("PlayerJoined", room.Players);
            
            if (room.IsPublic && room.State == GameState.Lobby)
            {
                await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
            }
        }
    }

    public Task ChangeRole(bool isScreen)
    {
        var room = _roomService.ChangeRole(Context.ConnectionId, isScreen);
        if (room != null)
        {
            // await Clients.Group(room.Code).SendAsync("RoomUpdated", room);
        }
        return Task.CompletedTask;
    }

    public async Task SubmitAnswers(string roomCode, List<string> answers)
    {
        var payload = JsonSerializer.SerializeToElement(new { answers });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_ANSWERS", payload);
    }

    public async Task SubmitClue(string roomCode, string clue)
    {
        var payload = JsonSerializer.SerializeToElement(new { clue });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_CLUE", payload);
    }

    public async Task SubmitGuess(string roomCode, string guess)
    {
        var payload = JsonSerializer.SerializeToElement(new { guess });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_GUESS", payload);
    }

    public async Task SubmitBreakingNewsSlot(string roomCode, int slotId, string value)
    {
        var payload = JsonSerializer.SerializeToElement(new { slotId, value });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_SLOT", payload);
    }

    // --- Deepfake Methods ---
    
    public async Task SubmitPictophonePage(string roomCode, string content)
    {
        var payload = JsonSerializer.SerializeToElement(new { content });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_PAGE", payload);
    }

    public async Task SubmitPictophoneDraft(string roomCode, string content)
    {
        var payload = JsonSerializer.SerializeToElement(new { content });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_DRAFT", payload);
    }

    public async Task ForcePictophoneNext(string roomCode)
    {
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "FORCE_NEXT_PHASE", null);
    }

    public async Task RevealPictophoneNext(string roomCode)
    {
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "REVEAL_NEXT", null);
    }

    public async Task StarPictophonePage(string roomCode, int bookIndex, int pageIndex)
    {
        var payload = JsonSerializer.SerializeToElement(new { bookIndex, pageIndex });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "STAR_PAGE", payload);
    }

    public List<string> GetPictophoneSuggestions()
    {
        var service = _roomService.GetGameService<PictophoneService>(GameType.Pictophone);
        return service?.GetPromptSuggestions() ?? new List<string>();
    }

    public List<ScatterbrainData.ListMetadata> GetScatterbrainLists()
    {
        return ScatterbrainData.GetListsMetadata();
    }

    public async Task DeepfakeStroke(string roomCode, string pathData, string color)
    {
        var payload = JsonSerializer.SerializeToElement(new { pathData, color });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_STROKE", payload);
        // Stroke is handled by optimized path? 
        // If we want strokes to be delta compressed, we rely on game loop.
        // But usually strokes are high frequency and might bypass state for latency?
        // Current implementation puts them in state. So delta engine picks it up.
        // But 50ms latency for drawing might be jerky.
        // Ideally strokes are replayed. This architecture V2 uses StateDiff. 
        // Let's stick to the plan.
    }

    public async Task DeepfakeVote(string roomCode, string accusedId)
    {
        var payload = JsonSerializer.SerializeToElement(new { accusedId });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
    }

    public async Task DeepfakeAiGuess(string roomCode, string guess)
    {
        var payload = JsonSerializer.SerializeToElement(new { guess });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_AI_GUESS", payload);
    }

    // --- Wisecrack Methods ---

    public async Task SubmitWisecrackAnswer(string roomCode, string promptId, string answer)
    {
        var payload = JsonSerializer.SerializeToElement(new { promptId, answer });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_ANSWER", payload);
    }

    public async Task SubmitWisecrackVote(string roomCode, int choice)
    {
        var payload = JsonSerializer.SerializeToElement(new { choice });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
    }

    public async Task NextWisecrackBattle(string roomCode)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "NEXT_BATTLE", null);
    }


    public async Task SubmitPoppycockDefinition(string roomCode, string definition)
    {
        var payload = JsonSerializer.SerializeToElement(new { definition });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_DEFINITION", payload);
    }

    public async Task SubmitPoppycockVote(string roomCode, string votedId)
    {
        var payload = JsonSerializer.SerializeToElement(new { votedId });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
    }

    public async Task EndRound(string roomCode)
    {
        try
        {
            if (string.IsNullOrEmpty(roomCode)) return;

            var existingRoom = _roomService.GetRoom(roomCode);
            if (existingRoom == null) return;
            EnsureHost(existingRoom);

            var room = await _roomService.CalculateRoundScores(roomCode.Trim().ToUpperInvariant());

            if (room != null)
            {
                await Clients.Group(NormalizeCode(roomCode)).SendAsync("RoundEnded", room);
            }
        }
        catch (HubException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in EndRound for room {RoomCode}", roomCode);
            throw new HubException("An unexpected error occurred during score calculation.");
        }
    }

    public async Task NextRound(string roomCode)
    {
        if (string.IsNullOrEmpty(roomCode)) return;

        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        // Start next round with same settings, but new letter/list
        var room = await _roomService.StartGame(roomCode, null); 
        if (room != null)
        {
           await Clients.Group(NormalizeCode(roomCode)).SendAsync("GameStarted", room);
           
           if (room.IsPublic && room.State == GameState.Playing)
           {
                // Game started from Lobby -> Delete from public list
                await Clients.Group("LobbyGroup").SendAsync("PublicRoomDeleted", roomCode);
           }
        }
    }

    public async Task SendMessage(string roomCode, string message)
    {
        var room = _roomService.GetRoom(NormalizeCode(roomCode));
        if (room == null || !_roomService.IsRoomMember(room, Context.ConnectionId)) return;
        await Clients.Group(room.Code).SendAsync("ReceiveMessage", Context.ConnectionId, message);
    }

    // WebRTC Signaling Methods: relay only between connections in the same room.
    public async Task SendOffer(string targetConnectionId, string sdp)
    {
        if (!_roomService.AreInSameRoom(Context.ConnectionId, targetConnectionId)) return;
        await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", Context.ConnectionId, sdp);
    }

    public async Task SendAnswer(string targetConnectionId, string sdp)
    {
        if (!_roomService.AreInSameRoom(Context.ConnectionId, targetConnectionId)) return;
        await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", Context.ConnectionId, sdp);
    }

    public async Task SendIceCandidate(string targetConnectionId, string candidate)
    {
        if (!_roomService.AreInSameRoom(Context.ConnectionId, targetConnectionId)) return;
        await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidate);
    }
    
    public async Task LeaveRoom(string roomCode)
    {
        var room = _roomService.RemovePlayer(Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, NormalizeCode(roomCode));
        
        // Notify others that player left (if room still exists)
        if (room != null)
        {
            await Clients.Group(NormalizeCode(roomCode)).SendAsync("PlayerJoined", room.Players);
            
            if (room.IsPublic && room.State == GameState.Lobby)
            {
                 await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
            }
        }
    }

    // --- Symbology Methods ---

    public async Task SymbologyPlaceMarker(string roomCode, string icon, string markerType, string color)
    {
        var payload = JsonSerializer.SerializeToElement(new { icon, markerType, color });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "PLACE_MARKER", payload);
    }

    public async Task SymbologyRemoveMarker(string roomCode, string markerId)
    {
        var payload = JsonSerializer.SerializeToElement(new { markerId });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "REMOVE_MARKER", payload);
    }

    public async Task UniversalTranslatorToken(string roomCode, string token)
    {
        var payload = JsonSerializer.SerializeToElement(new { token });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_TOKEN", payload);
    }

    public async Task UniversalTranslatorVote(string roomCode, string targetId)
    {
        var payload = JsonSerializer.SerializeToElement(new { accusedId = targetId });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
    }
    
    public async Task UniversalTranslatorForcePhase(string roomCode, string phaseName)
    {
        var existingRoom = _roomService.GetRoom(roomCode);
        if (existingRoom == null) return;
        EnsureHost(existingRoom);

        var payload = JsonSerializer.SerializeToElement(new { phase = phaseName });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "FORCE_PHASE", payload);
    }

    public async Task UniversalTranslatorPickWord(string roomCode, string word)
    {
        var payload = JsonSerializer.SerializeToElement(new { word });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "PICK_WORD", payload);
    }

    public async Task SubmitSushiTrainSelection(string roomCode, string cardId)
    {
        var payload = JsonSerializer.SerializeToElement(new { cardId });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_SELECTION", payload);
    }

    public async Task ToggleSushiTrainChopsticks(string roomCode)
    {
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "TOGGLE_CHOPSTICKS", null);
    }

    public async Task SubmitGreatMindsCard(string roomCode, int cardValue)
    {
        var payload = JsonSerializer.SerializeToElement(new { cardValue });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "PLAY_CARD", payload);
        // Room update is handled by specialized broadcasts in GameService
        if (room != null)
        {
             // Optional: Broadcast generic update if needed
        }
    }

    public async Task SubmitGreatMindsSync(string roomCode)
    {
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SYNC_TOKEN", null);
    }

    public async Task CloverDragMove(string roomCode, string cardId, double x, double y)
    {
        var room = _roomService.GetRoom(NormalizeCode(roomCode));
        if (room == null || !_roomService.IsRoomMember(room, Context.ConnectionId)) return;
        // Direct relay to others in the room to keep dragging smooth and bypass state persistence
        await Clients.OthersInGroup(room.Code).SendAsync("CloverCardMoved", Context.ConnectionId, cardId, x, y);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var room = _roomService.RemovePlayer(Context.ConnectionId);
        
        if (room != null)
        {
             // Notify the room group, because RemovePlayer only does internal logic
             // But wait, RemovePlayer returns the room object.
             // We need to notify the room that a player left.
             await Clients.Group(room.Code).SendAsync("PlayerJoined", room.Players);
             
             if (room.IsPublic && room.State == GameState.Lobby)
             {
                 await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
             }
        }
        
        await base.OnDisconnectedAsync(exception);
    }
    
    private async Task SendTurnCredentialsToClient()
    {
        var turnConfig = _configuration.GetSection("TurnServer").Get<TurnCredentials>();
        if (turnConfig != null && !string.IsNullOrEmpty(turnConfig.Url))
        {
            await Clients.Caller.SendAsync("ReceiveTurnCredentials", turnConfig);
        }
    }

    private static string NormalizeCode(string roomCode) => (roomCode ?? string.Empty).Trim().ToUpperInvariant();

    // Authenticated callers use their account id; guests get a namespaced id that can never equal an account id.
    private string? ResolveUserId(string? guestId)
    {
        var claimId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(claimId)) return claimId;
        return string.IsNullOrWhiteSpace(guestId) ? null : "guest:" + guestId.Trim();
    }

    private void EnsureHost(Room room)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!_roomService.IsAuthorizedHost(room, Context.ConnectionId, userId))
        {
            throw new HubException("Unauthorized: Only an authorized host can perform this action.");
        }
    }
}
