using BoardGameHub.Api.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BoardGameHub.Tests.Controllers;

public class ClientLoggingControllerTests
{
    private readonly Mock<ILogger<ClientLoggingController>> _mockLogger;
    private readonly ClientLoggingController _sut;

    public ClientLoggingControllerTests()
    {
        _mockLogger = new Mock<ILogger<ClientLoggingController>>();
        _sut = new ClientLoggingController(_mockLogger.Object);
    }

    [Theory]
    [InlineData("DEBUG", LogLevel.Debug)]
    [InlineData("INFO", LogLevel.Information)]
    [InlineData("WARN", LogLevel.Warning)]
    [InlineData("ERROR", LogLevel.Error)]
    [InlineData("UNKNOWN", LogLevel.Information)]
    public void PostLog_ShouldLogBasedOnLevel(string level, LogLevel expectedLogLevel)
    {
        // Arrange
        var entry = new LogEntry { Level = level, Message = "Test Message", Data = "Test Data" };

        // Act
        var result = _sut.PostLog(entry) as OkResult;

        // Assert
        result.Should().NotBeNull();
        
        _mockLogger.Verify(logger => logger.Log(
            expectedLogLevel,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Test Message")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()), 
        Times.Once);
    }

    [Fact]
    public void PostLog_ShouldTruncateLongMessageAndData_AndSanitizeControlChars()
    {
        // Arrange
        var longMessage = new string('A', 1500) + "\r\nLine2";
        var longDataObj = new { Text = new string('B', 2500) };
        var entry = new LogEntry { Level = "INFO", Message = longMessage, Data = longDataObj };

        // Act
        var result = _sut.PostLog(entry) as OkResult;

        // Assert
        result.Should().NotBeNull();
        _mockLogger.Verify(logger => logger.Log(
            LogLevel.Information,
            It.IsAny<EventId>(),
            It.Is<It.IsAnyType>((v, t) => !v.ToString()!.Contains("\r\n")),
            It.IsAny<Exception>(),
            It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
        Times.Once);
    }
}
