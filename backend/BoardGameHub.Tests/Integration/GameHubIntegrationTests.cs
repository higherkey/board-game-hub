using Microsoft.AspNetCore.SignalR.Client;
using BoardGameHub.Tests.Infrastructure;
using BoardGameHub.Api.Models;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using BoardGameHub.Api.Services;

namespace BoardGameHub.Tests.Integration;

public class GameHubIntegrationTests : IClassFixture<TestBase>
{
    private readonly TestBase _factory;

    public GameHubIntegrationTests(TestBase factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateRoom_ShouldResultInRealRoomInService()
    {
        // Arrange
        var client = _factory.CreateClient();
        var connection = new HubConnectionBuilder()
            .WithUrl("http://localhost/gamehub", options =>
            {
                options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler();
            })
            .Build();

        try 
        {
            await connection.StartAsync();

            // Act
            // Provide all arguments explicitly just in case SignalR.Client is picky
            await connection.InvokeAsync("CreateRoom", "HostPlayer", true, "OneAndOnly", (string?)null, false);

            // Assert
            using var scope = _factory.Services.CreateScope();
            var roomService = scope.ServiceProvider.GetRequiredService<IRoomService>();
            var rooms = roomService.GetServerStats().Rooms;

            rooms.Should().NotBeEmpty();
            rooms.Any(r => r.HostName == "HostPlayer").Should().BeTrue();
        }
        catch (Exception ex)
        {
            // Fail with the actual exception message
            throw new Exception($"SignalR Invoke Failed: {ex.Message}\n{ex.StackTrace}", ex);
        }
        finally
        {
            await connection.StopAsync();
        }
    }
}
