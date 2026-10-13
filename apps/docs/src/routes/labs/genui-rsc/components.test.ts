import { beforeEach, describe, expect, it, vi } from "vitest";
import { action } from "./components.js";
import { labComponents } from "./components.server.js";

vi.mock("@vitejs/plugin-rsc/rsc/server", () => ({
  renderToReadableStream(value: string) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(value));
        controller.close();
      },
    });
  },
}));

vi.mock("./components.server.js", async () => {
  const { serverComponent, oneOf } = await import("@comp0/genui/rsc");
  return {
    labComponents: {
      Forecast: serverComponent("Forecast", {
        description: "Forecast chart.",
        props: { city: oneOf(["Oslo", "Tokyo"]) },
        render: vi.fn(async ({ city }) => `Flight for ${city}`),
      }),
      Shader: () => null,
    },
  };
});

function request(body: unknown, headers: HeadersInit = {}) {
  return new Request("https://comp0.test/labs/genui-rsc/components", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("lab component transport", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders only a validated component and returns the host's RSC stream", async () => {
    const response = await action({
      request: request({ name: "Forecast", props: { city: "Oslo", injected: true } }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/x-component");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("Flight for Oslo");
    expect(labComponents.Forecast.render).toHaveBeenCalledExactlyOnceWith({ city: "Oslo" });
  });

  it.each([
    { name: "Missing", props: { city: "Oslo" } },
    { name: "Shader", props: {} },
    { name: "Forecast", props: { city: "Unknown" } },
    { name: "Forecast", props: {} },
    { name: 9, props: { city: "Oslo" } },
    null,
  ])("refuses unknown components and invalid props before executing them", async (body) => {
    expect((await action({ request: request(body) })).status).toBe(400);
    expect(labComponents.Forecast.render).not.toHaveBeenCalled();
  });

  it("refuses cross-origin requests, unsupported content, and oversized bodies", async () => {
    const body = { name: "Forecast", props: { city: "Oslo" } };
    expect(
      (await action({ request: request(body, { origin: "https://elsewhere.test" }) })).status,
    ).toBe(403);
    expect(
      (await action({ request: request(body, { "sec-fetch-site": "cross-site" }) })).status,
    ).toBe(403);
    expect(
      (await action({ request: request(body, { "content-type": "text/plain" }) })).status,
    ).toBe(415);
    expect((await action({ request: request({ ...body, pad: "x".repeat(16_384) }) })).status).toBe(
      400,
    );
    expect(
      (await action({ request: new Request("https://comp0.test/labs/genui-rsc/components") }))
        .status,
    ).toBe(405);
    expect(labComponents.Forecast.render).not.toHaveBeenCalled();
  });
});
