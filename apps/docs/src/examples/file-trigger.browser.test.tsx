import { act } from "react";
import { createRoot } from "react-dom/client";
import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { getExample } from "./registry.js";

describe("FileTrigger docs example", () => {
  it("activates a non-hidden native file input from its visible label", async () => {
    const Example = getExample("file-trigger");
    if (!Example) throw new Error("Missing file-trigger docs example");

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    act(() => {
      root.render(<Example />);
    });

    const input = page.getByLabelText("Choose a file").element() as HTMLInputElement;
    expect(input.hidden).toBe(false);
    expect(input.name).toBe("example-file");

    let activated = false;
    input.addEventListener("click", () => {
      activated = true;
    });
    await page.getByText("Choose a file").click();
    expect(activated).toBe(true);

    act(() => root.unmount());
    container.remove();
  });
});
