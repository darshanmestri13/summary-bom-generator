const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const files = {
  '/': { path: 'index.html', type: 'text/html; charset=utf-8' },
  '/index.html': { path: 'index.html', type: 'text/html; charset=utf-8' },
  '/app.js': { path: 'app.js', type: 'text/javascript; charset=utf-8' },
};
const port = Number(process.env.PORT) || 4173;

http.createServer((req, res) => {
  const entry = files[new URL(req.url, 'http://localhost').pathname];
  if (!entry) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  fs.readFile(path.join(root, entry.path), (error, data) => {
    if (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unable to load the site file');
      return;
    }
    res.writeHead(200, {
      'Content-Type': entry.type,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`Summary BOM Generator running at http://127.0.0.1:${port}\n`);
});

