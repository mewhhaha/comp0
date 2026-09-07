import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { fireClick, render, userEvent, within } from "../test/render.js";
import {
  Connect,
  ConnectCard,
  ConnectDisconnect,
  ConnectInput,
  ConnectInputSelect,
  ConnectInputTrigger,
  ConnectOutput,
  type ConnectProps,
} from "./connect.js";

function Connections({ showBronze = true, ...props }: ConnectProps & { showBronze?: boolean }) {
  return (
    <Connect aria-label="Connections" {...props}>
      <ConnectCard value="palette" label="Palette">
        {showBronze && (
          <ConnectOutput value="bronze" label="Bronze" kind="color">
            Bronze
          </ConnectOutput>
        )}
        <ConnectOutput value="jade" label="Jade" kind="color">
          Jade
        </ConnectOutput>
        <ConnectOutput value="size" label="Size" kind="number">
          Size
        </ConnectOutput>
        <ConnectOutput value="unavailable" label="Unavailable" kind="color" disabled>
          Unavailable
        </ConnectOutput>
        <ConnectInput value="local" label="Local" kind="color">
          <ConnectInputSelect />
        </ConnectInput>
      </ConnectCard>
      <ConnectCard value="material" label="Material">
        {["surface", "accent"].map((value) => (
          <ConnectInput key={value} value={value} label={value} kind="color">
            <ConnectInputTrigger>{value}</ConnectInputTrigger>
            <ConnectInputSelect />
            <ConnectDisconnect>Disconnect</ConnectDisconnect>
          </ConnectInput>
        ))}
      </ConnectCard>
    </Connect>
  );
}

