using BoardGameHub.Api.Models;
using System.Text.Json;

namespace BoardGameHub.Api.Services;

public class SushiTrainGameService : IGameService
{
    public GameType GameType => GameType.SushiTrain;

    public Task StartRound(Room room, GameSettings settings)
    {
        var state = new SushiTrainState();
        
        // Initialize Deck
        state.Deck = CreateDeck();
        Shuffle(state.Deck);

        // Initialize Players
        foreach (var player in room.Players)
        {
            state.PlayerStates[player.ConnectionId] = new SushiPlayerState
            {
                PlayerId = player.ConnectionId,
                PlayerName = player.Name
            };
        }

        DealHands(state);

        room.GameData = state;
        return Task.CompletedTask;
    }

    public Task CalculateScores(Room room)
    {
        // This is called at end of game usually, but we score per round too.
        if (room.GameData is not SushiTrainState state) return Task.CompletedTask;
        
        // Final Scoring (Puddings)
        ScorePuddings(state);
        return Task.CompletedTask;
    }

    public bool SubmitSelection(Room room, string connectionId, string cardId)
    {
        if (room.GameData is not SushiTrainState state) return false;
        if (!state.PlayerStates.TryGetValue(connectionId, out var playerState)) return false;

        // Validation
        if (playerState.HasSelected) return true; // Already confirmed
        
        var card = playerState.Hand.FirstOrDefault(c => c.Id == cardId);
        if (card == null) return false; // Card not in hand

        // If using chopsticks, we need two cards
        if (playerState.IsUsingChopsticks)
        {
            if (playerState.SelectedCardId == null)
            {
                playerState.SelectedCardId = cardId;
                // Don't set HasSelected yet
            }
            else if (playerState.SelectedCardId == cardId)
            {
                // Already picked this one
                return false;
            }
            else
            {
                playerState.SelectedCardId2 = cardId;
                playerState.HasSelected = true;
            }
        }
        else
        {
            playerState.SelectedCardId = cardId;
            playerState.HasSelected = true;
        }

        CheckTurnComplete(room, state);
        return true;
    }

    public bool ToggleChopsticks(Room room, string connectionId)
    {
        if (room.GameData is not SushiTrainState state) return false;
        if (!state.PlayerStates.TryGetValue(connectionId, out var playerState)) return false;

        // Check if player has chopsticks in tableau
        var chopsticks = playerState.Tableau.FirstOrDefault(c => c.Type == SushiType.Chopsticks);
        if (chopsticks == null) return false;

        // Toggle
        playerState.IsUsingChopsticks = !playerState.IsUsingChopsticks;
        
        // Reset selections if toggling off
        if (!playerState.IsUsingChopsticks)
        {
            playerState.SelectedCardId = null;
            playerState.SelectedCardId2 = null;
            playerState.HasSelected = false;
        }

        return true;
    }

    private void CheckTurnComplete(Room room, SushiTrainState state)
    {
        if (state.PlayerStates.Values.All(p => p.HasSelected))
        {
            ProcessTurn(state);
        }
    }

    private void ProcessTurn(SushiTrainState state)
    {
        // 1. Move Selected Cards to Tableau
        foreach (var p in state.PlayerStates.Values)
        {
            // First Card
            var card1 = p.Hand.First(c => c.Id == p.SelectedCardId);
            p.Hand.Remove(card1);
            card1.IsNew = true;
            p.Tableau.Add(card1);

            // Second Card (Chopsticks)
            if (p.IsUsingChopsticks && p.SelectedCardId2 != null)
            {
                var card2 = p.Hand.First(c => c.Id == p.SelectedCardId2);
                p.Hand.Remove(card2);
                card2.IsNew = true;
                p.Tableau.Add(card2);

                // Return Chopsticks to Hand
                var chopsticks = p.Tableau.First(c => c.Type == SushiType.Chopsticks);
                p.Tableau.Remove(chopsticks);
                p.Hand.Add(chopsticks); // This hand will be passed to next player
            }
            
            p.SelectedCardId = null;
            p.SelectedCardId2 = null;
            p.IsUsingChopsticks = false;
            p.HasSelected = false;
        }

        // 2. Check if round end (Hand is empty)
        // Hand size is same for everyone.
        if (state.PlayerStates.Values.First().Hand.Count == 0)
        {
            EndRound(state);
        }
        else
        {
            RotateHands(state);
        }
    }

