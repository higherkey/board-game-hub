using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace BoardGameHub.Tests.Infrastructure;

public class TestBase : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                // Unique in-memory database per factory so parallel test hosts don't race on startup seeding.
                { "ConnectionStrings:DefaultConnection", $"InMemory-{Guid.NewGuid():N}" },
                { "Jwt:Key", "ThisIsAVerySecretKeyForTestingPurposesOnly123!" },
                { "Testing:DisablePersistenceWorker", "true" }
            });
        });
    }
}
