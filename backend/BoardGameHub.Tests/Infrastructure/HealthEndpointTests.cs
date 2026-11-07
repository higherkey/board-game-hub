using System.Net;
using Xunit;

namespace BoardGameHub.Tests.Infrastructure;

public class HealthEndpointTests
{
    [Fact]
    public async Task Health_ReturnsOk()
    {
        using var factory = new TestBase();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("healthy", await response.Content.ReadAsStringAsync());
    }
}
