#!/usr/bin/env node

/**
 * Normalizes PostgreSQL connection strings from URI format (postgres:// or postgresql://)
 * to ADO.NET format required by Npgsql (Host=...;Port=...;Database=...;Username=...;Password=...;).
 *
 * Usage:
 *   node scripts/normalize-connection-string.js "postgresql://user:pass@host:5432/db"
 *   OR via env var:
 *   RAW_CONNECTION_STRING="..." node scripts/normalize-connection-string.js
 */

function normalize(conn) {
  if (!conn) return "";
  conn = conn.trim();
  if ((conn.startsWith('"') && conn.endsWith('"')) || (conn.startsWith("'") && conn.endsWith("'"))) {
    conn = conn.slice(1, -1).trim();
  }
  if (!conn.startsWith("postgres://") && !conn.startsWith("postgresql://")) {
    return conn;
  }
  try {
    const standardized = conn.replace(/^postgres:\/\//i, "postgresql://");
    const u = new URL(standardized);
    const host = u.hostname;
    const port = u.port || "5432";
    const db = u.pathname.replace(/^\//, "") || "postgres";
    const user = decodeURIComponent(u.username || "");
    const pass = decodeURIComponent(u.password || "");
    let sslMode = "Require";
    if (u.searchParams.has("sslmode")) {
      const sm = u.searchParams.get("sslmode").toLowerCase();
      if (sm === "disable") sslMode = "Disable";
      else if (sm === "allow") sslMode = "Allow";
      else if (sm === "prefer") sslMode = "Prefer";
      else if (sm === "require") sslMode = "Require";
      else if (sm === "verify-ca") sslMode = "VerifyCA";
      else if (sm === "verify-full") sslMode = "VerifyFull";
    }
    return `Host=${host};Port=${port};Database=${db};Username=${user};Password=${pass};SSL Mode=${sslMode};Trust Server Certificate=true;`;
  } catch (e) {
    return conn;
  }
}

const input = process.argv[2] || process.env.RAW_CONNECTION_STRING || "";
const result = normalize(input);
process.stdout.write(result);
