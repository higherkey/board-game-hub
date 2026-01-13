using BoardGameHub.Api.Models;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BoardGameHub.Api.Services;

public class PictophoneService : IGameService
{
    private readonly ILogger<PictophoneService> _logger;
    public GameType GameType => GameType.Pictophone;

    public PictophoneService(ILogger<PictophoneService> logger)
    {
        _logger = logger;
    }

    public Task StartRound(Room room, GameSettings settings)
    {
        _logger.LogInformation("Starting Pictophone round in room {Code}", room.Code);
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
        state.TotalRounds = room.Players.Count; 
        
        // Use settings for initial timer
        room.RoundEndTime = DateTime.UtcNow.AddSeconds(settings.TimerDurationSeconds);
        
        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        if (room == null || room.GameData is not PictophoneState state) return Task.CompletedTask;

        try
        {
            // Ensure RoundScores is initialized for all players (Reset to 0)
            if (room.RoundScores == null) room.RoundScores = new Dictionary<string, int>();
            foreach (var p in room.Players) room.RoundScores[p.ConnectionId] = 0;

            // Pictophone is purely creative, so no points are awarded normally.
            // We could potentially award "Stars" as points if we wanted to later.
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Pictophone CalculateScores: {ex.Message}");
        }
        return Task.CompletedTask;
    }

    public Task SubmitPage(Room room, string playerId, string content)
    {
        if (room == null || room.GameData is not PictophoneState state) return Task.CompletedTask;

        // Find the book currently held by this player
        var book = state.Books.FirstOrDefault(b => b.CurrentHolderId == playerId);
        if (book == null) return Task.CompletedTask;

        // Check if already submitted for this phase
        if (state.PendingNextPhase.Contains(playerId)) return Task.CompletedTask;

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
        if (state.PendingNextPhase.Count < room.Players.Count) return;

        state.PendingNextPhase.Clear();
        state.Drafts.Clear(); 
        state.RoundIndex++;

        // Rotate books for next phase
        RotateBooks(room, state);

        if (state.RoundIndex >= state.TotalRounds)
        {
            state.Phase = PictophonePhase.Reveal;
            room.RoundEndTime = null;
            state.ShowcaseBookIndex = 0;
            state.ShowcasePageIndex = 0;
        }
        else
        {
            // Advance Phase
            if (state.Phase == PictophonePhase.Prompting)
            {
                state.Phase = PictophonePhase.Drawing;
            }
            else
            {
                state.Phase = state.Phase == PictophonePhase.Drawing ? PictophonePhase.Guessing : PictophonePhase.Drawing;
            }

            // Reset Timer for next phase
            room.RoundEndTime = DateTime.UtcNow.AddSeconds(room.Settings.TimerDurationSeconds);
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

    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
    }

    public async Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (room == null || room.GameData is not PictophoneState state) return false;

        switch (action.Type)
        {
            case "SUBMIT_PAGE":
                if (action.Payload.HasValue && action.Payload.Value.TryGetProperty("content", out var contentProp))
                {
                    await SubmitPage(room, connectionId, contentProp.GetString() ?? "");
                    return true;
                }
                break;

            case "SUBMIT_DRAFT":
                // Design Doc requirement: Save intermediate work so progress isn't lost on disconnect
                if (action.Payload.HasValue && action.Payload.Value.TryGetProperty("content", out var draftProp))
                {
                    var book = state.Books.FirstOrDefault(b => b.CurrentHolderId == connectionId);
                    if (book != null)
                    {
                        state.Drafts[connectionId] = draftProp.GetString() ?? "";
                    }
                    return true;
                }
                break;

            case "FORCE_NEXT_PHASE":
                // Allow host to advance even if not everyone submitted
                var player = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (player != null && player.IsHost)
                {
                    // Auto-submit for those who haven't
                    foreach (var p in room.Players.Where(p => !state.PendingNextPhase.Contains(p.ConnectionId)))
                    {
                        state.Drafts.TryGetValue(p.ConnectionId, out var draft);
                        await SubmitPage(room, p.ConnectionId, draft ?? "(No response)");
                    }
                    return true;
                }
                break;

            case "REVEAL_NEXT":
                // Advance to next page or book
                var h = room.Players.FirstOrDefault(p => p.ConnectionId == connectionId);
                if (h != null && h.IsHost && state.Phase == PictophonePhase.Reveal)
                {
                    state.ShowcasePageIndex++;
                    var currentBook = state.Books[state.ShowcaseBookIndex];
                    if (state.ShowcasePageIndex >= currentBook.Pages.Count)
                    {
                        state.ShowcaseBookIndex++;
                        state.ShowcasePageIndex = 0;
                        if (state.ShowcaseBookIndex >= state.Books.Count)
                        {
                            // End of showcase
                            state.ShowcaseBookIndex = state.Books.Count - 1;
                            state.ShowcasePageIndex = state.Books.Last().Pages.Count - 1;
                        }
                    }
                    return true;
                }
                break;

            case "STAR_PAGE":
                // Payload: { bookIndex: int, pageIndex: int }
                if (state.Phase == PictophonePhase.Reveal && action.Payload.HasValue)
                {
                    if (action.Payload.Value.TryGetProperty("bookIndex", out var bIdx) &&
                        action.Payload.Value.TryGetProperty("pageIndex", out var pIdx))
                    {
                        var bi = bIdx.GetInt32();
                        var pi = pIdx.GetInt32();
                        if (bi >= 0 && bi < state.Books.Count)
                        {
                            var book = state.Books[bi];
                            if (pi >= 0 && pi < book.Pages.Count)
                            {
                                var page = book.Pages[pi];
                                if (!page.Stars.Contains(connectionId))
                                {
                                    page.Stars.Add(connectionId);
                                    return true;
                                }
                            }
                        }
                    }
                }
                break;
        }

        return false;
    }

    public List<string> GetPromptSuggestions()
    {
        var suggestions = new List<string> {
            "A cat in a hat", "Rocket to the moon", "Dancing dinosaur", 
            "Self-cooking spaghetti", "Underwater basket weaving", "Robot butler",
            "Ghost playing chess", "Squirrel with a jetpack", "Cloud with sunglasses",
            "Melting clock", "Garden of giant gummy bears", "Panda riding a unicycle"
        };
        return suggestions.OrderBy(x => Guid.NewGuid()).Take(3).ToList();
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
    public Dictionary<string, string> Drafts { get; set; } = new(); // PlayerId -> Current Draft (Text or Base64)
    public int RoundIndex { get; set; } = 0;
    public int TotalRounds { get; set; }
    
    // Reveal Showcase
    public int ShowcaseBookIndex { get; set; } = -1;
    public int ShowcasePageIndex { get; set; } = -1;
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
    public List<string> Stars { get; set; } = new(); // ConnectionIds of people who starred this
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
