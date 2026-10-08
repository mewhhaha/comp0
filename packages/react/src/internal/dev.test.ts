import { afterEach, describe, expect, it, vi } from "vitest";
import { DEV, warnOnce } from "./dev.js";

describe("dev helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("is on outside production", () => {
    expect(DEV).toBe(true);
  });

  it("logs each key once", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    warnOnce("dev-test:a", "first");
    warnOnce("dev-test:a", "again");
    warnOnce("dev-test:b", "second");

    expect(error.mock.calls).toEqual([["first"], ["second"]]);
  });

  it("stays silent in production builds", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const production = await import("./dev.js");
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    production.warnOnce("dev-test:production", "hidden");

    expect(production.DEV).toBe(false);
    expect(error).not.toHaveBeenCalled();
  });
});