    private void RotateHands(SushiTrainState state)
    {
        // Get ordered list of players (to form a cycle)
        // We can follow the Dictionary order or sort by something. 
        // Let's rely on Keys list which is somewhat stable or sort it.
        var playerIds = state.PlayerStates.Keys.OrderBy(k => k).ToList();
        
        var tempHands = new List<List<SushiCard>>();
        foreach (var id in playerIds)
        {
            tempHands.Add(state.PlayerStates[id].Hand);
        }

        // Rotate: P0 gets P(N-1)'s hand? Or P0 passes to P1?
        // "Pass to the left" -> P0 passes to P1.
        // So P1 gets P0's hand. 
        // P_next = P_current
        
        // New Hand for I = Old Hand of (I-1)
        
        var rotatedHands = new List<List<SushiCard>>();
        
        // Last player's hand goes to index 0
        rotatedHands.Add(tempHands.Last());
        
        // Others shift
        for (int i = 0; i < playerIds.Count - 1; i++)
        {
            rotatedHands.Add(tempHands[i]);
        }

        // Apply back
        for (int i = 0; i < playerIds.Count; i++)
        {
            state.PlayerStates[playerIds[i]].Hand = rotatedHands[i];
        }
    }

    private void EndRound(SushiTrainState state)
    {
        // 1. Score the Tableau
        CalculateRoundScores(state);

        // 2. Cleanup
        foreach (var p in state.PlayerStates.Values)
        {
            // Keep Pudding
            var puddings = p.Tableau.Where(c => c.Type == SushiType.Pudding).ToList();
            p.Puddings.AddRange(puddings);
            
            p.Tableau.Clear();
            // p.RoundScore reset? Or we accumulate?
            // "Round Score" is usually just that round. "Total" is accumulated.
            // We added to Total in CalculateRoundScores.
        }

        // 3. Advance Round
        state.Round++;

        if (state.Round > 3)
        {
            state.IsGameOver = true;
            state.IsRoundOver = true; // Signal UI
            ScorePuddings(state);
        }
        else
        {
            // Deal next round
            DealHands(state);
        }
    }

    private void CalculateRoundScores(SushiTrainState state)
    {
        // Maki Majority
        ScoreMaki(state);

        foreach (var p in state.PlayerStates.Values)
        {
            int score = 0;
            
            // Standard Items
            // Tempura: Sets of 2 = 5pts
            int tempuras = p.Tableau.Count(c => c.Type == SushiType.Tempura);
            score += (tempuras / 2) * 5;

            // Sashimi: Sets of 3 = 10pts
            int sashimis = p.Tableau.Count(c => c.Type == SushiType.Sashimi);
            score += (sashimis / 3) * 10;

            // Dumplings: 1, 3, 6, 10, 15
            int dumplings = p.Tableau.Count(c => c.Type == SushiType.Dumpling);
            score += ScoreDumplings(dumplings);

            // Nigiri & Wasabi

            // Re-scan Tableau logic for Wasabi/Nigiri pairing
            int activeWasabi = 0;
            foreach (var card in p.Tableau)
            {
                if (card.Type == SushiType.Wasabi)
                {
                    activeWasabi++;
                }
                else if (IsNigiri(card.Type))
                {
                    int val = GetNigiriValue(card);
                    if (activeWasabi > 0)
                    {
                        score += val * 3;
                        activeWasabi--; // Used up
                    }
                    else
                    {
                        score += val;
                    }
                }
            }

            p.RoundScore = score;
            p.TotalScore += score;
        }
    }

    private void ScoreMaki(SushiTrainState state)
    {
        // Logic: Most Maki icons = 6 pts. 2nd most = 3 pts.
        // Ties split the points? "Split the points (rounded down)"
        
        var makiCounts = state.PlayerStates.Values.Select(p => new 
        { 
            Player = p, 
            Count = p.Tableau.Sum(c => GetMakiCount(c)) 
        }).ToList();

        int max = makiCounts.Max(x => x.Count);
        if (max == 0) return; // No points if 0

        // Winners
        var winners = makiCounts.Where(x => x.Count == max).ToList();
        int winPoints = 6 / winners.Count;
        foreach (var w in winners)
        {
            w.Player.RoundScore += winPoints;
            w.Player.TotalScore += winPoints; // Add immediately to total too? Or just keep separate variable?
                                              // Let's add to total for display simplicity
        }

        // Second place (only if not everyone tied for first?)
        // If more than 1 winner, do we award 2nd place?
        // Rules: "If multiple players tie for first, split 6. No 2nd place points awarded."
        if (winners.Count == 1)
        {
            // Find 2nd
            var others = makiCounts.Where(x => x.Count < max).ToList();
            if (others.Any())
            {
                int secondMax = others.Max(x => x.Count);
                if (secondMax > 0)
                {
                    var seconds = others.Where(x => x.Count == secondMax).ToList();
                    int secPoints = 3 / seconds.Count;
                    foreach (var s in seconds)
                    {
                        s.Player.RoundScore += secPoints;
                        s.Player.TotalScore += secPoints;
                    }
                }
            }
        }
    }