describe("Connect composition", () => {
  it("renders persistent labelled cards and connections without opening a dialog or taking focus", () => {
    const before = document.createElement("button");
    document.body.append(before);
    before.focus();
    const { container } = render(
      <Connections defaultValue={[{ from: "bronze", to: "surface" }]} />,
    );
    const controls = within(container);
    expect(document.activeElement).toBe(before);
    expect(controls.queryByRole("dialog")).toBeNull();
    expect(controls.getByRole("group", { name: "Palette" }).tagName).toBe("FIELDSET");
    expect(
      (
        controls.getByRole("combobox", {
          name: "Material: surface source (color)",
        }) as HTMLSelectElement
      ).value,
    ).toBe("bronze");
    const input = controls.getByRole("button", { name: "Material: surface input (color)" });
    const description = document.getElementById(input.getAttribute("aria-describedby")!)!;
    expect(description.textContent).toBe("Connected from Palette: Bronze (color).");
    const html = renderToString(<Connections defaultValue={[{ from: "bronze", to: "surface" }]} />);
    expect(html).toContain("Palette");
    expect(html).toContain("Connected from bronze.");
  });

  it("connects with separate clicks, replaces one input, and preserves output fanout", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Connections onChange={onChange} />);
    const controls = within(container);
    const bronze = controls.getByRole("button", { name: "Palette: Bronze output (color)" });
    fireClick(bronze);
    fireClick(controls.getByRole("button", { name: "Material: surface input (color)" }));
    fireClick(bronze);
    fireClick(controls.getByRole("button", { name: "Material: accent input (color)" }));
    expect(onChange).toHaveBeenLastCalledWith([
      { from: "bronze", to: "surface" },
      { from: "bronze", to: "accent" },
    ]);
    await user.selectOptions(
      controls.getByRole("combobox", { name: "Material: surface source (color)" }),
      "jade",
    );
    expect(onChange).toHaveBeenLastCalledWith([
      { from: "bronze", to: "accent" },
      { from: "jade", to: "surface" },
    ]);
  });

  it("offers only matching enabled sources from other cards", () => {
    const onChange = vi.fn();
    const { container } = render(<Connections onChange={onChange} />);
    const controls = within(container);
    const select = controls.getByRole("combobox", { name: "Material: surface source (color)" });
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Not connected", "Palette: Bronze (color)", "Palette: Jade (color)"]);
    expect(
      within(
        controls.getByRole("combobox", { name: "Palette: Local source (color)" }),
      ).getAllByRole("option"),
    ).toHaveLength(1);
    fireClick(controls.getByRole("button", { name: "Palette: Size output (number)" }));
    fireClick(controls.getByRole("button", { name: "Material: surface input (color)" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disconnects through a native selector or button and keeps focus on an enabled control", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Connections
        defaultValue={[
          { from: "bronze", to: "surface" },
          { from: "bronze", to: "accent" },
        ]}
      />,
    );
    const controls = within(container);
    const surface = controls.getByRole("combobox", {
      name: "Material: surface source (color)",
    }) as HTMLSelectElement;
    fireClick(controls.getByRole("button", { name: "Disconnect Material: surface" }));
    expect(surface.value).toBe("");
    expect(document.activeElement).toBe(surface);
    const accent = controls.getByRole("combobox", {
      name: "Material: accent source (color)",
    }) as HTMLSelectElement;
    await user.selectOptions(accent, "");
    expect(accent.value).toBe("");
    expect(
      (controls.getByRole("button", { name: "Disconnect Material: accent" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("cancels selection with Escape and leaves native control arrow keys alone", async () => {
    const user = userEvent.setup();
    const { container } = render(<Connections />);
    const controls = within(container);
    const output = controls.getByRole("button", { name: "Palette: Bronze output (color)" });
    fireClick(output);
    act(() => controls.getByRole("button", { name: "Material: surface input (color)" }).focus());
    await user.keyboard("{Escape}");
    expect(document.activeElement).toBe(output);
    expect(output.getAttribute("aria-pressed")).toBe("false");
    const palette = controls.getByRole("group", { name: "Palette" });
    const material = controls.getByRole("group", { name: "Material" });
    act(() => palette.focus());
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(material);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(palette);
    const select = controls.getByRole("combobox", { name: "Material: surface source (color)" });
    act(() => select.focus());
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(select);
  });

  it("keeps controlled connections until the owner accepts a proposal", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const original = [{ from: "bronze", to: "surface" }];
    const { container, rerender } = render(<Connections value={original} onChange={onChange} />);
    const select = within(container).getByRole("combobox", {
      name: "Material: surface source (color)",
    }) as HTMLSelectElement;
    await user.selectOptions(select, "jade");
    expect(onChange).toHaveBeenLastCalledWith([{ from: "jade", to: "surface" }]);
    expect(select.value).toBe("bronze");
    rerender(<Connections value={[{ from: "jade", to: "surface" }]} onChange={onChange} />);
    expect(select.value).toBe("jade");
  });

  it("does not restore a pending selection when a removed output returns", () => {
    const { container, rerender } = render(<Connections />);
    const controls = within(container);
    fireClick(controls.getByRole("button", { name: "Palette: Bronze output (color)" }));
    rerender(<Connections showBronze={false} />);
    expect(controls.queryByRole("button", { name: "Palette: Bronze output (color)" })).toBeNull();
    rerender(<Connections />);
    expect(
      controls
        .getByRole("button", { name: "Palette: Bronze output (color)" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("rejects ambiguous input state with the offending connection", () => {
    expect(() =>
      render(
        <Connections
          defaultValue={[
            { from: "bronze", to: "surface" },
            { from: "jade", to: "surface" },
          ]}
        />,
      ),
    ).toThrow('received {"from":"jade","to":"surface"}');
  });

  it("disables every port when its card is disabled", () => {
    const { container } = render(
      <Connect>
        <ConnectCard value="disabled" label="Disabled" disabled>
          <ConnectOutput value="source" label="Source" kind="color" />
          <ConnectInput value="target" label="Target" kind="color">
            <ConnectInputSelect />
            <ConnectInputTrigger />
            <ConnectDisconnect />
          </ConnectInput>
        </ConnectCard>
      </Connect>,
    );
    expect(
      Array.from(container.querySelectorAll("button, select")).every((control) =>
        control.hasAttribute("disabled"),
      ),
    ).toBe(true);
  });
});
