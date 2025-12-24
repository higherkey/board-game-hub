using System.Text.Json.Serialization;

namespace BoardGameHub.Api.Models;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SushiType
{
    NigiriEgg = 1,     // 1 pt
    NigiriSalmon = 2,  // 2 pts
    NigiriSquid = 3,   // 3 pts
    Wasabi = 4,        // x3 next Nigiri
    Maki1 = 5,         // 1 Maki icon
    Maki2 = 6,         // 2 Maki icons
    Maki3 = 7,         // 3 Maki icons
    Tempura = 8,       // Set x2 = 5pts
    Sashimi = 9,       // Set x3 = 10pts
    Dumpling = 10,     // 1, 3, 6, 10, 15 pts
    Pudding = 11,      // End game scoring
    Chopsticks = 12    // Swap for 2 cards
}

public class SushiCard
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public SushiType Type { get; set; }
    public int Value { get; set; } // Points or Count depending on type
    
    // UI Helpers
    public bool IsNew { get; set; } // Recently revealed
}

public class SushiPlayerState
{
    public string PlayerId { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    
    public List<SushiCard> Hand { get; set; } = new();
    public List<SushiCard> Tableau { get; set; } = new();
    public List<SushiCard> Puddings { get; set; } = new(); // Kept aside
    
    public string? SelectedCardId { get; set; }
    public string? SelectedCardId2 { get; set; }
    public bool IsUsingChopsticks { get; set; }
    public bool HasSelected { get; set; }
    
    // Using Chopsticks logic: If they use chopsticks, they select 2 cards.
    // Simplifying for MVP: Maybe just stick to 1 card first? 
    // Or if they pick Chopsticks from TABLEAU to return to hand?
    // Rules: "Use Chopsticks: Pick 1 card normally, announce Chopsticks. Put Chopsticks from tableau back into hand. Pick 2nd card from hand."
    // This is complex for MVP. Let's skip Chopsticks activation logic for now, or treat it as a dummy card.
    
    public int RoundScore { get; set; }
    public int TotalScore { get; set; }
}

public class SushiTrainState
{
    public int Round { get; set; } = 1; // 1, 2, 3
    
    // ConnectionId -> State
    public Dictionary<string, SushiPlayerState> PlayerStates { get; set; } = new();
    
    // The deck is shared initially then dealt? Or we just generate cards on fly?
    // Better to generate a full deck and deal from it to ensure probabilities.
    public List<SushiCard> Deck { get; set; } = new();
    
    public bool IsRoundOver { get; set; }
    public bool IsGameOver { get; set; }
}
