const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const exporter = process.env.CATALOGUE_EXPORT_DLL || path.join(root,
  'backend/BoardGameHub.CatalogueExport/bin/Debug/net10.0/BoardGameHub.CatalogueExport.dll');
const baseline = fs.readFileSync(path.join(root,
  'frontend/src/app/data/game-catalogue.generated.ts'), 'utf8');
const check = file => spawnSync('dotnet', [exporter, '--check', file], {
  cwd: root, encoding: 'utf8', timeout: 30000,
});

test('catalogue CLI validates committed metadata without API or database startup', async t => {
  assert.ok(fs.existsSync(exporter), 'Build the catalogue exporter before running these tests.');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bgh-catalogue-export-'));
  const fixture = path.join(directory, 'catalogue.ts');
  try {
    for (const [name, source, expected] of [
      ['baseline', baseline, 0],
      ['changed public metadata', baseline.replace('"name": "Babble"', '"name": "Changed Babble"'), 1],
      ['invalid timestamp', baseline.replace(/"generatedAt": "[^"]+"/, '"generatedAt": "invalid"'), 1],
      ['invalid schema', baseline.replace('"schemaVersion": 1', '"schemaVersion": 999'), 1],
      ['invalid version', baseline.replace(/"version": "[^"]+"/, '"version": "invalid"'), 1],
      ['valid older timestamp', baseline.replace(/"generatedAt": "[^"]+"/,
        '"generatedAt": "2020-01-01T00:00:00.0000000+00:00"'), 0],
    ]) {
      await t.test(name, () => {
        if (name !== 'baseline') assert.notEqual(source, baseline, 'Fixture mutation must take effect.');
        fs.writeFileSync(fixture, source);
        const result = check(fixture);
        assert.ifError(result.error);
        assert.equal(result.status, expected, result.stdout + result.stderr);
        assert.equal(fs.readFileSync(fixture, 'utf8'), source, 'Check must preserve the existing file.');
      });
    }
  } finally {
    if (fs.existsSync(fixture)) fs.unlinkSync(fixture);
    fs.rmdirSync(directory);
  }
});
