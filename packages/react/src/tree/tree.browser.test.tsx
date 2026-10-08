import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { expectNoAxeViolations } from "../../test/axe.js";
import { Tree } from "./Tree.js";
import { TreeGroup } from "./TreeGroup.js";
import { TreeItem } from "./TreeItem.js";

describe("tree browser accessibility", () => {
  it("has no axe violations with branches expanded and an item selected", async () => {
    const { container, unmount } = render(
      <Tree aria-label="Project files" defaultOpen={["src"]}>
        <TreeItem value="src" textValue="src">
          src
          <TreeGroup>
            <TreeItem value="components" textValue="components">
              components
              <TreeGroup>
                <TreeItem value="button">Button.tsx</TreeItem>
              </TreeGroup>
            </TreeItem>
            <TreeItem value="index">index.ts</TreeItem>
          </TreeGroup>
        </TreeItem>
        <TreeItem value="readme">README.md</TreeItem>
      </Tree>,
    );

    await act(async () => userEvent.click(page.getByRole("treeitem", { name: "src" }).first()));
    await act(async () => userEvent.keyboard("{ArrowDown}{ArrowRight}{ArrowRight}{Enter}"));
    expect(container.querySelector("[aria-selected='true']")?.textContent).toContain("Button.tsx");
    expect(container.querySelector("[aria-expanded='true'] [aria-expanded='true']")).not.toBeNull();

    await expectNoAxeViolations(container, "expanded tree");
    unmount();
  });
});
