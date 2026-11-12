using System.Net;
using System.Net.Http.Json;
using BoardGameHub.Tests.Infrastructure;

namespace BoardGameHub.Tests.Integration;

public class ClientLoggingRateLimitTests : IClassFixture<TestBase>
{
    private readonly TestBase _factory;

    public ClientLoggingRateLimitTests(TestBase factory) => _factory = factory;

    private static async Task<HttpStatusCode> PostLogAsync(HttpClient client, string forwardedFor)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/ClientLogging")
        {
            Content = JsonContent.Create(new { level = "Information", message = "rate limit test", data = (object?)null })
        };
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        using var response = await client.SendAsync(request);
        return response.StatusCode;
    }

    [Fact]
    public async Task ClientLogging_IsRateLimitedPerForwardedClientIp()
    {
        var client = _factory.CreateClient();

        for (var i = 1; i <= 30; i++)
        {
            Assert.Equal(HttpStatusCode.OK, await PostLogAsync(client, "203.0.113.1"));
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, await PostLogAsync(client, "203.0.113.1"));

        // A different client IP has its own partition and is unaffected.
        Assert.Equal(HttpStatusCode.OK, await PostLogAsync(client, "203.0.113.2"));
    }
}
