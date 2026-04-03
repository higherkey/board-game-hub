using BoardGameHub.Api.Services;
using FluentAssertions;
using Xunit;

namespace BoardGameHub.Tests.Services.Games;

public class BabbleServiceTests
{
    private readonly BabbleService _sut;

    public BabbleServiceTests()
    {
        _sut = new BabbleService();
    }

    [Theory]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    public void GenerateGrid_ShouldReturnCorrectSize(int size)
    {
        // Act
        var grid = _sut.GenerateGrid(size);

        // Assert
        grid.Count.Should().Be(size * size);
    }

    [Theory]
    [InlineData("HI", 0)]
    [InlineData("CAT", 1)]
    [InlineData("CATS", 1)]
    [InlineData("CATTY", 2)]
    [InlineData("CATTYS", 3)]
    [InlineData("CATTYSS", 5)]
    [InlineData("CATTYSSS", 11)]
    public void CalculateScore_ShouldAwardCorrectPoints(string word, int expected)
    {
        // Act
        var score = _sut.CalculateScore(word);

        // Assert
        score.Should().Be(expected);
    }

    [Fact]
    public void IsWordOnGrid_ShouldReturnTrue_ForHorizontalWord()
    {
        // Arrange
        var grid = new List<char> { 
            'A', 'B', 'C', 'D',
            'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P'
        };

        // Act
        var result = _sut.IsWordOnGrid("ABCD", grid);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsWordOnGrid_ShouldReturnTrue_ForDiagonalWord()
    {
        // Arrange
        var grid = new List<char> { 
            'A', 'B', 'C', 'D',
            'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P'
        };

        // Act
        var result = _sut.IsWordOnGrid("AFKP", grid);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public void IsWordOnGrid_ShouldReturnFalse_ForWordNotOnGrid()
    {
        // Arrange
        var grid = new List<char> { 
            'A', 'B', 'C', 'D',
            'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P'
        };

        // Act
        var result = _sut.IsWordOnGrid("XYZ", grid);

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsWordOnGrid_ShouldReturnFalse_WhenReusingCell()
    {
        // Arrange
        var grid = new List<char> { 
            'A', 'B', 'C', 'D',
            'E', 'F', 'G', 'H',
            'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P'
        };

        // Act
        var result = _sut.IsWordOnGrid("ABA", grid); // 'A' and 'B' are adjacent, but 'A' shouldn't be reusable

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public void IsWordOnGrid_ShouldHandleQuSpecialCase_Correctly()
    {
        // Arrange
        var grid = new List<char> { 
            'Q', 'B', 'C', 'D',
            'I', 'F', 'G', 'H',
            'I', 'J', 'K', 'L',
            'M', 'N', 'O', 'P'
        };

        // Act & Assert
        _sut.IsWordOnGrid("QU", grid).Should().BeTrue();
        _sut.IsWordOnGrid("QUI", grid).Should().BeTrue();
        _sut.IsWordOnGrid("Q", grid).Should().BeFalse(); // Must have U
        _sut.IsWordOnGrid("QB", grid).Should().BeFalse(); // Must have U after Q
    }

    [Fact]
    public void IsWordOnGrid_ShouldHandleGridEdgeCases()
    {
        // Arrange & Act & Assert
        _sut.IsWordOnGrid("", new List<char>()).Should().BeFalse();
        _sut.IsWordOnGrid("A", new List<char> { 'A', 'B', 'C' }).Should().BeFalse(); // Not a perfect square
    }
}
