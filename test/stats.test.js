import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  formatDuration,
  formatMBps,
  formatMbps,
  groupDigits,
  megabitsPerSecond,
  sum,
  summarize,
} from '../src/stats.js';

test('sum adds numbers, empty list gives 0', () => {
  assert.equal(sum([1, 2, 3.5]), 6.5);
  assert.equal(sum([]), 0);
});

test('megabitsPerSecond: 1 000 000 bytes in 1 s = 8 Mbit/s', () => {
  assert.equal(megabitsPerSecond(1_000_000, 1000), 8);
});

test('megabitsPerSecond: 125 000 bytes in 100 ms = 10 Mbit/s', () => {
  assert.ok(Math.abs(megabitsPerSecond(125_000, 100) - 10) < 1e-9);
});

test('megabitsPerSecond rejects non-positive or NaN duration', () => {
  assert.throws(() => megabitsPerSecond(100, 0), RangeError);
  assert.throws(() => megabitsPerSecond(100, -5), RangeError);
  assert.throws(() => megabitsPerSecond(100, NaN), RangeError);
});

test('summarize computes totals, average time and speed', () => {
  const summary = summarize([
    { bytes: 1_000_000, durationMs: 500 },
    { bytes: 1_000_000, durationMs: 1500 },
  ]);

  assert.deepEqual(summary, {
    requestCount: 2,
    totalBytes: 2_000_000,
    totalDurationMs: 2000,
    averageDurationMs: 1000,
    speedMbps: 8,
    speedMBps: 1,
  });
});

test('summarize uses total bytes / total time, not the mean of per-request speeds', () => {
  const { speedMbps } = summarize([
    { bytes: 1_000_000, durationMs: 500 },
    { bytes: 1_000_000, durationMs: 1500 },
  ]);
  assert.equal(speedMbps, 8);
});

test('summarize rejects an empty list', () => {
  assert.throws(() => summarize([]), RangeError);
});

test('formatBytes uses decimal units', () => {
  assert.equal(formatBytes(0), '0 Б');
  assert.equal(formatBytes(999), '999 Б');
  assert.equal(formatBytes(1000), '1.00 КБ');
  assert.equal(formatBytes(52_428_800), '52.43 МБ');
  assert.equal(formatBytes(1_500_000_000), '1.50 ГБ');
});

test('groupDigits separates thousands with spaces', () => {
  assert.equal(groupDigits(0), '0');
  assert.equal(groupDigits(999), '999');
  assert.equal(groupDigits(1000), '1 000');
  assert.equal(groupDigits(52_428_800), '52 428 800');
});

test('formatDuration switches from ms to seconds at 1000 ms', () => {
  assert.equal(formatDuration(312.44), '312.4 мс');
  assert.equal(formatDuration(999.9), '999.9 мс');
  assert.equal(formatDuration(1000), '1.00 с');
  assert.equal(formatDuration(2345), '2.35 с');
});

test('formatMbps / formatMBps', () => {
  assert.equal(formatMbps(65.014), '65.01 Мбит/с');
  assert.equal(formatMBps(8.126), '8.13 МБ/с');
});
