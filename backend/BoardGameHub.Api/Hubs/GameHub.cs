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

    public GameHub(IRoomService roomService, IGameHistoryService historyService, ILogger<GameHub> logger)
    {
        _roomService = roomService;
        _historyService = historyService;
        _logger = logger;
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
        Enum.TryParse<GameType>(gameType, true, out var type);
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? guestId;
        // If logged in, preferred username might come from claims, or they can override it. 
        // For now, let's prioritize the submitted name, but link the userId.
        var avatarUrl = Context.User?.FindFirst("AvatarUrl")?.Value;

        var room = _roomService.CreateRoom(Context.ConnectionId, playerName, isPublic, type, userId, avatarUrl, isScreen);
        room.CreatorConnectionId = Context.ConnectionId; // Set the creator
        
        // Log creation
        _logger.LogInformation("[GameHub] Room Created: {Code}, GameType: {GameType}, Host: {Host}", room.Code, room.GameType, playerName);

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code.ToUpper());
        // Broadcast to the creator (and anyone else in the group, though it's just them)
        await Clients.Group(room.Code.ToUpper()).SendAsync("PlayerJoined", room.Players);
        
        // Public Lobby Update
        if (room.IsPublic)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomCreated", room);
        }

        return room;
    }

    // ... (StartGame, PauseGame etc skipped for brevity in replacement if not touched, but here I need to be careful with range)
    // Actually I should target specific blocks. But SetGameType is further down.

    // Let's do a multi-replace or carefully targeted replacement.

    public async Task StartGame(string roomCode, GameSettings settings)
    {
        var room = await _roomService.StartGame(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("GameStarted", room);
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

    public Task PauseGame(string roomCode)
    {
        _roomService.PauseGame(roomCode);
        return Task.CompletedTask;
    }

    public Task ResumeGame(string roomCode)
    {
        _roomService.ResumeGame(roomCode);
        return Task.CompletedTask;
    }

    public Task EndGame(string roomCode)
    {
        var room = _roomService.EndGame(roomCode);
        if (room != null && room.IsPublic && room.State == GameState.Finished)
        {
             // Finished rooms are not public? 
             // GetPublicRooms filters r.State == GameState.Lobby.
             // So if it was Playing (not public) and becomes Finished (not public), no change.
             // If we ever support seeing Finished games, we'd need an update.
        }
        return Task.CompletedTask;
    }

    public async Task SetGameType(string roomCode, string gameType)
    {
        _logger.LogInformation("[GameHub] SetGameType Request: Room={Room}, Type={GameType}", roomCode, gameType);
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            var room = _roomService.SetGameType(roomCode, type);
            if (room != null)
            {
                _logger.LogInformation("[GameHub] SetGameType Success: Room={Room}, Enum={Enum}", roomCode, type);
                await Clients.Group(roomCode.ToUpper()).SendAsync("GameTypeChanged", type.ToString());
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
        var room = _roomService.SetHostPlayer(roomCode, targetConnectionId);
        if (room != null && room.IsPublic && room.State == GameState.Lobby)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
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
        var room = _roomService.UpdateSettings(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode.ToUpper()).SendAsync("SettingsUpdated", settings);
            if (room.IsPublic && room.State == GameState.Lobby)
            {
                 // Settings (like timer) don't show on card usually, but good to keep sync.
                 await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
            }
        }
    }



    public Task UpdateUndoSettings(string roomCode, UndoSettings settings)
    {
        _roomService.UpdateUndoSettings(roomCode, settings);
        return Task.CompletedTask;
    }

    public async Task RequestUndo(string roomCode)
    {
        var room = _roomService.RequestUndo(roomCode, Context.ConnectionId);
        if (room != null)
        {
            // If room returned, check if Vote started or Undo happened
            if (room.CurrentVote != null)
            {
                await Clients.Group(roomCode.ToUpper()).SendAsync("UndoVoteStarted", room.CurrentVote);
            }
            else
            {
                // Immediate undo happened
                // await Clients.Group(roomCode.ToUpper()).SendAsync("GameRestored", room); 
                // Let the GameStateManager handle the state update.
            }
        }
    }

    public async Task SubmitUndoVote(string roomCode, bool vote)
    {
        var room = _roomService.SubmitUndoVote(roomCode, Context.ConnectionId, vote);
        if (room != null)
        {
            if (room.CurrentVote == null)
            {
                // Logic: room.CurrentVote null means either Passed (Restored) or Failed (Reset).
                // We should check if state changed? 
                // Actually, if Vote passes, PerformUndo returns the restored room.
                // If Vote fails (majority no), SubmitUndoVote returns the room with CurrentVote=null.
                // How to distinguish for the client?
                // Client gets "RoomUpdated" or "GameRestored".
                // Let's send "GameRestored" if it worked (checking history stack change? No.)
                // Let's just send "RoomUpdated" and an explicit "UndoVoteFinished" message?
                await Clients.Group(roomCode.ToUpper()).SendAsync("UndoVoteFinished", "Vote Completed"); // Generic
            }
            else
            {
                 // Vote updated but still ongoing
                 await Clients.Group(roomCode.ToUpper()).SendAsync("UndoVoteUpdate", room.CurrentVote);
            }
        }
    }

    public async Task<List<Room>> GetPublicRooms()
    {
        return await Task.FromResult(_roomService.GetPublicRooms());
    }

    public async Task<Room?> JoinRoom(string roomCode, string playerName, string? guestId = null, bool isScreen = false)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? guestId;
        var avatarUrl = Context.User?.FindFirst("AvatarUrl")?.Value;

        var room = _roomService.JoinRoom(roomCode, Context.ConnectionId, playerName, userId, avatarUrl, isScreen);
        if (room == null) return null;

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        
        // Notify others in group
        await Clients.Group(room.Code).SendAsync("PlayerJoined", room.Players);
        
        // Public Lobby Update
        if (room.IsPublic && room.State == GameState.Lobby)
        {
            await Clients.Group("LobbyGroup").SendAsync("PublicRoomUpdated", room);
        }

        return room;
    }

    public Task ToggleReady(string roomCode, bool? forcedState = null)
    {
        var room = _roomService.ToggleReady(roomCode, Context.ConnectionId, forcedState);
        if (room != null)
        {
            // await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
            // Maybe update player count ready status? Not critical for public lobby list.
        }
        return Task.CompletedTask;
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

            var room = await _roomService.CalculateRoundScores(roomCode.Trim().ToUpperInvariant());

            if (room != null)
            {
                // Record history with extra safety
                try
                {
                    if (_historyService != null && room.Players.Any())
                    {
                        await _historyService.RecordGameSession(room);
                    }
                }
                catch (Exception hex)
                {
                    Console.WriteLine($"Error recording game history for room {roomCode}: {hex.Message}");
                }

                await Clients.Group(roomCode.ToUpper()).SendAsync("RoundEnded", room);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in EndRound for room {roomCode}: {ex.Message}");
            throw new HubException("An unexpected error occurred during score calculation.");
        }
    }

    public async Task NextRound(string roomCode)
    {
        // Start next round with same settings, but new letter/list
        var room = await _roomService.StartGame(roomCode, null); 
        if (room != null)
        {
           await Clients.Group(roomCode).SendAsync("GameStarted", room);
           
           if (room.IsPublic && room.State == GameState.Playing)
           {
                // Game started from Lobby -> Delete from public list
                await Clients.Group("LobbyGroup").SendAsync("PublicRoomDeleted", roomCode);
           }
        }
    }

    public async Task SendMessage(string roomCode, string message)
    {
         await Clients.Group(roomCode).SendAsync("ReceiveMessage", Context.ConnectionId, message);
    }

    // WebRTC Signaling Methods
    public async Task SendOffer(string targetConnectionId, string sdp)
    {
        await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", Context.ConnectionId, sdp);
    }

    public async Task SendAnswer(string targetConnectionId, string sdp)
    {
        await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", Context.ConnectionId, sdp);
    }

    public async Task SendIceCandidate(string targetConnectionId, string candidate)
    {
        await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", Context.ConnectionId, candidate);
    }
    
    public async Task LeaveRoom(string roomCode)
    {
        var room = _roomService.RemovePlayer(Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        
        // Notify others that player left (if room still exists)
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("PlayerJoined", room.Players);
            
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
}
