import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { getExample } from "./registry.js";

describe("FileTrigger docs example", () => {
  it("activates a non-hidden native file input from its visible label", () => {
    const Example = getExample("file-trigger");
    if (!Example) throw new Error("Missing file-trigger docs example");

    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    act(() => {
      root.render(<Example />);
    });

    const label = container.querySelector<HTMLLabelElement>("label");
    const input = container.querySelector<HTMLInputElement>("input[type=file]");
    expect(label).not.toBeNull();
    expect(input).not.toBeNull();
    expect(input!.hidden).toBe(false);
    expect(input!.name).toBe("example-file");
    expect(input!.getAttribute("aria-label")).toBe("Choose a file");

    let activated = false;
    input!.addEventListener("click", () => {
      activated = true;
    });
    label!.click();
    expect(activated).toBe(true);

    act(() => root.unmount());
    container.remove();
  });
});
