using BoardGameHub.Api.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BoardGameHub.Api.Services;

public class PictophoneService : IGameService
{
    public GameType GameType => GameType.Pictophone;

    public Task StartRound(Room room, GameSettings settings)
    {
        // Initialize State
        var state = new PictophoneState();
        
        // Create a book for each player
        foreach (var player in room.Players)
        {
            var book = new PictophoneBook
            {
                OwnerId = player.ConnectionId,
                CurrentHolderId = player.ConnectionId
            };
            state.Books.Add(book);
        }

        state.Phase = PictophonePhase.Prompting; // Start with writing prompts
        state.TotalRounds = room.Players.Count; // One round per player (including initial prompt? No, usually initial prompt + N-1 rounds or N rounds?)
        // Standard Telestrations:
        // 4 players:
        // 1. Prompt (All) - Book with Owner
        // 2. Pass -> Draw (All)
        // 3. Pass -> Guess (All)
        // 4. Pass -> Draw (All)
        // 5. Pass -> Reveal (Book returns to Owner)
        // So total steps = Player count.
        // Let's rely on checking if Book has returned to Owner to end game.
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        // No scoring usually, just for fun.
        return Task.CompletedTask;
    }

    public Task SubmitPage(Room room, string playerId, string content)
    {
        if (room.GameData is not PictophoneState state) return Task.CompletedTask;

        // Find the book currently held by this player
        var book = state.Books.FirstOrDefault(b => b.CurrentHolderId == playerId);
        if (book == null) return Task.CompletedTask;

        // Check if already submitted for this phase
        if (state.PendingNextPhase.Contains(playerId)) return Task.CompletedTask; // Already waiting

        // Add page to book
        var page = new PictophonePage
        {
            AuthorId = playerId,
            Type = state.Phase == PictophonePhase.Drawing ? PictophonePageType.Drawing : PictophonePageType.Text,
            Content = content
        };
        
        book.Pages.Add(page);
        
        state.PendingNextPhase.Add(playerId);

        CheckNextPhase(room, state);
        return Task.CompletedTask;
    }

    private void CheckNextPhase(Room room, PictophoneState state)
    {
        if (state.PendingNextPhase.Count >= room.Players.Count)
        {
            // All submitted. Rotate books.
            RotateBooks(room, state);
            
            // Advance Phase
            // If Prompting -> Drawing
            // If Drawing -> Guessing
            // If Guessing -> Drawing
            if (state.Phase == PictophonePhase.Prompting)
            {
                state.Phase = PictophonePhase.Drawing;
            }
            else
            {
                state.Phase = state.Phase == PictophonePhase.Drawing ? PictophonePhase.Guessing : PictophonePhase.Drawing;
            }

            state.PendingNextPhase.Clear();
            state.RoundIndex++;

            // Check End Condition: Have books processed enough rounds?
            // Usually if RoundIndex >= PlayerCount
            if (state.RoundIndex >= room.Players.Count)
            {
                state.Phase = PictophonePhase.Reveal;
            }
        }
    }

    private void RotateBooks(Room room, PictophoneState state)
    {
        // Create a mapping of current holders to find the next holder index
        // Simple rotation: Map player list order
        var players = room.Players.OrderBy(p => p.ConnectionId).ToList(); // Ensure consistent order? 
        // Actually Room.Players order is likely stable but safer to not rely on it if people disconnect/reconnect (though reconnets usually break game state here)
        // Let's assume Room.Players is the table order.
        
        // Strategy:
        // We need to move Book from Player[i] to Player[i+1]
        
        // Snapshot current holding map
        var currentHolders = state.Books.ToDictionary(b => b.Id, b => b.CurrentHolderId);

        foreach (var book in state.Books)
        {
            // Find current holder index
            var currentHolderId = currentHolders[book.Id];
            var currentIndex = players.FindIndex(p => p.ConnectionId == currentHolderId);
            
            if (currentIndex != -1)
            {
                var nextIndex = (currentIndex + 1) % players.Count;
                book.CurrentHolderId = players[nextIndex].ConnectionId;
            }
        }
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_PAGE" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("content", out var contentProp))
             {
                 SubmitPage(room, connectionId, contentProp.GetString() ?? "");
                 return Task.FromResult(true);
             }
        }
        return Task.FromResult(false);
    }
    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<PictophoneState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new PictophoneState();
    }
}

public class PictophoneState
{
    public PictophonePhase Phase { get; set; } = PictophonePhase.Lobby;
    public List<PictophoneBook> Books { get; set; } = new();
    public HashSet<string> PendingNextPhase { get; set; } = new(); // PlayerIds who have submitted
    public int RoundIndex { get; set; } = 0;
    public int TotalRounds { get; set; }
}

public class PictophoneBook
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string OwnerId { get; set; } = string.Empty;
    public string CurrentHolderId { get; set; } = string.Empty;
    public List<PictophonePage> Pages { get; set; } = new();
}

public class PictophonePage
{
    public PictophonePageType Type { get; set; }
    public string Content { get; set; } = string.Empty; // Text or Base64 Image
    public string AuthorId { get; set; } = string.Empty;
}

public enum PictophonePhase
{
    Lobby,
    Prompting,
    Drawing,
    Guessing,
    Reveal
}

public enum PictophonePageType
{
    Text,
    Drawing
}
