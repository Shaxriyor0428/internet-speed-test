import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, UsageError } from '../src/args.js';

test('missing URL is a usage error', () => {
  assert.throws(() => parseArgs([]), UsageError);
});

test('-h and --help request help', () => {
  assert.deepEqual(parseArgs(['-h']), { help: true });
  assert.deepEqual(parseArgs(['--help']), { help: true });
});

test('accepts http and https URLs', () => {
  const https = parseArgs(['https://example.com/big.jpg?size=large']);
  assert.equal(https.help, false);
  assert.ok(https.url instanceof URL);
  assert.equal(https.url.href, 'https://example.com/big.jpg?size=large');

  assert.equal(parseArgs(['http://localhost:8080/file']).url.port, '8080');
});

test('more than one argument is a usage error', () => {
  assert.throws(() => parseArgs(['https://a.com/x', 'extra']), UsageError);
});

test('URL without a scheme is rejected', () => {
  assert.throws(() => parseArgs(['example.com/big.jpg']), UsageError);
});

test('non-HTTP schemes are rejected', () => {
  assert.throws(() => parseArgs(['ftp://example.com/file']), UsageError);
  assert.throws(() => parseArgs(['file:///etc/hosts']), UsageError);
  assert.throws(() => parseArgs(['localhost:8080']), UsageError);
});
