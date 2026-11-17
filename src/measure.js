export class HttpStatusError extends Error {
  name = 'HttpStatusError';

  constructor(status, statusText) {
    super(`сервер вернул HTTP ${status}${statusText ? ` ${statusText}` : ''}`);
    this.status = status;
  }
}

export async function measureRequest(url) {
  const start = performance.now();

  const response = await fetch(url, {
    headers: {
      'Accept-Encoding': 'identity',
    },
  });

  if (!response.ok) {
    await response.body?.cancel();
    throw new HttpStatusError(response.status, response.statusText);
  }

  let bytes = 0;
  if (response.body) {
    for await (const chunk of response.body) {
      bytes += chunk.byteLength;
    }
  }

  return { bytes, durationMs: performance.now() - start };
}
