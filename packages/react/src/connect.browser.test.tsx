import { act, useState } from "react";
import { page, userEvent } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanupRoots, render } from "../test/render.js";
import {
  Connect,
  ConnectCard,
  ConnectDisconnect,
  ConnectInput,
  ConnectInputSelect,
  ConnectInputTrigger,
  ConnectLines,
  ConnectOutput,
} from "./connect.js";

function Connections() {
  const [offset, setOffset] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setOffset(80)}>
        Move card
      </button>
      <Connect
        aria-label="Connections"
        style={{ width: 600, padding: 20, display: "flex", gap: 150 }}
      >
        <ConnectLines />
        <ConnectCard value="source" label="Source" style={{ width: 160 }}>
          <ConnectOutput value="color" label="Color" kind="color" style={{ padding: 20 }}>
            Color output
          </ConnectOutput>
        </ConnectCard>
        <ConnectCard
          value="target"
          label="Target"
          style={{ width: 160, transform: `translateY(${offset}px)` }}
        >
          <ConnectInput value="color" label="Color" kind="color">
            <ConnectInputTrigger style={{ padding: 20 }}>Color input</ConnectInputTrigger>
            <ConnectInputSelect />
            <ConnectDisconnect>Disconnect</ConnectDisconnect>
          </ConnectInput>
        </ConnectCard>
      </Connect>
      <button type="button">After</button>
    </>
  );
}

describe("Connect browser interactions", () => {
  beforeEach(async () => page.viewport(900, 600));
  afterEach(() => cleanupRoots());
  it("connects with two pointer clicks and updates the wire after a card moves", async () => {
    const { container } = render(<Connections />);
    await act(async () =>
      userEvent.click(page.getByRole("button", { name: "Source: Color output (color)" })),
    );
    await act(async () =>
      userEvent.click(page.getByRole("button", { name: "Target: Color input (color)" })),
    );
    const select = page.getByRole("combobox").element() as HTMLSelectElement;
    expect(select.value).toBe("color");
    await expect.poll(() => container.querySelector("svg path")?.getAttribute("d")).toBeTruthy();
    const initial = container.querySelector("svg path")!.getAttribute("d");
    await act(async () => userEvent.click(page.getByRole("button", { name: "Move card" })));
    await expect
      .poll(() => container.querySelector("svg path")?.getAttribute("d"))
      .not.toBe(initial);
    expect(container.querySelector("svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("connects and disconnects through keyboard activation without trapping focus", async () => {
    render(<Connections />);
    const output = page.getByRole("button", { name: "Source: Color output (color)" }).element();
    act(() => output.focus());
    await act(async () => userEvent.keyboard("{Enter}"));
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(
      page.getByRole("group", { name: "Target", exact: true }).element(),
    );
    await act(async () => userEvent.tab());
    await act(async () => userEvent.keyboard(" "));
    expect((page.getByRole("combobox").element() as HTMLSelectElement).value).toBe("color");
    await act(async () => userEvent.tab());
    await act(async () => userEvent.tab());
    await act(async () => userEvent.keyboard("{Enter}"));
    expect((page.getByRole("combobox").element() as HTMLSelectElement).value).toBe("");
    expect(document.activeElement).toBe(page.getByRole("combobox").element());
    await act(async () => userEvent.tab());
    expect(document.activeElement).toBe(page.getByRole("button", { name: "After" }).element());
  });

  it("connects through a real pointer drag", async () => {
    render(<Connections />);
    await userEvent.dragAndDrop(
      page.getByRole("button", { name: "Source: Color output (color)" }),
      page.getByRole("button", { name: "Target: Color input (color)" }),
    );
    expect((page.getByRole("combobox").element() as HTMLSelectElement).value).toBe("color");
  });
});
