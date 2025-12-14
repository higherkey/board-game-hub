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

        public GameType GameType => GameType.GreatMinds;

        public GreatMindsGameService(IHubContext<GameHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public void StartRound(Room room, GameSettings settings)
        {
            // Initialize State
            var state = new GreatMindsGameState(room.Players.Count);
            room.GameData = state;
            
            // Deal Level 1
            state.DealLevel(1);

            // Notify Clients
            BroadcastState(room).Wait();
        }

        public void CalculateScores(Room room)
        {
            // No scoring per se, but we could assign points based on level reached?
            // For now, no-op or maybe give 100 points per level completed?
        }

        public bool SubmitCard(Room room, string playerId, int cardValue)
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

                _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "ERROR_PLAY", new 
                { 
                    PlayedBy = playerId, 
                    PlayedCard = cardValue, 
                    MissedCards = lowerCardsFound 
                }).Wait();

                if (state.IsGameOver)
                {
                    _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "GAME_OVER", new { }).Wait();
                }
            }
            else
            {
                // SUCCESS
                state.PlayerHands[playerId].Remove(cardValue);
                state.TopCard = cardValue;
                
                _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "CARD_PLAYED", new 
                { 
                    PlayedBy = playerId, 
                    Card = cardValue 
                }).Wait();

                if (state.IsLevelComplete)
                {
                    NextLevel(room, state).Wait();
                }
            }

            BroadcastState(room).Wait();
            return true;
        }

        public bool SubmitSync(Room room, string playerId)
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

             _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "SYNC_EXECUTED", new 
             { 
                 DiscardedCards = discardedCards 
             }).Wait();
             
             if (state.IsLevelComplete)
             {
                 NextLevel(room, state).Wait();
             }

             BroadcastState(room).Wait();
             return true;
        }

        private async Task NextLevel(Room room, GreatMindsGameState state)
        {
            // Bonus Rewards
            if (state.CurrentLevel == 3 || state.CurrentLevel == 6 || state.CurrentLevel == 9)
            {
                state.Lives++;
                state.SyncTokens++;
            }

            int nextLevel = state.CurrentLevel + 1;
            if (nextLevel > 12)
            {
                await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "VICTORY", new { });
                return;
            }

            state.DealLevel(nextLevel);
            await _hubContext.Clients.Group(room.Code).SendAsync("GameEvent", "LEVEL_START", new { Level = nextLevel });
        }

        private async Task BroadcastState(Room room)
        {
            var state = GetState(room);
            if(state == null) return;

            foreach (var player in room.Players)
            {
                // Ensure the player is in the state (might have joined late?)
                // If not in state, they get empty hand view?
                var myHand = state.PlayerHands.ContainsKey(player.ConnectionId) ? state.PlayerHands[player.ConnectionId] : new List<int>();

                var sanitizedState = new 
                {
                    CurrentLevel = state.CurrentLevel,
                    Lives = state.Lives,
                    SyncTokens = state.SyncTokens,
                    TopCard = state.TopCard,
                    MyHand = myHand,
                    OtherHandCounts = state.PlayerHands.Where(p => p.Key != player.ConnectionId).ToDictionary(p => p.Key, p => p.Value.Count)
                };

                await _hubContext.Clients.Client(player.ConnectionId).SendAsync("GameState", sanitizedState);
            }
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
    }
}
