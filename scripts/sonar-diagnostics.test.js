const { test } = require('node:test');
const assert = require('node:assert/strict');
const { report } = require('./sonar-diagnostics');
test('reports PR and dev reliability metadata without exposing credentials', async () => {
  const calls = [], logs = [];
  await report({ token: 'private-token', pr: '244', fetchImpl: async (url, options) => {
    calls.push({ url, options });
    return new Response(JSON.stringify(url.includes('issues/search') ? { total: 1, issues: [{ key: 'issue',
      rule: 'rule', severity: 'MAJOR', component: 'file', line: 4, message: 'Fix behavior', source: 'never log source' }] }
      : { projectStatus: { status: 'ERROR', conditions: [] } }), { headers: { 'Content-Type': 'application/json' } });
  }, log: message => logs.push(message) });
  assert.equal(calls.length, 6);
  assert.ok(calls[0].url.includes('pullRequest=244'));
  assert.ok(calls[3].url.includes('branch=dev'));
  assert.ok(calls[1].url.includes('types=BUG%2CVULNERABILITY'));
  assert.ok(calls[2].url.includes('measures/component_tree'));
  assert.ok(logs.join('').includes('Fix behavior'));
  assert.ok(!logs.join('').includes('private-token'));
  assert.ok(!logs.join('').includes('never log source'));
});
test('reports duplicated-file metadata from both Sonar period formats', async () => {
  const logs = [];
  await report({ token: 'secret', branch: 'dev', fetchImpl: async url => new Response(JSON.stringify(
    url.includes('component_tree') ? { components: [
      { path: 'small.cs', measures: [{ metric: 'new_duplicated_lines', periods: [{ value: '2' }] }] },
      { path: 'large.cs', measures: [{ metric: 'new_duplicated_lines', period: { value: '12' } }] },
      { path: 'clean.cs', measures: [] }
    ] } : {})), log: message => logs.push(JSON.parse(message)) });
  assert.deepEqual(logs.at(-1).duplicatedFiles, [
    { path: 'large.cs', duplicatedLines: 12 }, { path: 'small.cs', duplicatedLines: 2 }
  ]);
});
test('rejects missing credentials before making requests', async () => {
  await assert.rejects(report({ token: '' }), /SONAR_TOKEN/);
});
test('HTTP failures do not expose response bodies', async () => {
  await assert.rejects(report({ token: 'secret', fetchImpl: async () => new Response('private body', { status: 403 }) }),
    error => error.message.includes('403') && !error.message.includes('private body'));
});
