#!/usr/bin/env node

/**
 * Given a target service name and a JSON array of services from Render's API,
 * prints the matching service ID to stdout.
 *
 * Usage:
 *   node scripts/find-render-service.js <service_name> <json_data>
 *   OR
 *   curl ... | node scripts/find-render-service.js <service_name>
 */

const fs = require('fs');

const targetName = process.argv[2] || process.env.TARGET_NAME;

if (!targetName) {
  process.exit(1);
}

function processJson(raw) {
  try {
    const data = JSON.parse(raw);
    const item = Array.isArray(data) ? data.find(s => s && s.service && s.service.name === targetName) : null;
    if (item && item.service && item.service.id) {
      process.stdout.write(item.service.id);
    }
  } catch (e) {
    process.stderr.write(`Failed to parse Render services JSON: ${e.message}\n`);
    process.exit(1);
  }
}

if (process.argv[3]) {
  processJson(process.argv[3]);
} else {
  let input = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', chunk => { input += chunk; });
  process.stdin.on('end', () => { processJson(input); });
}
