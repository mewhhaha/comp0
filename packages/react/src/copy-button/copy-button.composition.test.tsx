import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { setup } from "../../test/render.js";
import { CopyButton } from "./CopyButton.js";

describe("copy button composition", () => {
  it("copies the value, announces it politely and resets", async () => {
    const onCopied = vi.fn();
    const { getByRole, user } = setup(
      <CopyButton value="npm i @comp0/react" onCopied={onCopied}>
        Copy install command
      </CopyButton>,
    );
    const button = getByRole("button", { name: "Copy install command" });
    const status = getByRole("status");

    expect(status.textContent).toBe("");
    await user.click(button);

    expect(await navigator.clipboard.readText()).toBe("npm i @comp0/react");
    expect(onCopied).toHaveBeenCalledExactlyOnceWith("npm i @comp0/react");
    expect(status.textContent).toBe("Copied");
    expect(button.hasAttribute("data-copied")).toBe(true);
    expect(button.getAttribute("aria-label")).toBeNull();
  });

  it("clears the transient state after the reset delay", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { getByRole, user } = setup(
        <CopyButton value="x" resetDelay={500} copiedText="Done">
          Copy
        </CopyButton>,
      );
      await user.click(getByRole("button", { name: "Copy" }));
      expect(getByRole("status").textContent).toBe("Done");
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(getByRole("status").textContent).toBe("");
      expect(getByRole("button").hasAttribute("data-copied")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("reports a rejected clipboard write accessibly", async () => {
    const onCopyError = vi.fn();
    const { getByRole, user } = setup(
      <CopyButton value="x" onCopyError={onCopyError}>
        Copy
      </CopyButton>,
    );
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"));
    await user.click(getByRole("button", { name: "Copy" }));

    expect(getByRole("status").textContent).toBe("Copy failed");
    expect(getByRole("button").hasAttribute("data-failed")).toBe(true);
    expect(onCopyError).toHaveBeenCalledOnce();
  });

  it("works with an as element", async () => {
    const { getByRole, user } = setup(
      <CopyButton as="a" href="#copy" value="link text">
        Copy link
      </CopyButton>,
    );
    await user.click(getByRole("button", { name: "Copy link" }));
    expect(getByRole("status").textContent).toBe("Copied");
  });
});
