using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;

const string prefix = "// Generated from AppDbContext game seeds. Run npm run catalogue:generate to update.\nexport const BUNDLED_GAME_CATALOGUE = ";
const string suffix = ";\n";
var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
};

try
{
    if (args.Length != 2 || (args[0] != "--output" && args[0] != "--check"))
        throw new ArgumentException("Usage: BoardGameHub.CatalogueExport (--output | --check) <path>");

    // Read design-time metadata only: no host, database operations, or API startup.
    using var context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase("catalogue-export").Options);
    var entity = context.GetService<IDesignTimeModel>().Model.FindEntityType(typeof(GameDefinition))
        ?? throw new InvalidOperationException("GameDefinition is missing from the EF model.");
    var games = entity.GetSeedData(providerValues: false).Select(ReadGame)
        .OrderBy(game => game.Id, StringComparer.Ordinal).ToArray();
    if (games.Length == 0 || games.Select(game => game.Id).Distinct(StringComparer.OrdinalIgnoreCase).Count() != games.Length)
        throw new InvalidOperationException("Game seeds must be nonempty and have unique IDs.");

    var canonicalContent = JsonSerializer.Serialize(games, jsonOptions);
    var version = Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalContent)));
    var catalogue = new { schemaVersion = 1, version, generatedAt = DateTimeOffset.UtcNow.ToString("O"), games };
    var expected = JsonSerializer.SerializeToNode(catalogue, jsonOptions)!.AsObject();
    var output = Path.GetFullPath(args[1]);
    if (args[0] == "--check")
    {
        var source = File.ReadAllText(output).Replace("\r\n", "\n");
        if (!source.StartsWith(prefix, StringComparison.Ordinal) || !source.EndsWith(suffix, StringComparison.Ordinal))
            throw new InvalidDataException("Catalogue module has an invalid format. Regenerate it.");
        var actual = JsonNode.Parse(source[prefix.Length..^suffix.Length])?.AsObject()
            ?? throw new InvalidDataException("Catalogue data is missing.");
        var generatedAt = actual["generatedAt"]?.GetValue<string>();
        if (!DateTimeOffset.TryParseExact(generatedAt, "O", CultureInfo.InvariantCulture, DateTimeStyles.None, out var timestamp)
            || timestamp.Offset != TimeSpan.Zero)
            throw new InvalidDataException("Catalogue generatedAt must be a valid UTC ISO timestamp.");
        expected["generatedAt"] = generatedAt;
        if (!JsonNode.DeepEquals(actual, expected))
            throw new InvalidDataException("Catalogue is stale or invalid. Run npm run catalogue:generate.");
        Console.WriteLine($"Catalogue verified: {games.Length} games, {version}.");
    }
    else
    {
        Directory.CreateDirectory(Path.GetDirectoryName(output)!);
        var formatted = JsonSerializer.Serialize(catalogue, new JsonSerializerOptions(jsonOptions) { WriteIndented = true });
        File.WriteAllText(output, prefix + formatted + suffix, new UTF8Encoding(false));
        Console.WriteLine($"Catalogue generated: {games.Length} games, {version}.");
    }
    return 0;
}
catch (Exception exception)
{
    Console.Error.WriteLine($"Catalogue export failed: {exception.Message}");
    return 1;
}

static PublicGame ReadGame(IDictionary<string, object?> seed)
{
    string Required(string name) => seed.TryGetValue(name, out var value) && value is string text && !string.IsNullOrWhiteSpace(text)
        ? text : throw new InvalidDataException($"Game seed requires {name}.");
    int Number(string name) => seed.TryGetValue(name, out var value) && value is int number
        ? number : throw new InvalidDataException($"Game seed requires integer {name}.");
    string EnumName<T>(string name) where T : struct, Enum
    {
        if (!seed.TryGetValue(name, out var value) || value is null)
            throw new InvalidDataException($"Game seed requires {name}.");
        var normalized = value is T typed ? typed : (T)Enum.ToObject(typeof(T), value);
        return Enum.IsDefined(normalized) ? normalized.ToString()
            : throw new InvalidDataException($"Game seed has invalid {name}.");
    }
    var game = new PublicGame(Required("Id"), Required("Name"), Required("Icon"), Required("Description"),
        EnumName<GameStatus>("Status"), Number("MinPlayers"), Number("MaxPlayers"), Number("Complexity"),
        Number("AveragePlayTime"), Required("Tags"), EnumName<TimerType>("TimerType"), Number("DefaultRoundLengthSeconds"),
        seed.TryGetValue("SettingsMetadataJson", out var metadata) ? metadata as string : null);
    if (game.MinPlayers < 1 || game.MaxPlayers < game.MinPlayers || game.Complexity is < 1 or > 5
        || game.AveragePlayTime <= 0 || game.DefaultRoundLengthSeconds < 0
        || (game.TimerType == nameof(TimerType.Required) && game.DefaultRoundLengthSeconds == 0))
        throw new InvalidDataException($"Game seed {game.Id} has invalid player, complexity, or timer metadata.");
    if (game.SettingsMetadataJson is not null)
    {
        using var settings = JsonDocument.Parse(game.SettingsMetadataJson);
        if (settings.RootElement.ValueKind != JsonValueKind.Array)
            throw new InvalidDataException($"Game seed {game.Id} settings must be a JSON array.");
    }
    return game;
}

// Explicit public metadata allowlist. Internal CodeKey is deliberately excluded.
internal sealed record PublicGame(string Id, string Name, string Icon, string Description, string Status,
    int MinPlayers, int MaxPlayers, int Complexity, int AveragePlayTime, string Tags, string TimerType,
    int DefaultRoundLengthSeconds, string? SettingsMetadataJson);
