using System;
using System.Web;
using Npgsql;

namespace BoardGameHub.Api.Data;

public static class ConnectionStringHelper
{
    /// <summary>
    /// Normalizes a connection string. If it is in PostgreSQL URI format (postgres:// or postgresql://),
    /// converts it to a standard Npgsql ADO.NET key-value connection string.
    /// If it is already in ADO.NET format or empty, returns it as-is (with surrounding quotes stripped).
    /// </summary>
    public static string? Normalize(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return connectionString;
        }

        var trimmed = connectionString.Trim();
        if ((trimmed.StartsWith('"') && trimmed.EndsWith('"')) || (trimmed.StartsWith('\'') && trimmed.EndsWith('\'')))
        {
            trimmed = trimmed.Substring(1, trimmed.Length - 2).Trim();
        }

        if (!trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
            !trimmed.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
        {
            return trimmed;
        }

        try
        {
            // Standardize scheme to postgresql:// so Uri class parses it reliably
            if (trimmed.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
            {
                trimmed = "postgresql://" + trimmed.Substring("postgres://".Length);
            }

            var uri = new Uri(trimmed);
            var builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.Port > 0 ? uri.Port : 5432
            };

            var dbName = uri.AbsolutePath.TrimStart('/');
            builder.Database = string.IsNullOrEmpty(dbName) ? "postgres" : Uri.UnescapeDataString(dbName);

            if (!string.IsNullOrEmpty(uri.UserInfo))
            {
                var parts = uri.UserInfo.Split(':', 2);
                if (parts.Length > 0 && !string.IsNullOrEmpty(parts[0]))
                {
                    builder.Username = Uri.UnescapeDataString(parts[0]);
                }
                if (parts.Length > 1 && !string.IsNullOrEmpty(parts[1]))
                {
                    builder.Password = Uri.UnescapeDataString(parts[1]);
                }
            }

            // Parse query parameters (e.g. sslmode)
            var sslModeSet = false;
            if (!string.IsNullOrEmpty(uri.Query))
            {
                var query = uri.Query.TrimStart('?');
                var pairs = query.Split('&', StringSplitOptions.RemoveEmptyEntries);
                foreach (var pair in pairs)
                {
                    var kv = pair.Split('=', 2);
                    var key = Uri.UnescapeDataString(kv[0]).Trim();
                    var value = kv.Length > 1 ? Uri.UnescapeDataString(kv[1]).Trim() : "";

                    if (key.Equals("sslmode", StringComparison.OrdinalIgnoreCase))
                    {
                        sslModeSet = true;
                        builder.SslMode = value.ToLowerInvariant() switch
                        {
                            "disable" => SslMode.Disable,
                            "allow" => SslMode.Allow,
                            "prefer" => SslMode.Prefer,
                            "require" => SslMode.Require,
                            "verify-ca" => SslMode.VerifyCA,
                            "verify-full" => SslMode.VerifyFull,
                            _ => SslMode.Require
                        };
                    }
                    else if (key.Equals("channel_binding", StringComparison.OrdinalIgnoreCase))
                    {
                        if (Enum.TryParse<ChannelBinding>(value, true, out var cb))
                        {
                            builder.ChannelBinding = cb;
                        }
                    }
                }
            }

            if (!sslModeSet)
            {
                builder.SslMode = SslMode.Require;
            }

            builder.TrustServerCertificate = true;

            return builder.ConnectionString;
        }
        catch
        {
            // If URI parsing fails for any reason, return the original trimmed string
            return trimmed;
        }
    }
}
