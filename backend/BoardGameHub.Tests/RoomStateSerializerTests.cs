using BoardGameHub.Api.Hubs;
using BoardGameHub.Api.Models;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Services.Games;
using BoardGameHub.Api.Services.Games.GreatMinds;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;
using System.Text.Json;
using Xunit;

namespace BoardGameHub.Tests;

public class RoomStateSerializerTests
{
    private readonly RoomStateSerializer _serializer;
    private readonly List<IGameService> _gameServices;

    public RoomStateSerializerTests()
    {
        var farkleLogger = new Mock<ILogger<FarkleService>>();
        var serviceProvider = new Mock<IServiceProvider>();
        var scatLogger = new Mock<ILogger<ScatterbrainGameService>>();
        var clovLogger = new Mock<ILogger<CloverMindedGameService>>();
        var babbleMock = new Mock<IBabbleService>();
        var dictMock = new Mock<IDictionaryService>();
        var babbleLogger = new Mock<ILogger<BabbleGameService>>();
        var sushiLogger = new Mock<ILogger<SushiTrainGameService>>();
        var wiseLogger = new Mock<ILogger<WisecrackGameService>>();
        var deepLogger = new Mock<ILogger<DeepfakeGameService>>();
        var symbLogger = new Mock<ILogger<SymbologyGameService>>();
        var pictoLogger = new Mock<ILogger<PictophoneService>>();
        var transLogger = new Mock<ILogger<UniversalTranslatorService>>();
        var mindHub = new Mock<IHubContext<GameHub>>();
        var mindLogger = new Mock<ILogger<GreatMindsGameService>>();
        var oneLogger = new Mock<ILogger<OneAndOnlyService>>();
        var newsLogger = new Mock<ILogger<BreakingNewsGameService>>();

        _gameServices = new List<IGameService>
        {
            new FarkleService(farkleLogger.Object, serviceProvider.Object),
            new ScatterbrainGameService(scatLogger.Object),
            new CloverMindedGameService(clovLogger.Object),
            new BabbleGameService(babbleMock.Object, dictMock.Object, babbleLogger.Object),
            new SushiTrainGameService(sushiLogger.Object),
            new WisecrackGameService(wiseLogger.Object),
            new FourInARowGameService(),
            new NomDeCodeService(),
            new WarshipsGameService(),
            new DeepfakeGameService(deepLogger.Object),
            new GreatMindsGameService(mindHub.Object, mindLogger.Object),
            new OneAndOnlyService(oneLogger.Object),
            new BreakingNewsGameService(newsLogger.Object),
            new UniversalTranslatorService(transLogger.Object),
            new SymbologyGameService(symbLogger.Object),
            new PictophoneService(pictoLogger.Object),
            new PoppycockGameService()
        };

        _serializer = new RoomStateSerializer(_gameServices);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesRoomAndFarkleState()
    {
        var room = new Room
        {
            Code = "TEST",
            GameType = GameType.Farkle,
            State = GameState.Playing,
            RoundNumber = 2,
            HostPlayerId = "conn-host",
            Players = new List<Player>
            {
                new() { ConnectionId = "conn-host", Name = "Player 1", Score = 150, IsHost = true },
                new() { ConnectionId = "conn-2", Name = "Player 2", Score = 200 }
            },
            GameData = new FarkleState
            {
                CurrentTurnScore = 350,
                ActivePlayerId = "conn-host",
                PlayerStates = new Dictionary<string, FarklePlayerState>
                {
                    ["conn-host"] = new() { PlayerId = "conn-host", PlayerName = "Player 1", TotalScore = 150 },
                    ["conn-2"] = new() { PlayerId = "conn-2", PlayerName = "Player 2", TotalScore = 200 }
                },
                Dice = new List<FarkleDie>
                {
                    new() { Value = 1, IsHeld = true, IsScoring = true },
                    new() { Value = 5, IsHeld = false, IsScoring = false }
                }
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal("TEST", restoredRoom.Code);
        Assert.Equal(GameType.Farkle, restoredRoom.GameType);
        Assert.Equal(GameState.Playing, restoredRoom.State);
        Assert.Equal(2, restoredRoom.RoundNumber);
        Assert.Equal(2, restoredRoom.Players.Count);
        Assert.Equal("conn-host", restoredRoom.HostPlayerId);

        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<FarkleState>(restoredRoom.GameData);
        var restoredFarkle = (FarkleState)restoredRoom.GameData;
        Assert.Equal(350, restoredFarkle.CurrentTurnScore);
        Assert.Equal("conn-host", restoredFarkle.ActivePlayerId);
        Assert.Equal(2, restoredFarkle.PlayerStates.Count);
        Assert.Equal(2, restoredFarkle.Dice.Count);
        Assert.True(restoredFarkle.Dice[0].IsHeld);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesScatterbrainState()
    {
        var room = new Room
        {
            Code = "SCAT",
            GameType = GameType.Scatterbrain,
            State = GameState.Playing,
            RoundNumber = 1,
            GameData = new ScatterbrainState
            {
                CurrentLetter = 'M',
                Categories = new List<string> { "Fruit", "Animal" },
                Phase = ScatterbrainPhase.Writing
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.Scatterbrain, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<ScatterbrainState>(restoredRoom.GameData);
        var state = (ScatterbrainState)restoredRoom.GameData;
        Assert.Equal('M', state.CurrentLetter);
        Assert.Equal(2, state.Categories.Count);
        Assert.Equal(ScatterbrainPhase.Writing, state.Phase);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesCloverMindedState()
    {
        var room = new Room
        {
            Code = "CLOV",
            GameType = GameType.CloverMinded,
            State = GameState.Playing,
            RoundNumber = 1,
            GameData = new CloverMindedState
            {
                Phase = "ClueWriting",
                TotalScore = 12
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.CloverMinded, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<CloverMindedState>(restoredRoom.GameData);
        var state = (CloverMindedState)restoredRoom.GameData;
        Assert.Equal("ClueWriting", state.Phase);
        Assert.Equal(12, state.TotalScore);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesBabbleState()
    {
        var room = new Room
        {
            Code = "BABL",
            GameType = GameType.Babble,
            State = GameState.Playing,
            RoundNumber = 1,
            GameData = new BabbleState
            {
                IsPlaying = true,
                BoardSize = 4,
                TimeLeft = 120,
                Grid = new List<char> { 'A', 'B', 'C', 'D' }
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.Babble, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<BabbleState>(restoredRoom.GameData);
        var state = (BabbleState)restoredRoom.GameData;
        Assert.True(state.IsPlaying);
        Assert.Equal(4, state.BoardSize);
        Assert.Equal(4, state.Grid.Count);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesSushiTrainState()
    {
        var room = new Room
        {
            Code = "SUSH",
            GameType = GameType.SushiTrain,
            State = GameState.Playing,
            RoundNumber = 1,
            GameData = new SushiTrainState
            {
                Round = 1,
                PlayerStates = new Dictionary<string, SushiPlayerState>
                {
                    ["conn-1"] = new() { PlayerId = "conn-1", PlayerName = "Sushi Master", TotalScore = 15 }
                }
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.SushiTrain, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<SushiTrainState>(restoredRoom.GameData);
        var state = (SushiTrainState)restoredRoom.GameData;
        Assert.Equal(1, state.Round);
        Assert.Single(state.PlayerStates);
        Assert.Equal(15, state.PlayerStates["conn-1"].TotalScore);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesWisecrackState()
    {
        var room = new Room
        {
            Code = "WISE",
            GameType = GameType.Wisecrack,
            State = GameState.Playing,
            RoundNumber = 2,
            GameData = new WisecrackState
            {
                Phase = WisecrackPhase.Battling,
                RoundNumber = 2
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.Wisecrack, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<WisecrackState>(restoredRoom.GameData);
        var state = (WisecrackState)restoredRoom.GameData;
        Assert.Equal(WisecrackPhase.Battling, state.Phase);
        Assert.Equal(2, state.RoundNumber);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesFourInARowState()
    {
        var room = new Room
        {
            Code = "FOUR",
            GameType = GameType.FourInARow,
            State = GameState.Playing,
            GameData = new FourInARowState
            {
                Phase = FourInARowPhase.Playing,
                CurrentPlayerId = "p1"
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.FourInARow, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<FourInARowState>(restoredRoom.GameData);
        var state = (FourInARowState)restoredRoom.GameData;
        Assert.Equal("p1", state.CurrentPlayerId);
        Assert.Equal(FourInARowPhase.Playing, state.Phase);
        Assert.Equal(7, state.Grid.Length);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesWarshipsState()
    {
        var room = new Room
        {
            Code = "WARS",
            GameType = GameType.Warships,
            State = GameState.Playing,
            GameData = new WarshipsState
            {
                Phase = WarshipsPhase.Battle,
                ActivePlayerId = "p1",
                PlayerBoards = new Dictionary<string, WarshipsBoard>
                {
                    ["p1"] = new()
                    {
                        Ships = new List<Warship>
                        {
                            new() { Type = "Carrier", Size = 5, Coordinates = new List<WarshipCoordinate> { new(0, 0), new(0, 1) } }
                        }
                    }
                }
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.Warships, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<WarshipsState>(restoredRoom.GameData);
        var state = (WarshipsState)restoredRoom.GameData;
        Assert.Equal(WarshipsPhase.Battle, state.Phase);
        Assert.Equal("Carrier", state.PlayerBoards["p1"].Ships[0].Type);
        Assert.Equal(0, state.PlayerBoards["p1"].Ships[0].Coordinates[0].Row);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesDeepfakeState()
    {
        var room = new Room
        {
            Code = "DEEP",
            GameType = GameType.Deepfake,
            State = GameState.Playing,
            GameData = new DeepfakeState
            {
                Phase = DeepfakePhase.Voting,
                Prompt = "Test prompt",
                TotalRounds = 2
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.Deepfake, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<DeepfakeState>(restoredRoom.GameData);
        var state = (DeepfakeState)restoredRoom.GameData;
        Assert.Equal(DeepfakePhase.Voting, state.Phase);
        Assert.Equal("Test prompt", state.Prompt);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesGreatMindsState()
    {
        var room = new Room
        {
            Code = "MIND",
            GameType = GameType.GreatMinds,
            State = GameState.Playing,
            GameData = new GreatMindsGameState
            {
                CurrentLevel = 3,
                Lives = 2,
                SyncTokens = 1
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.GreatMinds, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<GreatMindsGameState>(restoredRoom.GameData);
        var state = (GreatMindsGameState)restoredRoom.GameData;
        Assert.Equal(3, state.CurrentLevel);
        Assert.Equal(2, state.Lives);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesNomDeCodeState()
    {
        var room = new Room
        {
            Code = "NOMD",
            GameType = GameType.NomDeCode,
            State = GameState.Playing,
            GameData = new NomDeCodeState
            {
                Phase = NomDeCodePhase.ClueGiving,
                CurrentTeam = "Red"
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.NomDeCode, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<NomDeCodeState>(restoredRoom.GameData);
        var state = (NomDeCodeState)restoredRoom.GameData;
        Assert.Equal("Red", state.CurrentTeam);
    }

    [Fact]
    public void SerializeAndDeserialize_PreservesUndoAndVotingSettings()
    {
        var room = new Room
        {
            Code = "UNDO",
            UndoSettings = new UndoSettings { AllowVoting = false, HostOnly = true },
            CurrentVote = new UndoVote
            {
                InitiatorId = "host-1",
                InitiatorName = "Host",
                Votes = new Dictionary<string, bool> { ["p1"] = true, ["p2"] = false }
            }
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.False(restoredRoom.UndoSettings.AllowVoting);
        Assert.True(restoredRoom.UndoSettings.HostOnly);
        Assert.NotNull(restoredRoom.CurrentVote);
        Assert.Equal("host-1", restoredRoom.CurrentVote.InitiatorId);
        Assert.Equal(2, restoredRoom.CurrentVote.Votes.Count);
    }

    [Fact]
    public void SerializeAndDeserialize_HandlesCorruptedGameDataGracefully()
    {
        var envelope = new RoomStateEnvelope
        {
            Code = "CORR",
            GameType = GameType.Scatterbrain,
            State = GameState.Playing,
            RawGameData = JsonSerializer.SerializeToElement(new { CurrentLetter = "NOT_A_CHAR_TOO_LONG", Categories = 12345 })
        };

        var json = JsonSerializer.Serialize(envelope);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal(GameType.Scatterbrain, restoredRoom.GameType);
        Assert.NotNull(restoredRoom.GameData);
        Assert.IsType<ScatterbrainState>(restoredRoom.GameData);
    }

    [Fact]
    public void SerializeAndDeserialize_HandlesEmptyGameData()
    {
        var room = new Room
        {
            Code = "LOBBY",
            GameType = GameType.None,
            State = GameState.Lobby,
            GameData = null
        };

        var json = _serializer.Serialize(room);
        var restoredRoom = _serializer.Deserialize(json);

        Assert.NotNull(restoredRoom);
        Assert.Equal("LOBBY", restoredRoom.Code);
        Assert.Null(restoredRoom.GameData);
    }
}
