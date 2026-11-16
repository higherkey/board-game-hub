// Serve the built frontend for isolated catalogue browser tests; no backend is started.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../frontend/dist/frontend/browser');
const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };
http.createServer((request, response) => {
  let file;
  try {
    file = path.resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`);
  } catch {
    response.writeHead(400).end(); return;
  }
  if (file !== root && !file.startsWith(root + path.sep)) {
    response.writeHead(403).end(); return;
  }
  if (!path.extname(file)) file = path.join(root, 'index.html');
  fs.readFile(file, (error, content) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store' });
    response.end(content);
  });
}).listen(4300, '127.0.0.1', () => console.log('Catalogue test frontend on port 4300.'));
