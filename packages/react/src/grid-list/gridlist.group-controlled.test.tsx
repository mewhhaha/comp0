import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import {
  ControlledGroupedLists,
  PendingControlledGroupedLists,
  press,
} from "../../test/grid-list-fixtures.js";
import {} from "./GridListReorderGroup.js";

describe("grid list controlled moves", () => {
  it("announces and focuses a controlled move only after its order is accepted", async () => {
    const changed = vi.fn();
    const initial = { todo: ["design"], done: [] as string[] };
    const accepted = { todo: [] as string[], done: ["design"] };
    const { container, rerender, user } = setup(
      <PendingControlledGroupedLists order={initial} onChange={changed} />,
    );
    const moveButton = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;
    act(() => moveButton.focus());

    await user.click(moveButton);

    expect(changed).toHaveBeenLastCalledWith(
      accepted,
      expect.objectContaining({ value: "design", to: { list: "done", index: 0 } }),
    );
    expect(container.querySelector("[aria-label='To do'] [data-value='design']")).toBeTruthy();
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
    expect(document.activeElement).toBe(moveButton);

    rerender(<PendingControlledGroupedLists order={accepted} onChange={changed} settled />);

    const movedRow = container.querySelector<HTMLElement>(
      "[aria-label='Done'] [data-value='design']",
    )!;
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "Moved design to Done, position 1 of 1.",
    );
    expect(document.activeElement).toBe(movedRow);
    expect(movedRow.tabIndex).toBe(0);

    const outside = container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => outside.focus());
    rerender(
      <PendingControlledGroupedLists
        order={accepted}
        onChange={changed}
        settled
        showDone={false}
      />,
    );
    rerender(<PendingControlledGroupedLists order={accepted} onChange={changed} settled />);
    expect(document.activeElement).toBe(outside);
  });

  it("unlocks silently when the controlled owner rejects a move", async () => {
    const changed = vi.fn();
    const order = { todo: ["design"], done: [] as string[] };
    const { container, user } = setup(<ControlledGroupedLists order={order} onChange={changed} />);
    const moveButton = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;
    act(() => moveButton.focus());

    await user.click(moveButton);

    expect(changed).toHaveBeenCalledTimes(1);
    expect(moveButton.disabled).toBe(false);
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
    expect(document.activeElement).toBe(moveButton);

    await user.click(moveButton);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("blocks a second controlled move until the first proposal is acknowledged", async () => {
    const changed = vi.fn();
    const initial = { todo: ["design", "build"], done: [] as string[] };
    const afterDesign = { todo: ["build"], done: ["design"] };
    const afterBuild = { todo: [] as string[], done: ["design", "build"] };
    const { container, rerender, user } = setup(
      <PendingControlledGroupedLists order={initial} onChange={changed} />,
    );

    await user.click(
      container.querySelector("[data-value='design'] [data-slot='grid-list-move-button']")!,
    );
    const pendingButton = container.querySelector<HTMLButtonElement>(
      "[data-value='build'] [data-slot='grid-list-move-button']",
    )!;
    expect(pendingButton.disabled).toBe(true);
    await user.click(pendingButton);
    expect(changed).toHaveBeenCalledTimes(1);

    rerender(<PendingControlledGroupedLists order={afterDesign} onChange={changed} settled />);
    const acknowledgedButton = container.querySelector<HTMLButtonElement>(
      "[data-value='build'] [data-slot='grid-list-move-button']",
    )!;
    expect(acknowledgedButton.disabled).toBe(false);
    await user.click(acknowledgedButton);
    expect(changed).toHaveBeenLastCalledWith(
      afterBuild,
      expect.objectContaining({ value: "build", from: { list: "todo", index: 0 } }),
    );
  });

  it("keeps waiting across equivalent orders and unlocks after an asynchronous rejection", async () => {
    const changed = vi.fn();
    const initial = { todo: ["design"], done: [] as string[] };
    const equivalent = { todo: ["design"], done: [] as string[] };
    const { container, rerender, user } = setup(
      <PendingControlledGroupedLists order={initial} onChange={changed} />,
    );
    let moveButton = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;

    await user.click(moveButton);
    rerender(<PendingControlledGroupedLists order={equivalent} onChange={changed} />);

    moveButton = container.querySelector<HTMLButtonElement>("[data-slot='grid-list-move-button']")!;
    expect(moveButton.disabled).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");

    rerender(<PendingControlledGroupedLists order={equivalent} onChange={changed} settled />);
    moveButton = container.querySelector<HTMLButtonElement>("[data-slot='grid-list-move-button']")!;
    expect(moveButton.disabled).toBe(false);

    await user.click(moveButton);
    expect(changed).toHaveBeenCalledTimes(2);
  });

  it("clears focus requests that a committed destination cannot service", async () => {
    const initial = { todo: ["design"], done: [] as string[] };
    const accepted = { todo: [] as string[], done: ["design"] };

    const missing = setup(<PendingControlledGroupedLists order={initial} onChange={() => {}} />);
    const missingMoveButton = missing.container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;
    act(() => missingMoveButton.focus());
    await missing.user.click(missingMoveButton);
    missing.rerender(
      <PendingControlledGroupedLists
        order={accepted}
        onChange={() => {}}
        settled
        showDone={false}
      />,
    );
    const missingOutside =
      missing.container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => missingOutside.focus());
    missing.rerender(
      <PendingControlledGroupedLists order={accepted} onChange={() => {}} settled />,
    );
    expect(document.activeElement).toBe(missingOutside);
    missing.unmount();

    const disabled = setup(<PendingControlledGroupedLists order={initial} onChange={() => {}} />);
    const disabledMoveButton = disabled.container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;
    act(() => disabledMoveButton.focus());
    await disabled.user.click(disabledMoveButton);
    disabled.rerender(
      <PendingControlledGroupedLists
        order={accepted}
        onChange={() => {}}
        settled
        disabledValues={["design"]}
      />,
    );
    const disabledOutside =
      disabled.container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => disabledOutside.focus());
    disabled.rerender(
      <PendingControlledGroupedLists order={accepted} onChange={() => {}} settled />,
    );
    expect(document.activeElement).toBe(disabledOutside);
  });

  it("does not steal focus when the user leaves before a controlled move is accepted", async () => {
    const initial = { todo: ["design"], done: [] as string[] };
    const accepted = { todo: [] as string[], done: ["design"] };
    const { container, rerender, user } = setup(
      <PendingControlledGroupedLists order={initial} onChange={() => {}} />,
    );
    const moveButton = container.querySelector<HTMLButtonElement>(
      "[data-slot='grid-list-move-button']",
    )!;
    act(() => moveButton.focus());
    await user.click(moveButton);
    const outside = container.querySelector<HTMLButtonElement>("[data-outside-focus]")!;
    act(() => outside.focus());

    rerender(<PendingControlledGroupedLists order={accepted} onChange={() => {}} settled />);

    expect(document.activeElement).toBe(outside);
  });

  it("skips a move button that becomes disabled after policy changes", async () => {
    const order = { todo: ["design"], done: [] as string[] };
    const allow = () => true;
    const veto = () => false;
    const { container, rerender, user } = setup(
      <ControlledGroupedLists order={order} onChange={() => {}} canMove={allow} />,
    );
    const row = container.querySelector<HTMLElement>("[data-value='design']")!;
    let moveButton = row.querySelector<HTMLButtonElement>("[data-slot='grid-list-move-button']")!;
    expect(moveButton.disabled).toBe(false);

    rerender(<ControlledGroupedLists order={order} onChange={() => {}} canMove={veto} />);
    moveButton = row.querySelector<HTMLButtonElement>("[data-slot='grid-list-move-button']")!;
    expect(moveButton.disabled).toBe(true);

    act(() => row.focus());
    await press(user, row, "{ArrowRight}");
    expect(document.activeElement).toBe(row.querySelector("[data-row-details]"));
  });
});
