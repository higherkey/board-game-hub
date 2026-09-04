using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests;

public class PlayerSessionRebindTests
{
    private readonly RoomService _roomService;
    private readonly Mock<ILogger<FarkleService>> _farkleLogger = new();
    private readonly Mock<IServiceProvider> _serviceProvider = new();
    private readonly Mock<IHubContext<AdminHub>> _adminHubContext = new();
    private readonly Mock<IHubContext<GameHub>> _gameHubContext = new();
    private readonly Mock<ILogger<RoomService>> _roomLogger = new();
    private readonly GameStateManager _gameStateManager;

    public PlayerSessionRebindTests()
    {
        var farkleService = new FarkleService(_farkleLogger.Object, _serviceProvider.Object);
        var gameServices = new List<IGameService>
        {
            farkleService,
            new FourInARowGameService(),
            new WarshipsGameService(),
            new SushiTrainGameService(new Mock<ILogger<SushiTrainGameService>>().Object),
            new SymbologyGameService(new Mock<ILogger<SymbologyGameService>>().Object),
            new DeepfakeGameService(new Mock<ILogger<DeepfakeGameService>>().Object),
            new PoppycockGameService(),
            new UniversalTranslatorService(new Mock<ILogger<UniversalTranslatorService>>().Object),
            new WisecrackGameService(new Mock<ILogger<WisecrackGameService>>().Object),
            new CloverMindedGameService(new Mock<ILogger<CloverMindedGameService>>().Object),
            new PictophoneService(new Mock<ILogger<PictophoneService>>().Object),
            new OneAndOnlyService(new Mock<ILogger<OneAndOnlyService>>().Object),
            new ScatterbrainGameService(new Mock<ILogger<ScatterbrainGameService>>().Object),
            new BreakingNewsGameService(new Mock<ILogger<BreakingNewsGameService>>().Object),
            new BabbleGameService(new Mock<IBabbleService>().Object, new Mock<IDictionaryService>().Object, new Mock<ILogger<BabbleGameService>>().Object)
        };

        var diffService = new StateDiffService();
        var gsmLogger = new Mock<ILogger<GameStateManager>>();
        _gameStateManager = new GameStateManager(_gameHubContext.Object, diffService, gsmLogger.Object);

        var adminClients = new Mock<IHubClients>();
        var adminClientProxy = new Mock<IClientProxy>();
        adminClients.Setup(c => c.All).Returns(adminClientProxy.Object);
        _adminHubContext.Setup(a => a.Clients).Returns(adminClients.Object);

        var gameClients = new Mock<IHubClients>();
        var gameClientProxy = new Mock<IClientProxy>();
        gameClients.Setup(c => c.Group(It.IsAny<string>())).Returns(gameClientProxy.Object);
        gameClients.Setup(c => c.All).Returns(gameClientProxy.Object);
        _gameHubContext.Setup(g => g.Clients).Returns(gameClients.Object);

        _roomService = new RoomService(
            gameServices,
            _adminHubContext.Object,
            _gameHubContext.Object,
            _gameStateManager,
            _roomLogger.Object);
    }

    [Fact]
    public void ReconnectWithSessionId_RebindsConnectionIdAndPreservesPlayerProperties()
    {
        // Arrange - Host creates room
        var room = _roomService.CreateRoom("conn-old", "Player 1", false, GameType.Farkle);
        var player = room.Players.First();
        var sessionId = player.SessionId;
        Assert.Equal("conn-old", player.ConnectionId);
        Assert.Equal("conn-old", room.HostPlayerId);

        // Act - Player reconnects with new socket ID using SessionId
        var rejoinedRoom = _roomService.JoinRoom(room.Code, "conn-new", "Player 1 Updated", null, null, false, sessionId);

        // Assert
        Assert.NotNull(rejoinedRoom);
        var updatedPlayer = rejoinedRoom.Players.First();
        Assert.Equal("conn-new", updatedPlayer.ConnectionId);
        // SessionId is rotated on reconnect to limit exposure window of prior token
        Assert.NotEqual(sessionId, updatedPlayer.SessionId);
        Assert.False(string.IsNullOrWhiteSpace(updatedPlayer.SessionId));
        Assert.Equal("Player 1 Updated", updatedPlayer.Name);
        Assert.Equal("conn-new", rejoinedRoom.HostPlayerId);
        Assert.Equal("conn-new", rejoinedRoom.CreatorConnectionId);
    }

