using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class BoggleService
{
    // Standard 16-die Boggle set (Classic)
    private static readonly string[] Dice = new[]
    {
        "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
        "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
        "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
        "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ"
    };

    public List<char> GenerateGrid()
    {
        var rng = new Random();
        var dice = Dice.ToList();
        
        // Shuffle dice positions
        int n = dice.Count;
        while (n > 1)
        {
            n--;
            int k = rng.Next(n + 1);
            (dice[k], dice[n]) = (dice[n], dice[k]);
        }

        // Roll each die
        var grid = new List<char>();
        foreach (var die in dice)
        {
            char face = die[rng.Next(die.Length)];
            // Handle 'Q' as 'Qu' logic visually, but data-wise we store 'Q'.
            // Frontend usually displays "Qu" if it sees "Q".
            grid.Add(face);
        }

        return grid;
    }

    public int CalculateScore(string word)
    {
        int len = word.Length;
        if (len < 3) return 0;
        if (len == 3 || len == 4) return 1;
        if (len == 5) return 2;
        if (len == 6) return 3;
        if (len == 7) return 5;
        return 11; // 8+
    }

    public bool IsWordOnGrid(string word, List<char> grid)
    {
        // Grid is 4x4 flattened (16 chars)
        if (string.IsNullOrEmpty(word)) return false;
        if (grid == null || grid.Count != 16) return false;

        var upperWord = word.ToUpperInvariant();
        var width = 4;
        var height = 4;
        var visited = new bool[16];

        for (int i = 0; i < 16; i++)
        {
            if (CheckCell(i, 0, visited)) return true;
        }

        return false;

        bool CheckCell(int index, int wordIndex, bool[] currentVisited)
        {
            // Character Match? (Handle Q -> Qu if needed, but for now simple char match)
            // Note: If we use Qu logic, we need to handle "QU" in word vs "Q" in grid.
            // Simplified: "Q" in grid matches "Q" in word.
            
            char gridChar = grid[index];
            char wordChar = upperWord[wordIndex];

            if (gridChar != wordChar) return false;

            currentVisited[index] = true;

            if (wordIndex == upperWord.Length - 1)
            {
                 currentVisited[index] = false; // backtrack
                 return true;
            }

            // Check Neighbors
            int row = index / 4;
            int col = index % 4;

            for (int r = -1; r <= 1; r++)
            {
                for (int c = -1; c <= 1; c++)
                {
                    if (r == 0 && c == 0) continue;

                    int nextRow = row + r;
                    int nextCol = col + c;

                    if (nextRow >= 0 && nextRow < height && nextCol >= 0 && nextCol < width)
                    {
                        int nextIndex = nextRow * 4 + nextCol;
                        if (!currentVisited[nextIndex])
                        {
                            if (CheckCell(nextIndex, wordIndex + 1, currentVisited))
                            {
                                currentVisited[index] = false; // backtrack
                                return true;
                            }
                        }
                    }
                }
            }

            currentVisited[index] = false; // backtrack
            return false;
        }
    }
}
