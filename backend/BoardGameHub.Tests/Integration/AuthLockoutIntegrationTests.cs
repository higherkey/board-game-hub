using System.Net;
using System.Net.Http.Json;
using BoardGameHub.Api.Data;
using BoardGameHub.Api.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace BoardGameHub.Tests.Integration;

public class AuthLockoutIntegrationTests
{
    [Fact]
    public async Task Login_PersistsLockoutAndAllowsLoginAfterExpiry()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
            builder.ConfigureAppConfiguration((_, config) => config.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ConnectionStrings:DefaultConnection"] = $"InMemory-AuthLockout-{Guid.NewGuid():N}",
                    ["Testing:DisablePersistenceWorker"] = "true",
                    ["Admin:Email"] = "",
                    ["Admin:Password"] = "",
                    ["Jwt:Key"] = "SyntheticJwtKeyForAuthLockoutIntegrationTests123!"
                }));
        });
        using var client = factory.CreateClient();
        const string email = "lockout@example.test";
        const string password = "SyntheticPassword123!";

        var options = factory.Services.GetRequiredService<IOptions<IdentityOptions>>().Value.Lockout;
        Assert.Equal(5, options.MaxFailedAccessAttempts);
        Assert.Equal(TimeSpan.FromMinutes(15), options.DefaultLockoutTimeSpan);
        Assert.True(options.AllowedForNewUsers);

        using var registration = await client.PostAsJsonAsync("/api/auth/register", new
        {
            Email = email, Password = password, DisplayName = "Lockout test"
        });
        Assert.Equal(HttpStatusCode.OK, registration.StatusCode);
        Assert.True((await ReadUserAsync(factory, email)).LockoutEnabled);

        using var unknown = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = "unknown@example.test", Password = password
        });
        Assert.Equal(HttpStatusCode.BadRequest, unknown.StatusCode);
        var genericError = await unknown.Content.ReadAsStringAsync();
        Assert.Equal("Invalid login attempt", genericError);

        for (var attempt = 1; attempt <= 5; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/auth/login", new
            {
                Email = email, Password = "incorrect-password"
            });
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            Assert.Equal(genericError, await response.Content.ReadAsStringAsync());

            var stored = await ReadUserAsync(factory, email);
            if (attempt < 5)
            {
                Assert.Equal(attempt, stored.AccessFailedCount);
                Assert.Null(stored.LockoutEnd);
            }
            else
            {
                Assert.Equal(0, stored.AccessFailedCount);
                Assert.NotNull(stored.LockoutEnd);
                Assert.InRange(stored.LockoutEnd.Value - DateTimeOffset.UtcNow,
                    TimeSpan.FromMinutes(14), TimeSpan.FromMinutes(16));
            }
        }

        using var locked = await client.PostAsJsonAsync("/api/auth/login", new { Email = email, Password = password });
        Assert.Equal(HttpStatusCode.BadRequest, locked.StatusCode);
        Assert.Equal(genericError, await locked.Content.ReadAsStringAsync());
        Assert.True((await ReadUserAsync(factory, email)).LockoutEnd > DateTimeOffset.UtcNow);

        using (var scope = factory.Services.CreateScope())
        {
            var users = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
            var user = await users.FindByEmailAsync(email);
            Assert.NotNull(user);
            Assert.True((await users.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddMinutes(-1))).Succeeded);
        }

        using var failedAfterExpiry = await client.PostAsJsonAsync("/api/auth/login", new
        {
            Email = email, Password = "incorrect-password"
        });
        Assert.Equal(HttpStatusCode.BadRequest, failedAfterExpiry.StatusCode);
        Assert.Equal(1, (await ReadUserAsync(factory, email)).AccessFailedCount);

        using var success = await client.PostAsJsonAsync("/api/auth/login", new { Email = email, Password = password });
        Assert.Equal(HttpStatusCode.OK, success.StatusCode);
        Assert.Contains("\"token\":", await success.Content.ReadAsStringAsync());
        Assert.Equal(0, (await ReadUserAsync(factory, email)).AccessFailedCount);
    }

    private static async Task<User> ReadUserAsync(WebApplicationFactory<Program> factory, string email)
    {
        using var scope = factory.Services.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<AppDbContext>().Users
            .AsNoTracking().SingleAsync(user => user.Email == email);
    }
}