    [Fact]
    public void SequentialRapidReconnects_MigratesConnectionChainsCleanly()
    {
        // Arrange
        var room = _roomService.CreateRoom("conn-A", "Player 1", false, GameType.Farkle);
        var sessionId = room.Players.First().SessionId;

        // Act 1: Reconnect to B — token is rotated
        var roomB = _roomService.JoinRoom(room.Code, "conn-B", "Player 1", null, null, false, sessionId);
        Assert.NotNull(roomB);
        Assert.Equal("conn-B", roomB.Players.First().ConnectionId);

        // Use the rotated token for the next reconnect
        var rotatedSessionId = roomB.Players.First().SessionId;
        Assert.NotEqual(sessionId, rotatedSessionId);

        // Act 2: Rapid Reconnect to C using the rotated token
        var roomC = _roomService.JoinRoom(room.Code, "conn-C", "Player 1", null, null, false, rotatedSessionId);
        Assert.NotNull(roomC);
        Assert.Equal("conn-C", roomC.Players.First().ConnectionId);
        Assert.Single(roomC.Players);
    }

    [Fact]
    public void ReconnectWithInvalidSessionId_CreatesNewPlayer()
    {
        // Arrange
        var room = _roomService.CreateRoom("conn-1", "Host", false, GameType.Farkle);

        // Act - Join with unrecognized session ID
        var rejoinedRoom = _roomService.JoinRoom(room.Code, "conn-2", "New Player", null, null, false, "non-existent-session");

        // Assert
        Assert.NotNull(rejoinedRoom);
        Assert.Equal(2, rejoinedRoom.Players.Count);
        Assert.Contains(rejoinedRoom.Players, p => p.ConnectionId == "conn-2" && p.Name == "New Player");
    }

    [Fact]
    public void RebindPlayerConnection_MigratesRoomScoresVotesAndAnswers()
    {
        // Arrange
        var room = _roomService.CreateRoom("conn-1", "Host", false, GameType.Farkle);
        room.RoundScores["conn-1"] = 150;
        room.PlayerAnswers["conn-1"] = new List<string> { "Answer1", "Answer2" };
        room.NextGameVotes["conn-1"] = GameType.SushiTrain;

        // Act
        _roomService.RebindPlayerConnection(room, "conn-1", "conn-reconnected");

        // Assert
        Assert.False(room.RoundScores.ContainsKey("conn-1"));
        Assert.Equal(150, room.RoundScores["conn-reconnected"]);

        Assert.False(room.PlayerAnswers.ContainsKey("conn-1"));
        Assert.Equal(2, room.PlayerAnswers["conn-reconnected"].Count);

        Assert.False(room.NextGameVotes.ContainsKey("conn-1"));
        Assert.Equal(GameType.SushiTrain, room.NextGameVotes["conn-reconnected"]);
    }

    [Fact]
    public void RebindPlayerConnection_HandlesJsonElementLazyDeserialization()
    {
        // Arrange - Room where GameData is raw JsonElement (e.g. hydrated from DB)
        var room = _roomService.CreateRoom("conn-farkle-old", "Farkle Master", false, GameType.Farkle);
        var initialFarkle = new FarkleState
        {
            ActivePlayerId = "conn-farkle-old",
            PlayerStates = new Dictionary<string, FarklePlayerState>
            {
                ["conn-farkle-old"] = new() { PlayerId = "conn-farkle-old", PlayerName = "Farkle Master", TotalScore = 750 }
            }
        };

        var json = JsonSerializer.SerializeToElement(initialFarkle, RoomStateSerializer.GameOptions);
        room.GameData = json;

        // Act
        _roomService.RebindPlayerConnection(room, "conn-farkle-old", "conn-farkle-new");

        // Assert
        Assert.IsType<FarkleState>(room.GameData);
        var state = (FarkleState)room.GameData;
        Assert.Equal("conn-farkle-new", state.ActivePlayerId);
        Assert.True(state.PlayerStates.ContainsKey("conn-farkle-new"));
        Assert.Equal(750, state.PlayerStates["conn-farkle-new"].TotalScore);
    }

