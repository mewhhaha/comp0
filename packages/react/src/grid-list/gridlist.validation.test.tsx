import { describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { fireDrag, thrownEvidence } from "../../test/grid-list-fixtures.js";
import { GridList } from "./GridList.js";
import { GridListItem } from "./GridListItem.js";
import { GridListMoveButton } from "./GridListMoveButton.js";
import { GridListReorderGroup } from "./GridListReorderGroup.js";

describe("grid list validation", () => {
  it("rejects duplicate values and ambiguous reorder owners", () => {
    expect(() =>
      render(
        <GridListReorderGroup
          value={{ first: ["duplicate"], second: ["duplicate"] }}
          onChange={() => {}}
        >
          <GridList name="first" aria-label="First" />
          <GridList name="second" aria-label="Second" />
        </GridListReorderGroup>,
      ),
    ).toThrow('GridListReorderGroup value "duplicate" appears in both "first" and "second"');

    const duplicateItemEvidence = thrownEvidence(() => {
      render(
        <GridList aria-label="Files">
          <GridListItem value="duplicate">First</GridListItem>
          <GridListItem value="duplicate">Second</GridListItem>
        </GridList>,
      );
    });
    expect(duplicateItemEvidence).toContain(
      'GridListItem value "duplicate" is rendered more than once inside GridList.',
    );

    const duplicateOwnerEvidence = thrownEvidence(() =>
      render(
        <GridListReorderGroup value={{ first: ["duplicate"], second: [] }} onChange={() => {}}>
          <GridList name="first" aria-label="First">
            <GridListItem value="duplicate">First owner</GridListItem>
          </GridList>
          <GridList name="second" aria-label="Second">
            <GridListItem value="duplicate">Second owner</GridListItem>
          </GridList>
        </GridListReorderGroup>,
      ),
    );
    expect(duplicateOwnerEvidence).toContain(
      'GridListItem value "duplicate" is rendered more than once inside GridListReorderGroup (in "first" and "second").',
    );

    expect(() =>
      render(
        <GridListReorderGroup value={{ first: [] }} onChange={() => {}}>
          <GridList name="first" aria-label="First" onReorder={() => {}} />
        </GridListReorderGroup>,
      ),
    ).toThrow('GridList "first" cannot use onReorder or canReorder');

    const duplicateListEvidence = thrownEvidence(() =>
      render(
        <GridListReorderGroup value={{ first: [] }} onChange={() => {}}>
          <GridList name="first" aria-label="First copy" />
          <GridList name="first" aria-label="Second copy" />
        </GridListReorderGroup>,
      ),
    );
    expect(duplicateListEvidence).toContain(
      'GridList name "first" is rendered more than once inside GridListReorderGroup.',
    );
  });

  it("warns and renders no move button for a destination missing from the group", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      const { container } = render(
        <GridListReorderGroup value={{ first: ["row"] }} onChange={() => {}}>
          <GridList name="first" aria-label="First">
            <GridListItem value="row">
              Row
              <GridListMoveButton to="missing-destination" />
            </GridListItem>
          </GridList>
        </GridListReorderGroup>,
      );
      expect(container.querySelector("[data-slot='grid-list-move-button']")).toBeNull();
      expect(container.querySelector("[data-value='row']")).toBeTruthy();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'GridListMoveButton destination "missing-destination" is missing from GridListReorderGroup.value. It was not rendered.',
        ),
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("warns and ignores a drag of a row absent from the group value", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const spy = vi.fn();
    try {
      const { container } = render(
        <GridListReorderGroup value={{ first: [], second: [] }} onChange={spy}>
          <GridList name="first" aria-label="First">
            <GridListItem value="stray-row">Stray</GridListItem>
          </GridList>
          <GridList name="second" aria-label="Second" />
        </GridListReorderGroup>,
      );
      const row = container.querySelector<HTMLElement>("[data-value='stray-row']")!;
      fireDrag(row, "dragstart");
      expect(row.hasAttribute("data-dragging")).toBe(false);
      expect(spy).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining(
          'GridList "first" cannot move row "stray-row" because it is absent from GridListReorderGroup.value. The drag was ignored.',
        ),
      );
    } finally {
      consoleError.mockRestore();
    }
  });
});
