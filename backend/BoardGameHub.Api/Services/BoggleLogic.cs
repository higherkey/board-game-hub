using System;
using System.Collections.Generic;
using System.Linq;

namespace BoardGameHub.Api.Services;

public static class BoggleLogic
{
    // Standard Boggle Dice (Classic 16 dice)
    private static readonly string[] Dice = new[]
    {
        "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
        "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
        "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
        "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ"
    };

    public static List<char> GenerateGrid()
    {
        var random = new Random();
        var shuffledDice = Dice.OrderBy(x => random.Next()).ToList();
        var grid = new List<char>();

        foreach (var die in shuffledDice)
        {
            var face = die[random.Next(die.Length)];
            // "Q" is usually "Qu" in Boggle, but we'll store 'Q' and handle display/logic elsewhere or just treat as 'Q'
            // For simplicity in backend, let's just store the char.
            grid.Add(face); 
        }

        return grid;
    }

    public static bool IsWordOnGrid(string word, List<char> grid, int size = 4)
    {
        if (string.IsNullOrWhiteSpace(word)) return false;
        word = word.ToUpperInvariant();
        // Handle "QU" logic if we want, but for now assuming user types 'Q' and 'U' separately
        // OR we treat 'Q' on the grid as 'Q', and if user types "QUEEN", we find Q-U-E-E-N. 
        // Standard Boggle die has "Qu". If we rolled 'Q', we can treat it as 'Q'.
        
        var board = new char[size, size];
        for (int i = 0; i < size * size; i++)
        {
            board[i / size, i % size] = grid[i];
        }

        for (int r = 0; r < size; r++)
        {
            for (int c = 0; c < size; c++)
            {
                if (Dfs(board, word, 0, r, c, new bool[size, size], size))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static bool Dfs(char[,] board, string word, int index, int r, int c, bool[,] visited, int size)
    {
        if (index == word.Length) return true;

        if (r < 0 || r >= size || c < 0 || c >= size || visited[r, c] || board[r, c] != word[index])
        {
            return false;
        }

        visited[r, c] = true;

        // Check all 8 directions
        int[] dr = { -1, -1, -1, 0, 0, 1, 1, 1 };
        int[] dc = { -1, 0, 1, -1, 1, -1, 0, 1 };

        for (int i = 0; i < 8; i++)
        {
            if (Dfs(board, word, index + 1, r + dr[i], c + dc[i], visited, size))
            {
                return true;
            }
        }

        visited[r, c] = false; // Backtrack
        return false;
    }

    public static int CalculateScore(string word)
    {
        int len = word.Length;
        if (len < 3) return 0;
        if (len == 3 || len == 4) return 1;
        if (len == 5) return 2;
        if (len == 6) return 3;
        if (len == 7) return 5;
        return 11; // 8+
    }
}
