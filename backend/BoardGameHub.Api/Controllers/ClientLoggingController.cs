using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Serilog;

namespace BoardGameHub.Api.Controllers;

public class LogEntry
{
    public string Level { get; set; } = "Information";
    public string Message { get; set; } = string.Empty;
    public object? Data { get; set; }
}

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("ClientLoggingLimiter")]
public class ClientLoggingController : ControllerBase
{
    private const int MaxMessageLength = 1000;
    private const int MaxDataLength = 2000;
    private readonly ILogger<ClientLoggingController> _logger;

    public ClientLoggingController(ILogger<ClientLoggingController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public IActionResult PostLog([FromBody] LogEntry entry)
    {
        var rawMessage = entry?.Message ?? string.Empty;
        if (rawMessage.Length > MaxMessageLength)
        {
            rawMessage = rawMessage.Substring(0, MaxMessageLength);
        }
        var sanitizedMessage = System.Text.RegularExpressions.Regex.Replace(rawMessage, @"[\r\n\x00-\x1F\x7F]", " ");
        var serializedData = entry?.Data != null ? System.Text.Json.JsonSerializer.Serialize(entry.Data) : string.Empty;
        if (serializedData.Length > MaxDataLength)
        {
            serializedData = serializedData.Substring(0, MaxDataLength);
        }
        var sanitizedData = System.Text.RegularExpressions.Regex.Replace(serializedData, @"[\r\n\x00-\x1F\x7F]", " ");

        var logLevel = (entry?.Level ?? "Information").ToUpperInvariant();
        switch (logLevel)
        {
            case "DEBUG":
                _logger.LogDebug("Client log [DEBUG]: {Message} | Data: {Data}", sanitizedMessage, sanitizedData);
                break;
            case "INFO":
            case "INFORMATION":
                _logger.LogInformation("Client log [INFO]: {Message} | Data: {Data}", sanitizedMessage, sanitizedData);
                break;
            case "WARN":
            case "WARNING":
                _logger.LogWarning("Client log [WARN]: {Message} | Data: {Data}", sanitizedMessage, sanitizedData);
                break;
            case "ERROR":
                _logger.LogError("Client log [ERROR]: {Message} | Data: {Data}", sanitizedMessage, sanitizedData);
                break;
            default:
                _logger.LogInformation("Client log: {Message} | Data: {Data}", sanitizedMessage, sanitizedData);
                break;
        }

        return Ok();
    }
}
