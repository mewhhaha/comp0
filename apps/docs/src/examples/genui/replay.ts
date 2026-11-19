/** Small delayed chunks make recorded responses stream without requiring a model key. */
export async function* replay(response: string): AsyncGenerator<string> {
  for (let offset = 0; offset < response.length; offset += 80) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    yield response.slice(offset, offset + 80);
  }
}
