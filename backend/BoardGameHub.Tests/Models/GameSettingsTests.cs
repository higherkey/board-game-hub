using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using FluentAssertions;
using Xunit;

namespace BoardGameHub.Tests.Models;

public class GameSettingsTests
{
    [Theory]
    [InlineData(40000, 6)]
    [InlineData(-3, 4)]
    [InlineData(5, 5)]
    public void Clamp_BoardSize_IsBounded(int input, int expected)
    {
        var s = new GameSettings { BoardSize = input };
        s.Clamp();
        s.BoardSize.Should().Be(expected);
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(999, 50)]
    [InlineData(7, 7)]
    public void Clamp_TotalRounds_IsBounded(int input, int expected)
    {
        var s = new GameSettings { TotalRounds = input };
        s.Clamp();
        s.TotalRounds.Should().Be(expected);
    }

    [Theory]
    [InlineData(-5, 0)]
    [InlineData(100000, 3600)]
    [InlineData(0, 0)]
    public void Clamp_TimerDuration_IsBoundedAndZeroStaysValid(int input, int expected)
    {
        var s = new GameSettings { TimerDurationSeconds = input };
        s.Clamp();
        s.TimerDurationSeconds.Should().Be(expected);
    }

    [Fact]
    public void Clamp_CustomCategories_LimitsCountAndLength()
    {
        var s = new GameSettings { CustomCategories = Enumerable.Repeat(new string('x', 500), 30).ToList() };
        s.Clamp();
        s.CustomCategories.Should().HaveCount(20);
        s.CustomCategories.Should().OnlyContain(c => c.Length == 100);
    }

    [Fact]
    public void Clamp_CustomCategories_TrimsAndDropsEmpty()
    {
        var s = new GameSettings { CustomCategories = new List<string> { "  a  ", "", "   " } };
        s.Clamp();
        s.CustomCategories.Should().Equal("a");
    }

    [Fact]
    public void Clamp_NullCategoriesAndSeed_BecomeEmpty()
    {
        var s = new GameSettings { CustomCategories = null!, GenerativeSeed = null! };
        s.Clamp();
        s.CustomCategories.Should().BeEmpty();
        s.GenerativeSeed.Should().BeEmpty();
    }

    [Fact]
    public void Clamp_Seed_IsCutTo100()
    {
        var s = new GameSettings { GenerativeSeed = new string('s', 500) };
        s.Clamp();
        s.GenerativeSeed.Should().HaveLength(100);
    }

    [Fact]
    public void Clamp_UndefinedLetterMode_FallsBackToNormal()
    {
        var s = new GameSettings { LetterMode = (ScatterbrainData.LetterMode)999 };
        s.Clamp();
        s.LetterMode.Should().Be(ScatterbrainData.LetterMode.Normal);
    }
}
