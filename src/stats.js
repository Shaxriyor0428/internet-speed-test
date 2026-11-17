const BITS_PER_BYTE = 8;
const BITS_PER_MEGABIT = 1_000_000;
const MS_PER_SECOND = 1000;

export function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

export function megabitsPerSecond(bytes, durationMs) {
  if (!(durationMs > 0)) {
    throw new RangeError(`durationMs must be positive, got ${durationMs}`);
  }
  return (bytes * BITS_PER_BYTE) / BITS_PER_MEGABIT / (durationMs / MS_PER_SECOND);
}

export function summarize(results) {
  if (results.length === 0) {
    throw new RangeError('cannot summarize an empty list of results');
  }
  const totalBytes = sum(results.map((r) => r.bytes));
  const totalDurationMs = sum(results.map((r) => r.durationMs));
  const speedMbps = megabitsPerSecond(totalBytes, totalDurationMs);

  return {
    requestCount: results.length,
    totalBytes,
    totalDurationMs,
    averageDurationMs: totalDurationMs / results.length,
    speedMbps,
    speedMBps: speedMbps / BITS_PER_BYTE,
  };
}

export function formatBytes(bytes) {
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let value = bytes;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return unit === 0 ? `${bytes} Б` : `${value.toFixed(2)} ${units[unit]}`;
}

export function groupDigits(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatDuration(ms) {
  return ms < MS_PER_SECOND ? `${ms.toFixed(1)} мс` : `${(ms / MS_PER_SECOND).toFixed(2)} с`;
}

export function formatMbps(mbps) {
  return `${mbps.toFixed(2)} Мбит/с`;
}

export function formatMBps(megabytesPerSecond) {
  return `${megabytesPerSecond.toFixed(2)} МБ/с`;
}
