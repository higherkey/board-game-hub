const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deploy } = require('./render-deploy');

function fixture({ branch = 'dev', state = 'live', games = [{ id: 'Yacht', name: 'Yacht', status: 'Testing' }],
  gamesStatus = 200, gamesType = 'application/json', services = true, apiStatus = 200 } = {}) {
  const calls = [];
  const options = {
    apiKey: 'private-api-key', connectionString: 'private-database-connection',
    serviceName: 'board-game-hub-api-dev', branch: 'dev', commitId: 'tested-commit',
    sleep: async () => {}, log: () => {},
    fetchImpl: async (url, init) => {
      calls.push({ url, ...init });
      let body;
      let status = apiStatus;
      let type = 'application/json';
      if (url.includes('/services?')) body = services ? [{ service: {
        id: 'srv-test', name: 'board-game-hub-api-dev', branch,
        serviceDetails: { url: 'https://test.onrender.com' }
      } }] : [];
      else if (url.endsWith('/env-vars/ConnectionStrings__DefaultConnection')) body = {};
      else if (url.endsWith('/deploys')) body = { id: 'dep-test' };
      else if (url.endsWith('/deploys/dep-test')) body = { status: state };
      else if (url.endsWith('/health')) body = { status: 'healthy' };
      else if (url.endsWith('/api/games')) { body = games; status = gamesStatus; type = gamesType; }
      else throw new Error('Unexpected request.');
      return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': type } });
    }
  };
  return { options, calls };
}

test('aligns only the database key, deploys the tested commit and checks real routes', async () => {
  const { options, calls } = fixture();
  assert.equal(await deploy(options), 'dep-test');
  const writes = calls.filter(c => ['PUT', 'POST'].includes(c.method));
  assert.deepEqual(writes.map(c => [c.method, JSON.parse(c.body)]), [
    ['PUT', { value: options.connectionString }], ['POST', { commitId: options.commitId }]
  ]);
  assert.ok(calls.at(-1).url.endsWith('/api/games'));
});

test('rejects a missing secret before making requests', async () => {
  const { options, calls } = fixture();
  await assert.rejects(deploy({ ...options, connectionString: '' }), /requires/);
  assert.equal(calls.length, 0);
});

for (const config of [{ branch: 'main' }, { services: false }]) {
  test(`refuses to mutate an unexpected service: ${JSON.stringify(config)}`, async () => {
    const { options, calls } = fixture(config);
    await assert.rejects(deploy(options));
    assert.ok(calls.every(c => c.method === 'GET'));
  });
}

for (const state of ['build_failed', 'pre_deploy_failed', 'update_failed', 'canceled', 'deactivated']) {
  test(`fails when deployment is ${state}`, async () => {
    const { options, calls } = fixture({ state });
    await assert.rejects(deploy(options), new RegExp(state));
    assert.ok(!calls.some(c => c.url.endsWith('/health')));
  });
}

test('bounds a deployment that never becomes live', async () => {
  const { options } = fixture({ state: 'build_in_progress' });
  await assert.rejects(deploy({ ...options, timeoutMs: 0 }), /Timed out/);
});

for (const config of [{ gamesStatus: 500 }, { games: [] }, { games: { error: 'failure' } },
  { games: [null] }, { games: ['error'] }, { games: [{}] },
  { games: [{ id: 'Yacht', name: 'Yacht', status: 'invalid' }] },
  { gamesType: 'text/html' }, { apiStatus: 401 }]) {
  test(`fails on an unhealthy API: ${JSON.stringify(config)}`, async () => {
    const { options } = fixture(config);
    await assert.rejects(deploy(options));
  });
}
