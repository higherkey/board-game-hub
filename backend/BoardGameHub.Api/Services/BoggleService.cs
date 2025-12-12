using BoardGameHub.Api.Models;

namespace BoardGameHub.Api.Services;

public class BoggleService
{
    private readonly Random _random = new();

    // Classic 4x4 Dice
    private static readonly string[] Dice4x4 = {
        "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
        "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
        "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
        "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ"
    };

    // Big Boggle 5x5 Dice
    private static readonly string[] Dice5x5 = {
        "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
        "AEEGMU", "AEGMNN", "AFIRSY", "BJKQXZ", "CCENST",
        "CEIILT", "CEILPT", "CEIPST", "DDHNOT", "DHHLOR",
        "DHLNOR", "DDLNOR", "EIIITT", "EMOTTT", "ENSSSU",
        "FIPRSY", "GORRVW", "HIPRRY", "NOOTUW", "OOOTTU"
    };

    public List<char> GenerateGrid(int size = 4)
    {
        string[] diceSource;
        if (size == 5) diceSource = Dice5x5;
        else if (size == 6) 
        {
            // Combine for 36 dice: 5x5 + 11 random from 4x4
            var list = new List<string>(Dice5x5);
            list.AddRange(Dice4x4.Take(11)); 
            diceSource = list.ToArray();
        }
        else diceSource = Dice4x4;

        var availableDice = diceSource.ToList();
        
        // Ensure enough dice if we requested something custom or logic above was slightly off
        int totalDice = size * size;
        while(availableDice.Count < totalDice)
        {
            availableDice.Add("EOTAIN"); // Add generic common letters
        }
        
        // Trim if too many (e.g. if we default logic for 6x6 ended up with more?)
        // Logic above: 25 + 11 = 36. Correct.

        var grid = new List<char>();

        // Shuffle dice positions
        var shuffledDice = availableDice.OrderBy(x => _random.Next()).Take(totalDice).ToList();

        foreach (var die in shuffledDice)
        {
            // Roll the die
            int side = _random.Next(0, 6);
            grid.Add(die[side]);
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
        if (string.IsNullOrWhiteSpace(word)) return false;
        
        int size = (int)Math.Sqrt(grid.Count); // Infer size from grid count
        if (size * size != grid.Count) return false; // Invalid grid

        var wordUpper = word.ToUpperInvariant();
        var visited = new bool[grid.Count];
        
        // Find all starting positions
        for (int i = 0; i < grid.Count; i++)
        {
            if (CheckCell(i, wordUpper, 0, visited, grid, size))
            {
                return true;
            }
        }
        return false;
    }

    private bool CheckCell(int index, string word, int charIndex, bool[] visited, List<char> grid, int size)
    {
        char letter = word[charIndex];
        char gridChar = grid[index];

        // Handle Qu: If grid has 'Q', and word expects 'Q' then 'U'.
        // Simplified logic: We store 'Q' in grid.
        // If word has 'Q', next must be 'U'.
        bool isQuStart = (gridChar == 'Q' && letter == 'Q');
        
        if (isQuStart)
        {
             // Must have U next in word
             if (charIndex + 1 >= word.Length || word[charIndex + 1] != 'U') return false;
        }
        else
        {
            if (gridChar != letter) return false;
        }

        visited[index] = true;

        int nextCharIndex = isQuStart ? charIndex + 2 : charIndex + 1;

        if (nextCharIndex >= word.Length) 
        {
            visited[index] = false;
            return true; // Found whole word
        }

        // Check neighbors
        int row = index / size;
        int col = index % size;

        for (int r = row - 1; r <= row + 1; r++)
        {
            for (int c = col - 1; c <= col + 1; c++)
            {
                if (r >= 0 && r < size && c >= 0 && c < size)
                {
                    int neighborIndex = r * size + c;
                    if (!visited[neighborIndex])
                    {
                        if (CheckCell(neighborIndex, word, nextCharIndex, visited, grid, size)) 
                        {
                            visited[index] = false;
                            return true;
                        }
                    }
                }
            }
        }

        visited[index] = false; // Backtrack
        return false;
    }
}
