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
                { "ConnectionStrings:DefaultConnection", "" },
                { "Jwt:Key", "ThisIsAVerySecretKeyForTestingPurposesOnly123!" },
                { "Testing:DisablePersistenceWorker", "true" }
            });
        });
    }
}
