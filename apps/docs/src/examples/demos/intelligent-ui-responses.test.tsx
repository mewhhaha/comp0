import { render } from "@testing-library/react";
import { GenUI } from "@comp0/genui";
import { describe, expect, it, vi } from "vitest";
import { demoResponses, tokenize } from "./intelligent-ui-responses.js";

describe("recorded Intelligent UI responses", () => {
  it("tokenizes losslessly", () => {
    for (const demo of demoResponses) expect(tokenize(demo.response).join("")).toBe(demo.response);
  });

  it("parses as one JSON document", () => {
    for (const demo of demoResponses) expect(() => JSON.parse(demo.response)).not.toThrow();
  });

  it.each(demoResponses.map((demo) => [demo.id, demo] as const))(
    "%s renders cleanly with the comp0 catalog",
    (_id, demo) => {
      const onError = vi.fn();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { container } = render(<GenUI response={demo.response} onError={onError} />);
      for (const [errors] of onError.mock.calls) expect(errors).toEqual([]);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
      expect(container.querySelector("[data-slot]")).not.toBeNull();
    },
  );

  it("renders every prefix while streaming without throwing", () => {
    for (const demo of demoResponses) {
      const tokens = tokenize(demo.response);
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const onError = vi.fn();
      for (let count = 0; count <= tokens.length; count += 7) {
        const { unmount } = render(
          <GenUI onError={onError} streaming response={tokens.slice(0, count).join("")} />,
        );
        unmount();
      }
      expect(warn).not.toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
      warn.mockRestore();
      error.mockRestore();
    }
  });
});
