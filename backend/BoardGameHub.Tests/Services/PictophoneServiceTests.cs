using Xunit;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BoardGameHub.Tests.Services
{
    public class PictophoneServiceTests
    {
        private readonly PictophoneService _service;

        public PictophoneServiceTests()
        {
            _service = new PictophoneService(Microsoft.Extensions.Logging.Abstractions.NullLogger<PictophoneService>.Instance);
        }

        [Fact]
        public async Task StartRound_ShouldInitializeBooks()
        {
            var room = new Room { Code = "TEST" };
            var p1 = new Player { ConnectionId = "c1", Name = "Bob" };
            room.Players.Add(p1);
            
            await _service.StartRound(room, new GameSettings());

            Assert.NotNull(room.GameData);
        }
    }
}
