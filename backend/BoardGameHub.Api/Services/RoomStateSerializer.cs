using BoardGameHub.Api.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BoardGameHub.Api.Services;

public class RoomStateSerializer : IRoomStateSerializer
{
    private readonly List<IGameService> _gameServices;

    public static readonly JsonSerializerOptions GameOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        IncludeFields = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Converters = { new JsonStringEnumConverter() }
    };

    private static readonly JsonSerializerOptions DefaultOptions = GameOptions;

    public RoomStateSerializer(IEnumerable<IGameService>? gameServices = null)
    {
        _gameServices = gameServices?.ToList() ?? new List<IGameService>();
    }

    public string Serialize(Room room)
    {
        if (room == null) throw new ArgumentNullException(nameof(room));

        JsonElement? rawGameData = null;
        if (room.GameData != null)
        {
            if (room.GameData is JsonElement element)
            {
                rawGameData = element.Clone();
            }
            else
            {
                rawGameData = JsonSerializer.SerializeToElement(room.GameData, room.GameData.GetType(), DefaultOptions);
            }
        }

        var envelope = new RoomStateEnvelope
        {
            SchemaVersion = 1,
            Code = room.Code,
            Revision = room.Revision,
            CreatedAt = room.CreatedAt,
            UpdatedAt = room.UpdatedAt,
            ExpiresAt = room.ExpiresAt,
            GameType = room.GameType,
            State = room.State,
            Settings = room.Settings ?? new GameSettings(),
            IsPublic = room.IsPublic,
            HostScreenId = room.HostScreenId,
            HostPlayerId = room.HostPlayerId,
            CreatorConnectionId = room.CreatorConnectionId,
            IsHostOverride = room.IsHostOverride,
            RoundNumber = room.RoundNumber,
            NextGameVotes = room.NextGameVotes != null ? new Dictionary<string, GameType>(room.NextGameVotes) : new(),
            RoundEndTime = room.RoundEndTime,
            IsPaused = room.IsPaused,
            TimeRemainingWhenPaused = room.TimeRemainingWhenPaused,
            PlayerAnswers = room.PlayerAnswers != null ? new Dictionary<string, List<string>>(room.PlayerAnswers) : new(),
            RoundScores = room.RoundScores != null ? new Dictionary<string, int>(room.RoundScores) : new(),
            Players = room.Players?.Select(p => new PersistedPlayer
            {
                ConnectionId = p.ConnectionId,
                SessionId = p.SessionId,
                Name = p.Name,
                Score = p.Score,
                IsHost = p.IsHost,
                IsConnected = p.IsConnected,
                IsReady = p.IsReady,
                IsScreen = p.IsScreen,
                UserId = p.UserId,
                AvatarUrl = p.AvatarUrl
            }).ToList() ?? new(),
            UndoSettings = room.UndoSettings != null ? new UndoSettings
            {
                AllowVoting = room.UndoSettings.AllowVoting,
                HostOnly = room.UndoSettings.HostOnly
            } : new(),
            CurrentVote = room.CurrentVote != null ? new UndoVote
            {
                InitiatorId = room.CurrentVote.InitiatorId,
                InitiatorName = room.CurrentVote.InitiatorName,
                CreatedAt = room.CurrentVote.CreatedAt,
                Votes = new Dictionary<string, bool>(room.CurrentVote.Votes)
            } : null,
            RawGameData = rawGameData
        };

        return JsonSerializer.Serialize(envelope, DefaultOptions);
    }

    public Room Deserialize(string json) => Deserialize(json, _gameServices);

    public Room Deserialize(string json, IEnumerable<IGameService> gameServices)
    {
        if (string.IsNullOrWhiteSpace(json))
            throw new ArgumentException("JSON state payload cannot be null or empty.", nameof(json));

        var envelope = JsonSerializer.Deserialize<RoomStateEnvelope>(json, DefaultOptions)
            ?? throw new JsonException("Failed to deserialize RoomStateEnvelope from JSON.");

        var room = new Room
        {
            Code = envelope.Code,
            Revision = envelope.Revision,
            CreatedAt = envelope.CreatedAt,
            UpdatedAt = envelope.UpdatedAt,
            ExpiresAt = envelope.ExpiresAt,
            GameType = envelope.GameType,
            State = envelope.State,
            Settings = envelope.Settings ?? new GameSettings(),
            IsPublic = envelope.IsPublic,
            HostScreenId = envelope.HostScreenId,
            HostPlayerId = envelope.HostPlayerId,
            CreatorConnectionId = envelope.CreatorConnectionId,
            IsHostOverride = envelope.IsHostOverride,
            RoundNumber = envelope.RoundNumber,
            NextGameVotes = envelope.NextGameVotes ?? new Dictionary<string, GameType>(),
            RoundEndTime = envelope.RoundEndTime,
            IsPaused = envelope.IsPaused,
            TimeRemainingWhenPaused = envelope.TimeRemainingWhenPaused,
            PlayerAnswers = envelope.PlayerAnswers ?? new Dictionary<string, List<string>>(),
            RoundScores = envelope.RoundScores ?? new Dictionary<string, int>(),
            Players = envelope.Players?.Select(p => new Player
            {
                ConnectionId = p.ConnectionId,
                SessionId = p.SessionId,
                Name = p.Name,
                Score = p.Score,
                IsHost = p.IsHost,
                IsConnected = p.IsConnected,
                IsReady = p.IsReady,
                IsScreen = p.IsScreen,
                UserId = p.UserId,
                AvatarUrl = p.AvatarUrl
            }).ToList() ?? new List<Player>(),
            UndoSettings = envelope.UndoSettings ?? new UndoSettings(),
            CurrentVote = envelope.CurrentVote
        };

        if (envelope.RawGameData.HasValue && envelope.RawGameData.Value.ValueKind != JsonValueKind.Null && envelope.RawGameData.Value.ValueKind != JsonValueKind.Undefined)
        {
            var services = (gameServices ?? _gameServices);
            var service = services.FirstOrDefault(s => s.GameType == envelope.GameType);
            if (service != null)
            {
                room.GameData = service.DeserializeState(envelope.RawGameData.Value);
            }
            else
            {
                room.GameData = envelope.RawGameData.Value.Clone();
            }
        }

        return room;
    }
}
