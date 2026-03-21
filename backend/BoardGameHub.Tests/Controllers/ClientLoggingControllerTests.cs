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
}
