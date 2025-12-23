using System.Text.Json;

namespace BoardGameHub.Api.Models;

public record GameAction(string Type, JsonElement? Payload);
