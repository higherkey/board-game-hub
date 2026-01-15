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
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, actionType, payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public GameHub(IRoomService roomService, IGameHistoryService historyService)
    {
        _roomService = roomService;
        _historyService = historyService;
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
        
        // Log creation
        Console.WriteLine($"[GameHub] Room Created: {room.Code}, GameType: {room.GameType}, Host: {playerName}");

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code.ToUpper());
        // Broadcast to the creator (and anyone else in the group, though it's just them)
        await Clients.Group(room.Code.ToUpper()).SendAsync("PlayerJoined", room.Players);
        return room;
    }

    public async Task StartGame(string roomCode, GameSettings settings)
    {
        var room = await _roomService.StartGame(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("GameStarted", room);
        }
    }

    public async Task PauseGame(string roomCode)
    {
        var room = _roomService.PauseGame(roomCode);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task ResumeGame(string roomCode)
    {
        var room = _roomService.ResumeGame(roomCode);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task EndGame(string roomCode)
    {
        var room = _roomService.EndGame(roomCode);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SetGameType(string roomCode, string gameType)
    {
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            var room = _roomService.SetGameType(roomCode, type);
            if (room != null)
            {
                await Clients.Group(roomCode.ToUpper()).SendAsync("GameTypeChanged", type.ToString());
                // Global broadcast for Active Tables list
                await Clients.All.SendAsync("RoomGameTypeChanged", roomCode.ToUpper(), type.ToString());
                await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
            }
        }
    }

    public async Task SetHostPlayer(string roomCode, string targetConnectionId)
    {
        var room = _roomService.SetHostPlayer(roomCode, targetConnectionId);
        if (room != null)
        {
            await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
        }
    }

    public async Task VoteNextGame(string roomCode, string gameType)
    {
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            var room = _roomService.VoteNextGame(roomCode, Context.ConnectionId, type);
            if (room != null)
            {
               await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
            }
        }
    }
    
    public async Task UpdateSettings(string roomCode, GameSettings settings)
    {
        var room = _roomService.UpdateSettings(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode.ToUpper()).SendAsync("SettingsUpdated", settings);
            await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
        }
    }

    public async Task UpdateUndoSettings(string roomCode, UndoSettings settings)
    {
        var room = _roomService.UpdateUndoSettings(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
        }
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
                await Clients.Group(roomCode.ToUpper()).SendAsync("GameRestored", room);
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
                await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
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
        
        return room;
    }

    public async Task ToggleReady(string roomCode, bool? forcedState = null)
    {
        var room = _roomService.ToggleReady(roomCode, Context.ConnectionId, forcedState);
        if (room != null)
        {
            await Clients.Group(roomCode.ToUpper()).SendAsync("RoomUpdated", room);
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
        }
    }

    public async Task ChangeRole(bool isScreen)
    {
        var room = _roomService.ChangeRole(Context.ConnectionId, isScreen);
        if (room != null)
        {
            await Clients.Group(room.Code).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitAnswers(string roomCode, List<string> answers)
    {
        var payload = JsonSerializer.SerializeToElement(new { answers });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_ANSWERS", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitClue(string roomCode, string clue)
    {
        var payload = JsonSerializer.SerializeToElement(new { clue });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_CLUE", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitGuess(string roomCode, string guess)
    {
        var payload = JsonSerializer.SerializeToElement(new { guess });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_GUESS", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitBreakingNewsSlot(string roomCode, int slotId, string value)
    {
        var payload = JsonSerializer.SerializeToElement(new { slotId, value });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_SLOT", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    // --- Deepfake Methods ---
    
    public async Task SubmitPictophonePage(string roomCode, string content)
    {
        var payload = JsonSerializer.SerializeToElement(new { content });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_PAGE", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitPictophoneDraft(string roomCode, string content)
    {
        var payload = JsonSerializer.SerializeToElement(new { content });
        await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_DRAFT", payload);
    }

    public async Task ForcePictophoneNext(string roomCode)
    {
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "FORCE_NEXT_PHASE", null);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task RevealPictophoneNext(string roomCode)
    {
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "REVEAL_NEXT", null);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task StarPictophonePage(string roomCode, int bookIndex, int pageIndex)
    {
        var payload = JsonSerializer.SerializeToElement(new { bookIndex, pageIndex });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "STAR_PAGE", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
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
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task DeepfakeVote(string roomCode, string accusedId)
    {
        var payload = JsonSerializer.SerializeToElement(new { accusedId });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task DeepfakeAiGuess(string roomCode, string guess)
    {
        var payload = JsonSerializer.SerializeToElement(new { guess });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_AI_GUESS", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    // --- Wisecrack Methods ---

    public async Task SubmitWisecrackAnswer(string roomCode, string promptId, string answer)
    {
        var payload = JsonSerializer.SerializeToElement(new { promptId, answer });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_ANSWER", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitWisecrackVote(string roomCode, int choice)
    {
        var payload = JsonSerializer.SerializeToElement(new { choice });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task NextWisecrackBattle(string roomCode)
    {
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "NEXT_BATTLE", null);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }


    public async Task SubmitPoppycockDefinition(string roomCode, string definition)
    {
        var payload = JsonSerializer.SerializeToElement(new { definition });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_DEFINITION", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitPoppycockVote(string roomCode, string votedId)
    {
        var payload = JsonSerializer.SerializeToElement(new { votedId });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
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
        _roomService.RemovePlayer(Context.ConnectionId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomCode);
        
        // Notify others that player left (if room still exists)
        var room = _roomService.GetRoom(roomCode);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("PlayerJoined", room.Players);
        }
    }

    // --- Symbology Methods ---

    public async Task SymbologyPlaceMarker(string roomCode, string icon, string markerType, string color)
    {
        var payload = JsonSerializer.SerializeToElement(new { icon, markerType, color });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "PLACE_MARKER", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SymbologyRemoveMarker(string roomCode, string markerId)
    {
        var payload = JsonSerializer.SerializeToElement(new { markerId });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "REMOVE_MARKER", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task UniversalTranslatorToken(string roomCode, string token)
    {
        var payload = JsonSerializer.SerializeToElement(new { token });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_TOKEN", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task UniversalTranslatorVote(string roomCode, string targetId)
    {
        var payload = JsonSerializer.SerializeToElement(new { accusedId = targetId });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_VOTE", payload);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }
    
    public async Task UniversalTranslatorForcePhase(string roomCode, string phaseName)
    {
        // Debug/Admin or specific flow trigger
        var payload = JsonSerializer.SerializeToElement(new { phase = phaseName });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "FORCE_PHASE", payload);
        if (room != null) await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
    }

    public async Task UniversalTranslatorPickWord(string roomCode, string word)
    {
        var payload = JsonSerializer.SerializeToElement(new { word });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "PICK_WORD", payload);
        if (room != null) await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
    }

    public async Task SubmitSushiTrainSelection(string roomCode, string cardId)
    {
        var payload = JsonSerializer.SerializeToElement(new { cardId });
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "SUBMIT_SELECTION", payload);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task ToggleSushiTrainChopsticks(string roomCode)
    {
        var room = await _roomService.SubmitAction(roomCode, Context.ConnectionId, "TOGGLE_CHOPSTICKS", null);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
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
        // We don't easily know which room they were in unless we track it or search all rooms.
        // RoomService.RemovePlayer searches all rooms, so it handles cleanup.
        // But we can't easily notify the specific room group here without finding it first.
        // RoomService.RemovePlayer returns void. 
        // Improvement: Have RemovePlayer return the Room it removed from?
        
        _roomService.RemovePlayer(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
