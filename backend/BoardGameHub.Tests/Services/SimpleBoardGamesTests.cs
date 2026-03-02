using Xunit;
using BoardGameHub.Api.Services;
using BoardGameHub.Api.Models;
using System.Threading.Tasks;

namespace BoardGameHub.Tests.Services
{

    public class FourInARowGameServiceTests
    {
         private readonly FourInARowGameService _service;
         public FourInARowGameServiceTests() { _service = new FourInARowGameService(); }

         [Fact]
         public async Task StartRound_ShouldInitBoard()
         {
             var room = new Room();
             await _service.StartRound(room, new GameSettings());
             Assert.NotNull(room.GameData);
         }
    }

    public class WarshipsGameServiceTests
    {
         private readonly WarshipsGameService _service;
         public WarshipsGameServiceTests() { _service = new WarshipsGameService(); }

         [Fact]
         public async Task StartRound_ShouldInitBoard()
         {
             var room = new Room();
             await _service.StartRound(room, new GameSettings());
             Assert.NotNull(room.GameData);
         }
    }

    public class NomDeCodeServiceTests
    {
         private readonly NomDeCodeService _service;
         public NomDeCodeServiceTests() { _service = new NomDeCodeService(); }

         [Fact]
         public async Task StartRound_ShouldInitBoard()
         {
             var room = new Room();
             await _service.StartRound(room, new GameSettings());
             Assert.NotNull(room.GameData);
         }
    }
}
