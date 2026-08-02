import net from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build, preview } from 'vite';

const HOST = '127.0.0.1';

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, HOST, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

let baseUrl;
let server;

beforeAll(async () => {
  await build({ logLevel: 'warn' });
  const port = await getFreePort();
  server = await preview({
    preview: { host: HOST, port, strictPort: true },
  });
  baseUrl = `http://${HOST}:${server.config.preview.port}`;
}, 60000);

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.httpServer.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('smoke: the production build loads and serves the site', () => {
  it('builds and returns the page with a 200 and HTML content type', async () => {
    const res = await fetch(`${baseUrl}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
  });

  it('contains key brand and section content', async () => {
    const html = await fetch(`${baseUrl}/`).then((r) => r.text());
    for (const expected of [
      'Creative Digital Company',
      'Services',
      'Work',
      'Contact',
      'hello@creative-digital.example',
    ]) {
      expect(html).toContain(expected);
    }
  });

  it('serves every shipped page in the multi-page build', async () => {
    for (const page of ['/design-guidelines.html', '/examples.html']) {
      const res = await fetch(`${baseUrl}${page}`);
      expect(res.status, `${page} should be served`).toBe(200);
      expect(res.headers.get('content-type')).toMatch(/text\/html/);
    }
  });

  it('serves every asset referenced by the page', async () => {
    const html = await fetch(`${baseUrl}/`).then((r) => r.text());
    const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((ref) => /^\.?\//.test(ref));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const res = await fetch(new URL(ref, baseUrl));
      expect(res.status, `asset ${ref} should load`).toBe(200);
    }
  });
});
