using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using BoardGameHub.Tests.Infrastructure;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace BoardGameHub.Tests.Integration;

public class HubRateLimitTests : IClassFixture<TestBase>
{
    private readonly TestBase _factory;

    public HubRateLimitTests(TestBase factory) => _factory = factory;

    [Theory]
    [InlineData("/gamehub", "/socialhub", "203.0.113.10", "203.0.113.11")]
    [InlineData("/socialhub", "/gamehub", "203.0.113.20", "203.0.113.21")]
    public async Task HubHttpRequests_OverflowReturns429WithoutThrottlingOtherClients(
        string hub, string otherHub, string clientA, string clientB)
    {
        using var factory = _factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
            services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
                options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes("SyntheticRateLimitTestSigningKeyAtLeast32Bytes!")))));
        using var client = factory.CreateClient();
        var validation = factory.Services.GetRequiredService<IOptionsMonitor<JwtBearerOptions>>().Get(JwtBearerDefaults.AuthenticationScheme).TokenValidationParameters;
        var token = new JwtSecurityToken(
            issuer: validation.ValidIssuer,
            audience: validation.ValidAudience,
            claims: new[] { new Claim(ClaimTypes.NameIdentifier, "rate-limit-test") },
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: new SigningCredentials(
                validation.IssuerSigningKey, SecurityAlgorithms.HmacSha256));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", new JwtSecurityTokenHandler().WriteToken(token));

        for (var i = 0; i < 100; i++)
        {
            Assert.Equal(HttpStatusCode.OK, await NegotiateAsync(client, hub, clientA));
        }

        // The policy retains its 20-request queue; the next concurrent request overflows it.
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(5));
        var overflow = Enumerable.Range(0, 21)
            .Select(_ => NegotiateAsync(client, hub, clientA, cancellation.Token)).ToArray();
        try
        {
            Assert.Equal(HttpStatusCode.TooManyRequests, await await Task.WhenAny(overflow));
            Assert.Equal(HttpStatusCode.OK, await NegotiateAsync(client, hub, clientB));
            Assert.Equal(HttpStatusCode.OK, await NegotiateAsync(client, otherHub, clientB));
            using var logRequest = new HttpRequestMessage(HttpMethod.Post, "/api/ClientLogging")
            {
                Content = JsonContent.Create(new { level = "Information", message = "independent logging bucket" })
            };
            logRequest.Headers.Add("X-Forwarded-For", clientA);
            using var logResponse = await client.SendAsync(logRequest);
            Assert.Equal(HttpStatusCode.OK, logResponse.StatusCode);
            Assert.Equal(HttpStatusCode.TooManyRequests,
                await NegotiateAsync(client, otherHub, $"198.51.100.99, {clientA}"));
        }
        finally
        {
            await cancellation.CancelAsync();
            foreach (var request in overflow)
            {
                try { await request; }
                catch (OperationCanceledException) { }
            }
        }
    }

    private static async Task<HttpStatusCode> NegotiateAsync(HttpClient client, string hub, string forwardedFor,
        CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"{hub}/negotiate?negotiateVersion=1");
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        using var response = await client.SendAsync(request, cancellationToken);
        return response.StatusCode;
    }
}
