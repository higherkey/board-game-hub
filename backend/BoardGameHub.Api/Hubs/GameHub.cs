using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace BoardGameHub.Api.Hubs;
using System.Security.Claims;
using BoardGameHub.Api.Models; // Explicitly for GameSettings

public class GameHub : Hub
{
    private readonly RoomService _roomService;
    private readonly GameHistoryService _historyService;

    public GameHub(RoomService roomService, GameHistoryService historyService)
    {
        _roomService = roomService;
        _historyService = historyService;
    }

    public async Task<string> CreateRoom(string playerName, bool isPublic, string gameType = "Scatterbrain")
    {
        Enum.TryParse<GameType>(gameType, true, out var type);
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        // If logged in, preferred username might come from claims, or they can override it. 
        // For now, let's prioritize the submitted name, but link the userId.
        var avatarUrl = Context.User?.FindFirst("AvatarUrl")?.Value;

        var room = _roomService.CreateRoom(Context.ConnectionId, playerName, isPublic, type, userId, avatarUrl);
        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        // Broadcast to the creator (and anyone else in the group, though it's just them)
        await Clients.Group(room.Code).SendAsync("PlayerJoined", room.Players);
        return room.Code;
    }

    public async Task SetGameType(string roomCode, string gameType)
    {
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            var room = _roomService.SetGameType(roomCode, type);
            if (room != null)
            {
                await Clients.Group(roomCode).SendAsync("GameTypeChanged", type.ToString());
                await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
            }
        }
    }

    public async Task VoteNextGame(string roomCode, string gameType)
    {
        if (Enum.TryParse<GameType>(gameType, true, out var type))
        {
            var room = _roomService.VoteNextGame(roomCode, Context.ConnectionId, type);
            if (room != null)
            {
               await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
            }
        }
    }
    
    public async Task UpdateSettings(string roomCode, GameSettings settings)
    {
        var room = _roomService.UpdateSettings(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("SettingsUpdated", settings);
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task UpdateUndoSettings(string roomCode, UndoSettings settings)
    {
        var room = _roomService.UpdateUndoSettings(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
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
                await Clients.Group(roomCode).SendAsync("UndoVoteStarted", room.CurrentVote);
            }
            else
            {
                // Immediate undo happened
                await Clients.Group(roomCode).SendAsync("GameRestored", room);
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
                await Clients.Group(roomCode).SendAsync("UndoVoteFinished", "Vote Completed"); // Generic
                await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
            }
            else
            {
                 // Vote updated but still ongoing
                 await Clients.Group(roomCode).SendAsync("UndoVoteUpdate", room.CurrentVote);
            }
        }
    }

    public async Task<List<Room>> GetPublicRooms()
    {
        return await Task.FromResult(_roomService.GetPublicRooms());
    }

    public async Task<Room?> JoinRoom(string roomCode, string playerName)
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var avatarUrl = Context.User?.FindFirst("AvatarUrl")?.Value;

        var room = _roomService.JoinRoom(roomCode, Context.ConnectionId, playerName, userId, avatarUrl);
        if (room == null) return null;

        await Groups.AddToGroupAsync(Context.ConnectionId, room.Code);
        
        // Notify others in group
        await Clients.Group(room.Code).SendAsync("PlayerJoined", room.Players);
        
        return room;
    }

    public async Task StartGame(string roomCode, GameSettings settings)
    {
        var room = _roomService.StartGame(roomCode, settings);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("GameStarted", room);
        }
    }

    public async Task PauseGame(string roomCode)
    {
        var room = _roomService.PauseGame(roomCode);
        if (room != null) await Clients.Group(roomCode).SendAsync("GamePaused", room);
    }

    public async Task ResumeGame(string roomCode)
    {
        var room = _roomService.ResumeGame(roomCode);
        if (room != null) await Clients.Group(roomCode).SendAsync("GameResumed", room);
    }

    public async Task SubmitAnswers(string roomCode, List<string> answers)
    {
        var room = _roomService.SubmitAnswers(roomCode, Context.ConnectionId, answers);
        // Ensure we don't leak answers to others yet, potentially just ack?
        // taking no action for broadcast here, just ack state if needed.
        await Task.CompletedTask;
    }

    public async Task SubmitClue(string roomCode, string clue)
    {
        var room = _roomService.SubmitClue(roomCode, Context.ConnectionId, clue);
        if (room != null)
        {
            // Just notify that a clue was submitted (not the content)
            // Or send updated room state (which separates hidden info)
            // For now, send generic room update
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitGuess(string roomCode, string guess)
    {
        var room = _roomService.SubmitGuess(roomCode, Context.ConnectionId, guess);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitBreakingNewsSlot(string roomCode, int slotId, string value)
    {
        var room = _roomService.SubmitBreakingNewsSlotValue(roomCode, Context.ConnectionId, slotId, value);
        if (room != null)
        {
            // Optimize: Could send only slot update "SlotUpdated", but "RoomUpdated" is easier for MVP
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    // --- Deepfake Methods --- note: Should refactor logic into RoomService facade like others

    private DeepfakeGameService GetDeepfakeService() => _roomService.GetGameService<DeepfakeGameService>(GameType.Deepfake);
    private PictophoneService GetPictophoneService() => _roomService.GetGameService<PictophoneService>(GameType.Pictophone);

    public async Task SubmitPictophonePage(string roomCode, string content)
    {
        var room = _roomService.GetRoom(roomCode);
        if (room == null) return;

        var service = GetPictophoneService();
        if (service != null)
        {
            service.SubmitPage(room, Context.ConnectionId, content);
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task DeepfakeStroke(string roomCode, string pathData, string color)
    {
        var room = _roomService.GetRoom(roomCode);
        if (room == null) return;
        
        var service = GetDeepfakeService();
        if (service != null && service.SubmitStroke(room, Context.ConnectionId, pathData, color))
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task DeepfakeVote(string roomCode, string accusedId)
    {
        var room = _roomService.GetRoom(roomCode);
        if (room == null) return;

        var service = GetDeepfakeService();
        if (service != null && service.SubmitVote(room, Context.ConnectionId, accusedId))
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task DeepfakeAiGuess(string roomCode, string guess)
    {
        var room = _roomService.GetRoom(roomCode);
        if (room == null) return;

        var service = GetDeepfakeService();
        if (service != null && service.SubmitAiGuess(room, Context.ConnectionId, guess))
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    // --- Wisecrack Methods ---

    public async Task SubmitWisecrackAnswer(string roomCode, string promptId, string answer)
    {
        var room = _roomService.SubmitWisecrackAnswer(roomCode, Context.ConnectionId, promptId, answer);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitWisecrackVote(string roomCode, int choice)
    {
        var room = _roomService.SubmitWisecrackVote(roomCode, Context.ConnectionId, choice);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task NextWisecrackBattle(string roomCode)
    {
        var room = _roomService.NextWisecrackBattle(roomCode);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }


    public async Task SubmitPoppycockDefinition(string roomCode, string definition)
    {
        var room = _roomService.SubmitPoppycockDefinition(roomCode, Context.ConnectionId, definition);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitPoppycockVote(string roomCode, string votedId)
    {
        var room = _roomService.SubmitPoppycockVote(roomCode, Context.ConnectionId, votedId);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }


    public async Task EndRound(string roomCode)
    {
        var room = _roomService.CalculateRoundScores(roomCode);
        if (room != null)
        {
            // Record the round/session results to DB
            // Note: Since method is async void in service if we don't await, but here we can wait.
            // But usually we fire and forget or await.
            await _historyService.RecordGameSession(room);
            
            await Clients.Group(roomCode).SendAsync("RoundEnded", room);
        }
    }

    public async Task NextRound(string roomCode)
    {
        // Start next round with same settings, but new letter/list
        var room = _roomService.StartGame(roomCode, null); 
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
    private SymbologyGameService GetSymbologyService() => _roomService.GetGameService<SymbologyGameService>(GameType.Symbology);

    public async Task SymbologyPlaceMarker(string roomCode, string icon, string markerType, string color)
    {
        var room = _roomService.GetRoom(roomCode);
        if (room == null) return;

        var service = GetSymbologyService();
        if (service != null && service.PlaceMarker(room, Context.ConnectionId, icon, markerType, color))
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SymbologyRemoveMarker(string roomCode, string markerId)
    {
        var room = _roomService.GetRoom(roomCode);
        if (room == null) return;

        var service = GetSymbologyService();
        if (service != null && service.RemoveMarker(room, Context.ConnectionId, markerId))
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task UniversalTranslatorToken(string roomCode, string token)
    {
        var room = _roomService.SubmitUniversalTranslatorToken(roomCode, Context.ConnectionId, token);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task UniversalTranslatorVote(string roomCode, string targetId)
    {
        var room = _roomService.SubmitUniversalTranslatorVote(roomCode, Context.ConnectionId, targetId);
        if (room != null)
        {
            await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }
    
    public async Task UniversalTranslatorForcePhase(string roomCode, string phaseName)
    {
        // Debug/Admin or specific flow trigger
        if (Enum.TryParse<UniversalTranslatorPhase>(phaseName, out var phase))
        {
             var room = _roomService.ForceUniversalTranslatorPhase(roomCode, phase);
             if (room != null) await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitSushiTrainSelection(string roomCode, string cardId)
    {
        var room = _roomService.SubmitSushiTrainSelection(roomCode, Context.ConnectionId, cardId);
        if (room != null)
        {
             await Clients.Group(roomCode).SendAsync("RoomUpdated", room);
        }
    }

    public async Task SubmitGreatMindsCard(string roomCode, int cardValue)
    {
        var room = _roomService.SubmitGreatMindsCard(roomCode, Context.ConnectionId, cardValue);
        // Room update is handled by specialized broadcasts in GameService
        if (room != null)
        {
             // Optional: Broadcast generic update if needed
        }
    }

    public async Task SubmitGreatMindsSync(string roomCode)
    {
        _roomService.SubmitGreatMindsSync(roomCode, Context.ConnectionId);
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
