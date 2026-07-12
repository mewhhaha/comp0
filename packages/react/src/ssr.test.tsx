import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Input,
  Label,
  Select,
  SelectPopover,
  SelectOption,
  SelectTrigger,
  TextField,
} from "./index.js";

function HydrationFixture() {
  return (
    <main>
      <TextField id="hydrated-field">
        <Label>Name</Label>
        <Input defaultValue="Ada" />
      </TextField>
      <Select id="hydrated-select" defaultValue="one">
        <SelectTrigger>Choose</SelectTrigger>
        <SelectPopover>
          <SelectOption value="one">One</SelectOption>
        </SelectPopover>
      </Select>
      <Dialog defaultOpen>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent portal={false} aria-label="Hydrated dialog">
          Content
        </DialogContent>
      </Dialog>
    </main>
  );
}

describe("SSR contracts", () => {
  it("hydrates generated relationships and fragment roots without mismatches", async () => {
    const markup = renderToString(<HydrationFixture />);
    const container = document.createElement("div");
    container.innerHTML = markup;
    document.body.append(container);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const root = hydrateRoot(container, <HydrationFixture />);
    await act(async () => undefined);

    expect(
      consoleError.mock.calls.some((call) => String(call[0]).toLowerCase().includes("hydration")),
    ).toBe(false);
    expect(container.querySelector("button")?.getAttribute("aria-controls")).toBeTruthy();

    act(() => root.unmount());
    container.remove();
    consoleError.mockRestore();
  });
});
