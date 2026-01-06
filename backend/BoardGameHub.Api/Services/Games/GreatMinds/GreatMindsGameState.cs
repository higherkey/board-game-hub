using System;
using System.Collections.Generic;
using System.Linq;

namespace BoardGameHub.Api.Services.Games.GreatMinds
{
    public class GreatMindsGameState
    {
        public int CurrentLevel { get; set; } = 1;
        public int Lives { get; set; }
        public int SyncTokens { get; set; }
        public List<int> Deck { get; set; } = new List<int>();
        public Dictionary<string, List<int>> PlayerHands { get; set; } = new Dictionary<string, List<int>>();
        public Dictionary<string, double> PlayerPresence { get; set; } = new Dictionary<string, double>(); // 0.0 to 1.0
        public int TopCard { get; set; } = 0;
        
        // Game Over / Level Complete States
        public bool IsLevelComplete => PlayerHands.Values.All(hand => hand.Count == 0);
        public bool IsGameOver => Lives <= 0;

        public GreatMindsGameState() { }

        public GreatMindsGameState(int playerCount)
        {
            Lives = playerCount; // Start lives = number of players
            SyncTokens = 1;
        }

        public void DealLevel(int level)
        {
            CurrentLevel = level;
            TopCard = 0;
            
            // Rebuild and shuffle deck (1-100)
            Deck = Enumerable.Range(1, 100).OrderBy(x => Guid.NewGuid()).ToList();
            
            // Deal cards
            foreach (var player in PlayerHands.Keys.ToList())
            {
                PlayerHands[player] = Deck.Take(level).OrderBy(x => x).ToList();
                Deck.RemoveRange(0, level);
            }
        }
    }
}
