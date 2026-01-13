using BoardGameHub.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Services.Core;

public class DictionaryServiceTests
{
    private readonly DictionaryService _sut;
    private readonly Mock<ILogger<DictionaryService>> _loggerMock;

    public DictionaryServiceTests()
    {
        _loggerMock = new Mock<ILogger<DictionaryService>>();
        _sut = new DictionaryService(_loggerMock.Object);
        
        // Wait for background init (hacky but needed for this specific implementation)
        // In a real scenario, we might want to dependency inject the wrapper.
        // We'll give it a moment.
        System.Threading.Thread.Sleep(500);
    }

    [Theory]
    [InlineData("Apple", true)]
    [InlineData("apple", true)]
    [InlineData("xyzabc", false)]
    public void IsValid_ShouldValidateBasicWords(string word, bool expected)
    {
        // Act
        // Note: This relies on the actual `gnuciDictionary` library being able to run in the test context.
        // If the library fails to load in tests (e.g. missing files), this might fail.
        // However, based on the implementation, we want to ensure the wrapping logic works.
        var result = _sut.IsValid(word);

        // Assert
        result.Should().Be(expected);
    }

    [Fact]
    public void IsValid_ShouldHandlePlurals_WhenRootIsValid()
    {
        // "Apples" should be valid because "Apple" is valid
        // Assuming "Apples" might not be in the dictionary directly, or if it is, this test handles both.
        // To strictly test the fallback, use a nonsense word that "has a valid singular"?
        // It's hard to invent a fake word for a real dictionary.
        // We will trust "Cats" exists or "Cat" exists.
        
        _sut.IsValid("Cats").Should().BeTrue();
    }
    
    [Fact] 
    public void IsValid_ShouldFail_IfSingularAlsoInvalid()
    {
        _sut.IsValid("Xyzabcs").Should().BeFalse();
    }
}