    [Fact]
    public void RebindPlayerConnection_MigratesDeepfakeBidirectionalVotesAndStrokes()
    {
        // Arrange
        var room = _roomService.CreateRoom("conn-artist-old", "Artist", false, GameType.Deepfake);
        var state = new DeepfakeState
        {
            AiConnectionId = "conn-artist-old",
            PlayerOrder = new List<string> { "conn-voter1", "conn-voter2", "conn-artist-old" },
            Votes = new Dictionary<string, string>
            {
                ["conn-voter1"] = "conn-artist-old", // Voter 1 accused old connection
                ["conn-voter2"] = "conn-artist-old", // Voter 2 also accused old connection
                ["conn-artist-old"] = "conn-voter1"  // Reconnecting player voted for voter 1
            },
            Strokes = new List<DeepfakeStroke>
            {
                new() { OwnerId = "conn-artist-old", Color = "#ff0000" }
            }
        };
        room.GameData = state;

        // Act
        _roomService.RebindPlayerConnection(room, "conn-artist-old", "conn-artist-new");

        // Assert
        Assert.Equal("conn-artist-new", state.AiConnectionId);
        Assert.Equal("conn-artist-new", state.PlayerOrder[2]);
        Assert.Equal("conn-artist-new", state.Votes["conn-voter1"]); // Voter 1's accusation was remapped!
        Assert.Equal("conn-artist-new", state.Votes["conn-voter2"]); // Voter 2's accusation was remapped!
        Assert.Equal("conn-voter1", state.Votes["conn-artist-new"]);  // Reconnected player's vote key was remapped!
        Assert.False(state.Votes.ContainsKey("conn-artist-old"));
        Assert.Equal("conn-artist-new", state.Strokes[0].OwnerId);
    }

    [Fact]
    public void RebindPlayerConnection_MigratesUniversalTranslatorMultipleVotes()
    {
        // Arrange
        var room = _roomService.CreateRoom("conn-alien-old", "Alien", false, GameType.UniversalTranslator);
        var state = new UniversalTranslatorState
        {
            Roles = new Dictionary<string, UniversalTranslatorRole>
            {
                ["conn-alien-old"] = UniversalTranslatorRole.J,
                ["conn-human"] = UniversalTranslatorRole.Crew
            },
            Votes = new Dictionary<string, string>
            {
                ["conn-human"] = "conn-alien-old",
                ["conn-alien-old"] = "conn-human"
            }
        };
        room.GameData = state;

        // Act
        _roomService.RebindPlayerConnection(room, "conn-alien-old", "conn-alien-new");

        // Assert
        Assert.False(state.Roles.ContainsKey("conn-alien-old"));
        Assert.Equal(UniversalTranslatorRole.J, state.Roles["conn-alien-new"]);
        Assert.Equal("conn-alien-new", state.Votes["conn-human"]);
        Assert.Equal("conn-human", state.Votes["conn-alien-new"]);
    }

    [Fact]
    public void RebindPlayerConnection_MigratesPoppycockBluffVotesAndSubmissions()
    {
        // Arrange
        var room = _roomService.CreateRoom("conn-bluffer-old", "Bluffer", false, GameType.Poppycock);
        var state = new PoppycockState
        {
            DasherId = "conn-bluffer-old",
            PlayerSubmissions = new Dictionary<string, string>
            {
                ["conn-bluffer-old"] = "A fake definition"
            },
            Votes = new Dictionary<string, string>
            {
                ["conn-other"] = "conn-bluffer-old"
            },
            CorrectSubmissions = new List<string> { "conn-bluffer-old" }
        };
        room.GameData = state;

        // Act
        _roomService.RebindPlayerConnection(room, "conn-bluffer-old", "conn-bluffer-new");

        // Assert
        Assert.Equal("conn-bluffer-new", state.DasherId);
        Assert.False(state.PlayerSubmissions.ContainsKey("conn-bluffer-old"));
        Assert.Equal("A fake definition", state.PlayerSubmissions["conn-bluffer-new"]);
        Assert.Equal("conn-bluffer-new", state.Votes["conn-other"]);
        Assert.Contains("conn-bluffer-new", state.CorrectSubmissions);
        Assert.DoesNotContain("conn-bluffer-old", state.CorrectSubmissions);
    }

