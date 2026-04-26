using BoardGameHub.Api.Services.Games;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class FarkleServiceTests
{
    [Theory]
    [InlineData(new int[] { 1, 1, 1, 2, 3, 4 }, 1000)] // Three 1s
    [InlineData(new int[] { 5, 5, 5, 2, 3, 4 }, 500)]  // Three 5s
    [InlineData(new int[] { 2, 2, 2, 3, 4, 6 }, 200)]  // Three 2s
    [InlineData(new int[] { 1, 5, 2, 3, 4, 2 }, 150)]  // A 1 and a 5 (no straight)
    [InlineData(new int[] { 2, 3, 4, 6, 2, 3 }, 0)]    // No score
    [InlineData(new int[] { 1, 2, 3, 4, 5, 6 }, 1500)] // Straight
    [InlineData(new int[] { 2, 2, 3, 3, 4, 4 }, 1500)] // Three pairs
    [InlineData(new int[] { 1, 1, 1, 1, 2, 3 }, 2000)] // Four 1s
    [InlineData(new int[] { 5, 5, 5, 5, 5, 2 }, 2000)] // Five 5s (base 500 * 2rd pow(2) = 2000)
    public void CalculateDiceScore_ReturnsCorrectScore(int[] dice, int expectedScore)
    {
        // Act
        var result = FarkleService.CalculateDiceScore(dice.ToList());

        // Assert
        Assert.Equal(expectedScore, result);
    }
}
