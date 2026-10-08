import { act } from "react";
import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { expectNoAxeViolations } from "../../test/axe.js";
import { TreeGrid } from "./TreeGrid.js";
import { TreeGridCell } from "./TreeGridCell.js";
import { TreeGridColumn } from "./TreeGridColumn.js";
import { TreeGridRow } from "./TreeGridRow.js";
import { TreeGridRowGroup } from "./TreeGridRowGroup.js";

describe("tree grid browser accessibility", () => {
  it("has no axe violations with rows expanded, one selected, and a cell focused", async () => {
    const { container, unmount } = render(
      <TreeGrid aria-label="Project files" defaultOpen={["src"]}>
        <TreeGridRowGroup as="thead">
          <TreeGridRow>
            <TreeGridColumn>Name</TreeGridColumn>
            <TreeGridColumn>Kind</TreeGridColumn>
          </TreeGridRow>
        </TreeGridRowGroup>
        <TreeGridRowGroup>
          <TreeGridRow value="src">
            <TreeGridCell>src</TreeGridCell>
            <TreeGridCell>Folder</TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="components" parentValue="src">
            <TreeGridCell>components</TreeGridCell>
            <TreeGridCell>Folder</TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="readme">
            <TreeGridCell>README.md</TreeGridCell>
            <TreeGridCell>File</TreeGridCell>
          </TreeGridRow>
        </TreeGridRowGroup>
      </TreeGrid>,
    );

    const src = container.querySelector<HTMLElement>("tr[data-value='src']")!;
    act(() => src.focus());
    await act(async () => userEvent.keyboard("{ArrowDown}{Enter}{ArrowRight}"));
    expect(container.querySelector("tr[aria-selected='true']")?.getAttribute("data-value")).toBe(
      "components",
    );
    expect(src.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement?.tagName).toBe("TD");

    await expectNoAxeViolations(container, "expanded tree grid");
    unmount();
  });
});
