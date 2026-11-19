/** Small delayed chunks make recorded responses stream without requiring a model key. */
export async function* replay(
  response: string,
  signal?: AbortSignal,
  chunkSize = 80,
): AsyncGenerator<string> {
  for (let offset = 0; offset < response.length; offset += chunkSize) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    if (signal?.aborted) return;
    yield response.slice(offset, offset + chunkSize);
  }
}
