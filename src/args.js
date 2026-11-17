export const USAGE = `Использование:
  node src/cli.js <url>

Пример:
  node src/cli.js https://speed.cloudflare.com/__down?bytes=10000000

Делает 10 последовательных запросов к <url>, дожидается полного ответа
на каждый и выводит среднее время запроса, общий объём и скорость скачивания.`;

export class UsageError extends Error {
  name = 'UsageError';
}

export function parseArgs(argv) {
  if (argv.length === 0) {
    throw new UsageError('не указан URL');
  }
  if (argv[0] === '-h' || argv[0] === '--help') {
    return { help: true };
  }
  if (argv.length > 1) {
    throw new UsageError('ожидается ровно один аргумент — URL (если в адресе есть пробелы, возьмите его в кавычки)');
  }
  return { help: false, url: parseTargetUrl(argv[0]) };
}

export function parseTargetUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new UsageError(`некорректный URL: "${raw}" (нужен полный адрес, например https://example.com/image.jpg)`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UsageError(`поддерживаются только http и https, получено: ${url.protocol}`);
  }
  return url;
}
