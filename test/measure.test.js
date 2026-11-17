import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { HttpStatusError, measureRequest } from '../src/measure.js';

const PAYLOAD = Buffer.alloc(300_000, 'x');
const SLOW_BODY_DELAY_MS = 200;

let server;
let baseUrl;
let lastRequestHeaders;

before(async () => {
  server = createServer(async (req, res) => {
    lastRequestHeaders = req.headers;
    switch (req.url) {
      case '/file':
        res.writeHead(200, { 'Content-Length': PAYLOAD.length });
        res.end(PAYLOAD);
        break;
      case '/chunked':
        res.writeHead(200);
        res.write(PAYLOAD.subarray(0, 100_000));
        res.end(PAYLOAD.subarray(100_000));
        break;
      case '/slow-body':
        res.writeHead(200, { 'Content-Length': PAYLOAD.length });
        res.write(PAYLOAD.subarray(0, 1000));
        await delay(SLOW_BODY_DELAY_MS);
        res.end(PAYLOAD.subarray(1000));
        break;
      default:
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('counts every byte of the body', async () => {
  const { bytes, durationMs } = await measureRequest(`${baseUrl}/file`);
  assert.equal(bytes, PAYLOAD.length);
  assert.ok(durationMs > 0);
});

test('counts bytes when Content-Length is absent', async () => {
  const { bytes } = await measureRequest(`${baseUrl}/chunked`);
  assert.equal(bytes, PAYLOAD.length);
});

test('waits for the whole body, not just the headers', async () => {
  const { bytes, durationMs } = await measureRequest(`${baseUrl}/slow-body`);
  assert.equal(bytes, PAYLOAD.length);
  assert.ok(durationMs >= SLOW_BODY_DELAY_MS, `duration ${durationMs} ms is shorter than body delay`);
});

test('asks the server for an uncompressed body', async () => {
  await measureRequest(`${baseUrl}/file`);
  assert.equal(lastRequestHeaders['accept-encoding'], 'identity');
});

test('non-2xx status throws HttpStatusError', async () => {
  await assert.rejects(measureRequest(`${baseUrl}/missing`), (error) => {
    assert.ok(error instanceof HttpStatusError);
    assert.equal(error.status, 404);
    assert.match(error.message, /HTTP 404/);
    return true;
  });
});
