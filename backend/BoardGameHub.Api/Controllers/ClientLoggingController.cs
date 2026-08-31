using Microsoft.AspNetCore.Mvc;
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
public class ClientLoggingController : ControllerBase
{
    private readonly ILogger<ClientLoggingController> _logger;

    public ClientLoggingController(ILogger<ClientLoggingController> logger)
    {
        _logger = logger;
    }

    [HttpPost]
    public IActionResult PostLog([FromBody] LogEntry entry)
    {
        var sanitizedMessage = (entry.Message ?? string.Empty).Replace("\r", string.Empty).Replace("\n", " ");

        switch (entry.Level?.ToUpperInvariant())
        {
            case "DEBUG":
                _logger.LogDebug("{ClientMessage} | Data: {@Data}", sanitizedMessage, entry.Data);
                break;
            case "INFO":
            case "INFORMATION":
                _logger.LogInformation("{ClientMessage} | Data: {@Data}", sanitizedMessage, entry.Data);
                break;
            case "WARN":
            case "WARNING":
                _logger.LogWarning("{ClientMessage} | Data: {@Data}", sanitizedMessage, entry.Data);
                break;
            case "ERROR":
                _logger.LogError("{ClientMessage} | Data: {@Data}", sanitizedMessage, entry.Data);
                break;
            default:
                _logger.LogInformation("{ClientMessage} | Data: {@Data}", sanitizedMessage, entry.Data);
                break;
        }

        return Ok();
    }
}
