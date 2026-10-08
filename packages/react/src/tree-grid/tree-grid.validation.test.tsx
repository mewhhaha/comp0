import { describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { TreeGrid } from "./TreeGrid.js";
import { TreeGridCell } from "./TreeGridCell.js";
import { TreeGridRow } from "./TreeGridRow.js";
import { TreeGridRowGroup } from "./TreeGridRowGroup.js";

describe("tree grid hierarchy data validation", () => {
  it("treats a row with a missing parent as a root row and warns once", () => {
    const warnings = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <TreeGrid aria-label="Orphans">
        <TreeGridRowGroup>
          <TreeGridRow value="orphan-row" parentValue="nowhere">
            <TreeGridCell>Orphan</TreeGridCell>
          </TreeGridRow>
        </TreeGridRowGroup>
      </TreeGrid>,
    );

    const row = container.querySelector("tr[data-value='orphan-row']")!;
    expect(row.getAttribute("aria-level")).toBe("1");
    expect(row.hasAttribute("hidden")).toBe(false);
    expect(warnings.mock.calls.map((call) => String(call[0]))).toContainEqual(
      expect.stringContaining('"orphan-row" references missing parentValue "nowhere"'),
    );
    warnings.mockRestore();
  });

  it("breaks a cyclic parentValue chain and warns", () => {
    const warnings = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <TreeGrid aria-label="Cycle" defaultOpen={["cycle-a", "cycle-b"]}>
        <TreeGridRowGroup>
          <TreeGridRow value="cycle-a" parentValue="cycle-b">
            <TreeGridCell>A</TreeGridCell>
          </TreeGridRow>
          <TreeGridRow value="cycle-b" parentValue="cycle-a">
            <TreeGridCell>B</TreeGridCell>
          </TreeGridRow>
        </TreeGridRowGroup>
      </TreeGrid>,
    );

    const levels = [...container.querySelectorAll("tr[data-value]")].map((row) =>
      row.getAttribute("aria-level"),
    );
    expect(levels).toContain("1");
    expect(warnings.mock.calls.map((call) => String(call[0]))).toContainEqual(
      expect.stringContaining("cyclic parentValue chain"),
    );
    warnings.mockRestore();
  });
});
