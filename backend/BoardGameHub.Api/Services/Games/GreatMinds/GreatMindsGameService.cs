using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

namespace BoardGameHub.Api.Services.Games.GreatMinds
{
    public class GreatMindsGameService : IGameService
    {
        private readonly IHubContext<GameHub> _hubContext;
        private readonly ILogger<GreatMindsGameService> _logger;

        public GameType GameType => GameType.GreatMinds;

        public GreatMindsGameService(IHubContext<GameHub> hubContext, ILogger<GreatMindsGameService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public Task StartRound(Room room, GameSettings settings)
        {
            _logger.LogInformation("Starting Great Minds round in room {Code}", room.Code);
            // 1. Setup State
            var state = new GreatMindsGameState();
            
            // 2. Initialize Players (Lives = 2 for 2-3p, 1 for >3p usually in The Mind)
            // Rule book: 2p -> Level 1-12, 2 lives. 3p -> Level 1-10, 2 lives. 4p -> L1-8, 2 lives.
            // Simplified: Everyone starts with lives? No, Team Lives.
            state.Lives = room.Players.Count;
            state.SyncTokens = 1;
            state.CurrentLevel = 1;

            foreach (var p in room.Players)
            {
                state.PlayerPresence[p.ConnectionId] = 0.0;
            }

            room.GameData = state;

            // 3. Deal Level 1
            DealCards(room, state);

            // 3. Deal Level 1
            DealCards(room, state);

            return Task.CompletedTask;
        }

        private void DealCards(Room room, GreatMindsGameState state)
        {
            state.PlayerHands.Clear();
            var deck = Enumerable.Range(1, 100).ToList();
            var rng = new Random();
            // Shuffle
            deck = deck.OrderBy(x => rng.Next()).ToList();
            
            int cardsPerPlayer = state.CurrentLevel;
            int cardIndex = 0;

            foreach(var player in room.Players)
            {
                var hand = new List<int>();
                for(int i=0; i<cardsPerPlayer; i++)
                {
                    if (cardIndex < deck.Count)
                    {
                        hand.Add(deck[cardIndex++]);
                    }
                }
                hand.Sort();
                state.PlayerHands[player.ConnectionId] = hand;
            }
        }

        public Task CalculateScores(Room room)
        {
            // Cooperative, score = Level reached.
            // No explicit end-of-game scoring except "You won/lost".
            return Task.CompletedTask;
        }

        public async Task<bool> SubmitCard(Room room, string playerId, int cardValue)
        {
            var state = GetState(room);
            if (state == null || state.IsGameOver) return false;

            // Validation: Does player have this card?
            if (!state.PlayerHands.ContainsKey(playerId) || !state.PlayerHands[playerId].Contains(cardValue))
            {
                return false;
            }

            // Validation: Is it their lowest card?
            int myLowest = state.PlayerHands[playerId].First();
            if (cardValue != myLowest)
            {
                return false; 
            }

            // CORE GAME LOGIC
            var otherPlayers = state.PlayerHands.Where(p => p.Key != playerId);
            var lowerCardsFound = new Dictionary<string, int>();

            foreach (var playerHand in otherPlayers)
            {
                if (playerHand.Value.Any() && playerHand.Value.First() < cardValue)
                {
                    lowerCardsFound.Add(playerHand.Key, playerHand.Value.First());
                }
            }

            if (lowerCardsFound.Any())
            {
                // ERROR
                state.Lives--;
                
                state.PlayerHands[playerId].Remove(cardValue);
                state.TopCard = cardValue; 

                // Remove lower cards
                foreach(var lower in lowerCardsFound)
                {
                    state.PlayerHands[lower.Key].Remove(lower.Value);
                }

                await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "ERROR_PLAY", new 
                { 
                    PlayedBy = playerId, 
                    PlayedCard = cardValue, 
                    MissedCards = lowerCardsFound 
                });

                if (state.IsGameOver)
                {
                    await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "GAME_OVER", new { });
                }
            }
            else
            {
                // SUCCESS
                bool removed = state.PlayerHands[playerId].Remove(cardValue);
                _logger.LogInformation("Submitted Card {Card} for {Player}. Removed: {Removed}. Remaining: {Count}", cardValue, playerId, removed, state.PlayerHands[playerId].Count);
                state.TopCard = cardValue;
                
                await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "CARD_PLAYED", new 
                { 
                    PlayedBy = playerId, 
                    Card = cardValue 
                });

