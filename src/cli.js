#!/usr/bin/env node
import { parseArgs, USAGE, UsageError } from './args.js';
import { HttpStatusError, measureRequest } from './measure.js';
import {
  formatBytes,
  formatDuration,
  formatMBps,
  formatMbps,
  groupDigits,
  megabitsPerSecond,
  summarize,
} from './stats.js';

const REQUEST_COUNT = 10;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  console.log('Замер скорости скачивания');
  console.log(`URL: ${args.url}`);
  console.log(`Запросов: ${REQUEST_COUNT}, строго последовательно\n`);
  console.log(formatRow('№', 'Время', 'Размер', 'Скорость'));

  const results = [];
  for (let i = 1; i <= REQUEST_COUNT; i++) {
    let result;
    try {
      result = await measureRequest(args.url);
    } catch (error) {
      throw new Error(`запрос №${i}: ${describeRequestError(error)}`, { cause: error });
    }
    results.push(result);
    console.log(
      formatRow(
        String(i),
        formatDuration(result.durationMs),
        formatBytes(result.bytes),
        formatMbps(megabitsPerSecond(result.bytes, result.durationMs)),
      ),
    );
  }

  const summary = summarize(results);
  console.log('\nИтого:');
  console.log(`  Среднее время запроса:  ${formatDuration(summary.averageDurationMs)}`);
  console.log(`  Скачано всего:          ${formatBytes(summary.totalBytes)} (${groupDigits(summary.totalBytes)} байт)`);
  console.log(`  Суммарное время:        ${formatDuration(summary.totalDurationMs)}`);
  console.log(`  Скорость скачивания:    ${formatMbps(summary.speedMbps)} (${formatMBps(summary.speedMBps)})`);
}

function formatRow(number, time, size, speed) {
  return `${number.padStart(3)}  ${time.padStart(10)}  ${size.padStart(10)}  ${speed.padStart(16)}`;
}

function describeRequestError(error) {
  if (error instanceof HttpStatusError) {
    return error.message;
  }
  if (error?.cause?.message) {
    return `не удалось выполнить запрос (${error.cause.message})`;
  }
  return error?.message ?? String(error);
}

main().catch((error) => {
  console.error(`Ошибка: ${error.message}`);
  if (error instanceof UsageError) {
    console.error(`\n${USAGE}`);
  }
  process.exitCode = 1;
});
