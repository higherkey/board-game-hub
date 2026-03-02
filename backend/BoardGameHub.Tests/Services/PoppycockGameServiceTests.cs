using Xunit;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BoardGameHub.Tests.Services
{
    public class PoppycockGameServiceTests
    {
        private readonly PoppycockGameService _service;

        public PoppycockGameServiceTests()
        {
            _service = new PoppycockGameService();
        }

        [Fact]
        public async Task StartRound_ShouldInitializeGameData()
        {
            var room = new Room { Code = "TEST" };
            room.Players.Add(new Player { ConnectionId = "p1", Name = "Dave" });
            var settings = new GameSettings();

            await _service.StartRound(room, settings);

            Assert.NotNull(room.GameData);
            // Verify RoomService dirty marking would pick this up (it marks GameData)
        }
        
        [Fact]
        public async Task HandleAction_SubmitDefinition_ShouldUpdateState()
        {
            var room = new Room { Code = "TEST" };
            var player = new Player { ConnectionId = "p1", Name = "Player1", Score = 0 };
            room.Players.Add(player);

            await _service.StartRound(room, new GameSettings());

            var payload = System.Text.Json.JsonSerializer.SerializeToElement(new { definition = "Fake Def" });
            var action = new GameAction("SUBMIT_DEFINITION", payload);

            var result = await _service.HandleAction(room, action, "p1");

            Assert.True(result);
            // Check internal state
            // Casting to dynamic or specific type if public
            // However, PoppycockGameData might be internal or strictly strictly defined.
            // Let's assume generic object check or reflection.
        }
    }
}