    [Fact]
    public void RebindPlayerConnection_MigratesScatterbrainAndOneAndOnly()
    {
        // Arrange Scatterbrain
        var sbRoom = _roomService.CreateRoom("conn-sb-old", "Player", false, GameType.Scatterbrain);
        var sbState = new ScatterbrainState
        {
            Vetoes = new Dictionary<string, List<int>>
            {
                ["conn-sb-old"] = new List<int> { 0, 1 }
            },
            ActiveChallenge = new ChallengeState
            {
                ChallengerId = "conn-sb-old",
                TargetPlayerId = "conn-target",
                Votes = new Dictionary<string, bool> { ["conn-sb-old"] = true }
            }
        };
        sbRoom.GameData = sbState;

        // Act Scatterbrain
        _roomService.RebindPlayerConnection(sbRoom, "conn-sb-old", "conn-sb-new");

        // Assert Scatterbrain
        Assert.False(sbState.Vetoes.ContainsKey("conn-sb-old"));
        Assert.Equal(2, sbState.Vetoes["conn-sb-new"].Count);
        Assert.Equal("conn-sb-new", sbState.ActiveChallenge.ChallengerId);
        Assert.True(sbState.ActiveChallenge.Votes["conn-sb-new"]);

        // Arrange OneAndOnly
        var oaoRoom = _roomService.CreateRoom("conn-guesser-old", "Guesser", false, GameType.OneAndOnly);
        var oaoState = new OneAndOnlyState
        {
            GuesserId = "conn-guesser-old",
            Clues = new Dictionary<string, string> { ["conn-guesser-old"] = "Clue" }
        };
        oaoRoom.GameData = oaoState;

        // Act OneAndOnly
        _roomService.RebindPlayerConnection(oaoRoom, "conn-guesser-old", "conn-guesser-new");

        // Assert OneAndOnly
        Assert.Equal("conn-guesser-new", oaoState.GuesserId);
        Assert.Equal("Clue", oaoState.Clues["conn-guesser-new"]);
    }

    [Fact]
    public void RebindPlayerConnection_MigratesWarshipsAndFourInARow()
    {
        // Arrange Warships
        var warshipsRoom = _roomService.CreateRoom("conn-admiral-old", "Admiral", false, GameType.Warships);
        var warshipsState = new WarshipsState
        {
            ActivePlayerId = "conn-admiral-old",
            PlayerBoards = new Dictionary<string, WarshipsBoard>
            {
                ["conn-admiral-old"] = new()
            }
        };
        warshipsRoom.GameData = warshipsState;

        // Act Warships
        _roomService.RebindPlayerConnection(warshipsRoom, "conn-admiral-old", "conn-admiral-new");

        // Assert Warships
        Assert.Equal("conn-admiral-new", warshipsState.ActivePlayerId);
        Assert.False(warshipsState.PlayerBoards.ContainsKey("conn-admiral-old"));
        Assert.True(warshipsState.PlayerBoards.ContainsKey("conn-admiral-new"));

        // Arrange FourInARow
        var fourRoom = _roomService.CreateRoom("conn-p1-old", "P1", false, GameType.FourInARow);
        var fourState = new FourInARowState
        {
            CurrentPlayerId = "conn-p1-old",
            WinnerId = "conn-p1-old"
        };
        fourRoom.GameData = fourState;

        // Act FourInARow
        _roomService.RebindPlayerConnection(fourRoom, "conn-p1-old", "conn-p1-new");

        // Assert FourInARow
        Assert.Equal("conn-p1-new", fourState.CurrentPlayerId);
        Assert.Equal("conn-p1-new", fourState.WinnerId);
    }
}