                if (state.IsLevelComplete)
                {
                    await NextLevel(room, state);
                }
            }

            return true;
        }

        public async Task<bool> SubmitSync(Room room, string playerId)
        {
             var state = GetState(room);
             if (state == null || state.IsGameOver || state.SyncTokens <= 0) return false;
             
             state.SyncTokens--;

             var discardedCards = new Dictionary<string, int>();
             foreach(var player in state.PlayerHands)
             {
                 if(player.Value.Any())
                 {
                     int lowest = player.Value.First();
                     player.Value.Remove(lowest);
                     discardedCards.Add(player.Key, lowest);
                 }
             }

             await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "SYNC_EXECUTED", new 
             { 
                 DiscardedCards = discardedCards 
             });
             
             if (state.IsLevelComplete)
             {
                 await NextLevel(room, state);
             }

             return true;
        }

        private async Task NextLevel(Room room, GreatMindsGameState state)
        {
            // Bonus Rewards: Level 2 complete (+1 life), Level 3 complete (+1 life, +1 sync), etc.
            // Following official rules:
            // Reward Level 2, 7, 10 -> +1 Life
            // Reward Level 3, 5, 8 -> +1 Sync Token
            // Let's stick to my plan for simplicity or align with official?
            // User plan: Level 3, 6, 9 -> +1 Life, +1 Sync Token. This is fine.
            if (state.CurrentLevel == 3 || state.CurrentLevel == 6 || state.CurrentLevel == 9)
            {
                state.Lives++;
                state.SyncTokens++;
                await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "REWARD_GRANTED", new { Lives = state.Lives, SyncTokens = state.SyncTokens });
            }

            state.CurrentLevel++;
            if (state.CurrentLevel > 12)
            {
                await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "VICTORY", new { });
                return;
            }

            DealCards(room, state);
            await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "LEVEL_START", new { Level = state.CurrentLevel });
        }


        private GreatMindsGameState? GetState(Room room)
        {
            if (room.GameData is GreatMindsGameState s) return s;
            
            // Handle deserialization if it came from JSON/Undo
            if (room.GameData is JsonElement element)
            {
                var options = new JsonSerializerOptions { IncludeFields = true };
                try 
                {
                    var updated = element.Deserialize<GreatMindsGameState>(options);
                    room.GameData = updated; // Cache it back
                    return updated;
                }
                catch { return null; }
            }
            return room.GameData as GreatMindsGameState;
        }

        public async Task<bool> HandleAction(Room room, GameAction action, string connectionId)
        {
            if (action.Type == "PLAY_CARD" && action.Payload.HasValue)
            {
                 if (action.Payload.Value.TryGetProperty("cardValue", out var cardProp))
                 {
                     return await SubmitCard(room, connectionId, cardProp.GetInt32());
                 }
            }
            else if (action.Type == "SYNC_TOKEN")
            {
                return await SubmitSync(room, connectionId);
            }
            else if (action.Type == "PRESENCE_UPDATE")
            {
                if (action.Payload.HasValue && action.Payload.Value.TryGetProperty("value", out var presenceProp))
                {
                    var state = GetState(room);
                    if (state != null)
                    {
                        state.PlayerPresence[connectionId] = presenceProp.GetDouble();
                        state.PlayerPresence[connectionId] = presenceProp.GetDouble();
                        return true;
                    }
                }
            }
            return false;
        }
        public async Task EndRound(Room room)
        {
            room.State = GameState.Finished;
            await CalculateScores(room);
        }

    public object DeserializeState(System.Text.Json.JsonElement json)
    {
        return json.Deserialize<GreatMindsGameState>(new System.Text.Json.JsonSerializerOptions { IncludeFields = true }) ?? new GreatMindsGameState();
    }
}
}