    private void ScorePuddings(SushiTrainState state)
    {
        // End of game check
        // Most = +6, Least = -6
        // Ties split +6. Ties for least split -6.
        // If 2 players: No penalty for least.
        
        var counts = state.PlayerStates.Values.Select(p => new 
        { 
            Player = p, 
            Count = p.Puddings.Count 
        }).ToList();

        int max = counts.Max(x => x.Count);
        int min = counts.Min(x => x.Count);

        // If all players have the same number of puddings, no points are awarded.
        if (max == min) return;

        // Most
        var mosts = counts.Where(x => x.Count == max).ToList();
        int mostPts = 6 / mosts.Count;
        foreach (var m in mosts) m.Player.TotalScore += mostPts;

        // Least (only if > 2 players)
        if (state.PlayerStates.Count > 2)
        {
            var leasts = counts.Where(x => x.Count == min).ToList();
            int leastPts = -6 / leasts.Count;
            foreach (var l in leasts) l.Player.TotalScore += leastPts;
        }
    }

    private bool IsNigiri(SushiType type) => type == SushiType.NigiriEgg || type == SushiType.NigiriSalmon || type == SushiType.NigiriSquid;

    private int GetNigiriValue(SushiCard card)
    {
        return card.Type switch
        {
            SushiType.NigiriEgg => 1,
            SushiType.NigiriSalmon => 2,
            SushiType.NigiriSquid => 3,
            _ => 0
        };
    }

    private int GetMakiCount(SushiCard card)
    {
         if (card.Type == SushiType.Maki1) return 1;
         if (card.Type == SushiType.Maki2) return 2;
         if (card.Type == SushiType.Maki3) return 3;
         return 0;
    }

    private int ScoreDumplings(int count)
    {
        if (count == 0) return 0;
        if (count == 1) return 1;
        if (count == 2) return 3;
        if (count == 3) return 6;
        if (count == 4) return 10;
        return 15; // 5 or more
    }
    
    private void DealHands(SushiTrainState state)
    {
        int playerCount = state.PlayerStates.Count;
        int handSize = playerCount switch
        {
            2 => 10,
            3 => 9,
            4 => 8,
            5 => 7,
            _ => 7 // Default?
        };

        if (state.Deck.Count < playerCount * handSize)
        {
            // Error: not enough cards? Or just deal what's left?
            // Should be enough if standard deck logic is used.
        }

        foreach (var p in state.PlayerStates.Values)
        {
            var cards = state.Deck.Take(handSize).ToList();
            p.Hand = cards;
            state.Deck.RemoveRange(0, cards.Count);
        }
    }

    private List<SushiCard> CreateDeck()
    {
        var deck = new List<SushiCard>();
        
        // Helper
        void Add(SushiType type, int count, int val = 0)
        {
            for(int i=0; i<count; i++) deck.Add(new SushiCard { Type = type, Value = val });
        }

        Add(SushiType.Tempura, 14);
        Add(SushiType.Sashimi, 14);
        Add(SushiType.Dumpling, 14);
        Add(SushiType.Maki1, 6, 1); // Approx counts from BGG/Rules
        Add(SushiType.Maki2, 12, 2);
        Add(SushiType.Maki3, 8, 3);
        Add(SushiType.NigiriSalmon, 10, 2);
        Add(SushiType.NigiriSquid, 5, 3);
        Add(SushiType.NigiriEgg, 5, 1);
        Add(SushiType.Pudding, 10);
        Add(SushiType.Wasabi, 6);
        Add(SushiType.Chopsticks, 4);

        return deck;
    }

    private void Shuffle<T>(List<T> list)
    {
        var rng = new Random();
        int n = list.Count;
        while (n > 1)
        {
            n--;
            int k = rng.Next(n + 1);
            T value = list[k];
            list[k] = list[n];
            list[n] = value;
        }
    }

    public async Task EndRound(Room room)
    {
        room.State = GameState.Finished;
        await CalculateScores(room);
    }

    public Task<bool> HandleAction(Room room, GameAction action, string connectionId)
    {
        if (action.Type == "SUBMIT_SELECTION" && action.Payload.HasValue)
        {
             if (action.Payload.Value.TryGetProperty("cardId", out var cardProp))
             {
                 return Task.FromResult(SubmitSelection(room, connectionId, cardProp.GetString() ?? ""));
             }
        }
        else if (action.Type == "TOGGLE_CHOPSTICKS")
        {
            return Task.FromResult(ToggleChopsticks(room, connectionId));
        }
        return Task.FromResult(false);
    }
    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<SushiTrainState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new SushiTrainState();
    }
}
