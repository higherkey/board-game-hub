using BoardGameHub.Api.Data;
using Npgsql;
using Xunit;

namespace BoardGameHub.Tests.Infrastructure;

public class ConnectionStringHelperTests
{
    [Theory]
    [InlineData(null, null)]
    [InlineData("", "")]
    [InlineData("   ", "   ")]
    public void Normalize_NullOrWhitespace_ReturnsInput(string? input, string? expected)
    {
        var result = ConnectionStringHelper.Normalize(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void Normalize_StandardAdoNetString_ReturnsUntouched()
    {
        var input = "Host=ep-xyz.neon.tech;Port=5432;Database=neondb;Username=user;Password=pass;";
        var result = ConnectionStringHelper.Normalize(input);
        Assert.Equal(input, result);
    }

    [Fact]
    public void Normalize_QuotedAdoNetString_StripsQuotes()
    {
        var input = "\"Host=ep-xyz.neon.tech;Port=5432;Database=neondb;Username=user;Password=pass;\"";
        var result = ConnectionStringHelper.Normalize(input);
        Assert.Equal("Host=ep-xyz.neon.tech;Port=5432;Database=neondb;Username=user;Password=pass;", result);
    }

    [Fact]
    public void Normalize_PostgresUri_ConvertsToAdoNet()
    {
        var input = "postgresql://myuser:mypassword@ep-cool-frog.us-east-2.aws.neon.tech:5432/neondb?sslmode=require";
        var result = ConnectionStringHelper.Normalize(input);

        Assert.NotNull(result);
        var builder = new NpgsqlConnectionStringBuilder(result);
        Assert.Equal("ep-cool-frog.us-east-2.aws.neon.tech", builder.Host);
        Assert.Equal(5432, builder.Port);
        Assert.Equal("neondb", builder.Database);
        Assert.Equal("myuser", builder.Username);
        Assert.Equal("mypassword", builder.Password);
        Assert.Equal(SslMode.Require, builder.SslMode);
        Assert.True(builder.TrustServerCertificate);
    }

    [Fact]
    public void Normalize_PostgresSchemeWithoutPort_DefaultsPortAndSsl()
    {
        var input = "postgres://dbuser:secret@aws-0-us-east-1.pooler.supabase.com/postgres";
        var result = ConnectionStringHelper.Normalize(input);

        Assert.NotNull(result);
        var builder = new NpgsqlConnectionStringBuilder(result);
        Assert.Equal("aws-0-us-east-1.pooler.supabase.com", builder.Host);
        Assert.Equal(5432, builder.Port);
        Assert.Equal("postgres", builder.Database);
        Assert.Equal("dbuser", builder.Username);
        Assert.Equal("secret", builder.Password);
        Assert.Equal(SslMode.Require, builder.SslMode);
        Assert.True(builder.TrustServerCertificate);
    }

    [Fact]
    public void Normalize_UrlEncodedCredentials_DecodesCorrectly()
    {
        var input = "postgresql://user%40test.com:p%40ss%23word@ep-xyz.neon.tech/neondb";
        var result = ConnectionStringHelper.Normalize(input);

        Assert.NotNull(result);
        var builder = new NpgsqlConnectionStringBuilder(result);
        Assert.Equal("user@test.com", builder.Username);
        Assert.Equal("p@ss#word", builder.Password);
    }
}
