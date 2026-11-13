const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { createServer } = require('node:net');
const path = require('node:path');

async function unusedPort() {
  const socket = createServer();
  socket.listen(0, '127.0.0.1');
  await once(socket, 'listening');
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}

for (const mode of ['local', 'render', 'container']) {
  test(`API serves health with ${mode} port configuration`, { timeout: 30000 }, async t => {
    const port = await unusedPort();
    const env = { ...process.env,
      ConnectionStrings__DefaultConnection: `InMemoryBinding-${mode}`,
      Jwt__Key: 'BindingTestOnlyKey123456789012345678901234567890',
      Admin__Email: '', Admin__Password: '', Testing__DisablePersistenceWorker: 'true'
    };
    delete env.PORT;
    delete env.ASPNETCORE_URLS;
    delete env.DOTNET_URLS;
    delete env.ASPNETCORE_HTTPS_PORTS;
    delete env.ASPNETCORE_HTTP_PORTS;
    if (mode === 'container') env.ASPNETCORE_HTTP_PORTS = String(port);
    else env.ASPNETCORE_URLS = `http://127.0.0.1:${mode === 'render' ? await unusedPort() : port}`;
    if (mode === 'render') env.PORT = String(port);

    const dll = path.resolve(process.env.BGH_API_DLL ||
      'backend/BoardGameHub.Api/bin/Debug/net10.0/BoardGameHub.Api.dll');
    const child = spawn('dotnet', [dll], { cwd: path.resolve('backend/BoardGameHub.Api'), env });
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null) {
        const exited = once(child, 'exit');
        child.kill();
        await exited;
      }
    });
    // Drain stderr, and wait for the real listener rather than a fixed startup delay.
    child.stderr.resume();
    await new Promise((resolve, reject) => {
      let output = '';
      const timer = setTimeout(() => reject(new Error('API startup timed out.')), 20000);
      child.stdout.on('data', chunk => {
        output += chunk.toString();
        if (output.includes('Now listening on:')) { clearTimeout(timer); resolve(); }
      });
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('exit', () => { clearTimeout(timer); reject(new Error('API exited before startup.')); });
    });
    const response = await fetch(`http://127.0.0.1:${port}/health`, { signal: AbortSignal.timeout(5000) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).status, 'healthy');
  });
}
