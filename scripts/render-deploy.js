#!/usr/bin/env node
const { setTimeout: delay } = require('node:timers/promises');

// Keep the migrated connection and the runtime connection identical. Never log either.
async function deploy({ apiKey, serviceName, branch, commitId, connectionString,
  fetchImpl = fetch, sleep = delay, timeoutMs = 15 * 60 * 1000, log = console.log }) {
  if (!apiKey || !serviceName || !branch || !commitId || !connectionString?.trim()) {
    throw new Error('Render deploy requires an API key, service, branch, commit and database connection.');
  }
  if (!['dev', 'staging', 'main'].includes(branch)) throw new Error('Unsupported deployment branch.');
  const api = 'https://api.render.com/v1';
  async function request(path, method = 'GET', body) {
    const response = await fetchImpl(`${api}${path}`, {
      method, headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) throw new Error(`Render ${method} request failed (HTTP ${response.status}).`);
    return response.json();
  }

  const matches = [];
  let cursor = '';
  do {
    const page = await request(`/services?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
    if (!Array.isArray(page)) throw new Error('Invalid Render services response.');
    matches.push(...page.filter(item => item.service?.name === serviceName));
    cursor = page.length === 100 ? page.at(-1).cursor : '';
  } while (cursor);
  if (matches.length !== 1) throw new Error('Expected exactly one matching Render service.');
  const service = matches[0].service;
  if (service.branch !== branch) throw new Error('Render service branch does not match the migration target.');
  if (!service.serviceDetails?.url?.startsWith('https://')) throw new Error('Render service has no HTTPS URL.');

  await request(`/services/${service.id}/env-vars/ConnectionStrings__DefaultConnection`, 'PUT', {
    value: connectionString
  });
  const deployment = await request(`/services/${service.id}/deploys`, 'POST', { commitId });
  if (!deployment.id) throw new Error('Render did not return a deploy ID.');
  log(`Waiting for ${serviceName} deploy ${deployment.id}.`);
  const deadline = Date.now() + timeoutMs;
  let live = false;
  while (Date.now() < deadline) {
    const state = await request(`/services/${service.id}/deploys/${deployment.id}`);
    if (state.status === 'live') { live = true; break; }
    if (['build_failed', 'pre_deploy_failed', 'update_failed', 'canceled', 'deactivated'].includes(state.status)) {
      throw new Error(`Render deploy ended with status ${state.status}.`);
    }
    await sleep(15000);
  }
  if (!live) throw new Error('Timed out waiting for Render deployment.');
  // A live port alone cannot prove that database-backed routes work.
  for (const path of ['/health', '/api/games']) {
    const response = await fetchImpl(new URL(path, service.serviceDetails.url).href, {
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) throw new Error(`Smoke test ${path} failed (HTTP ${response.status}).`);
    if (!response.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Smoke test ${path} did not return JSON.`);
    }
    const data = await response.json();
    const valid = path === '/health' ? data?.status === 'healthy' : Array.isArray(data) && data.length > 0 &&
      data.every(game => typeof game?.id === 'string' && game.id.length > 0 &&
        typeof game.name === 'string' && game.name.length > 0 &&
        ['Deployed', 'Testing', 'InDevelopment', 'Backlog'].includes(game.status));
    if (!valid) {
      throw new Error(`Smoke test ${path} returned an invalid response.`);
    }
  }
  log(`${serviceName} is live; health and database-backed games checks passed.`);
  return deployment.id;
}

module.exports = { deploy };
if (require.main === module) {
  deploy({ apiKey: process.env.RENDER_API_KEY, serviceName: process.env.SERVICE_NAME,
    branch: process.env.TARGET_BRANCH, commitId: process.env.DEPLOY_COMMIT,
    connectionString: process.env.RAW_CONNECTION_STRING }).catch(error => {
    console.error(error.message); process.exitCode = 1;
  });
}
