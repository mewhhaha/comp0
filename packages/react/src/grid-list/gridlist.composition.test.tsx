import { act, Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { press, renderGridList } from "../../test/grid-list-fixtures.js";
import { GridList } from "./GridList.js";
import { GridListItem } from "./GridListItem.js";
import {} from "./GridListReorderGroup.js";

describe("grid list composition", () => {
  it("renders the grid and its rows as the elements given to as", () => {
    const { container } = render(
      <GridList as="ul" aria-label="Files">
        <GridListItem as="li" value="report">
          report.pdf
        </GridListItem>
      </GridList>,
    );
    const grid = container.querySelector("ul")!;
    expect(grid.getAttribute("role")).toBe("grid");
    expect(grid.querySelector("li")!.getAttribute("role")).toBe("row");
  });

  it("merges a row into its single child with as={Fragment}", () => {
    const { container } = render(
      <GridList aria-label="Files">
        <GridListItem as={Fragment} value="report">
          <article>report.pdf</article>
        </GridListItem>
      </GridList>,
    );
    const row = container.querySelector("article")!;
    expect(row.getAttribute("role")).toBe("row");
    expect(row.tabIndex).toBe(0);
  });

  it("requires rows inside a GridList", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<GridListItem value="report">report.pdf</GridListItem>)).toThrow(
        "GridListItem must be rendered inside GridList.",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("renders a grid of rows with gridcells and one tab stop", () => {
    const { container, rows } = renderGridList();
    expect(container.querySelector("[role='grid']")).toBeTruthy();
    expect(rows).toHaveLength(3);
    expect(container.querySelectorAll("[role='gridcell']")).toHaveLength(3);
    expect(rows[0]!.tabIndex).toBe(0);
    expect(rows[2]!.tabIndex).toBe(-1);
    for (const button of container.querySelectorAll("button")) {
      expect(button.tabIndex).toBe(-1);
    }
  });

  it("moves row focus with arrows, skipping disabled rows", async () => {
    const { rows, user } = renderGridList();
    rows[0]!.focus();
    await press(user, document.activeElement!, "{ArrowDown}");
    expect(document.activeElement).toBe(rows[2]);
    await press(user, document.activeElement!, "{ArrowUp}");
    expect(document.activeElement).toBe(rows[0]);
    await press(user, document.activeElement!, "{End}");
    expect(document.activeElement).toBe(rows[2]);
    await press(user, document.activeElement!, "{Home}");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("steps into and out of a row's interactive children with left and right", async () => {
    const { rows, user } = renderGridList();
    const buttons = rows[0]!.querySelectorAll("button");
    rows[0]!.focus();
    await press(user, document.activeElement!, "{ArrowRight}");
    expect(document.activeElement).toBe(buttons[0]);
    await press(user, document.activeElement!, "{ArrowRight}");
    expect(document.activeElement).toBe(buttons[1]);
    await press(user, document.activeElement!, "{ArrowLeft}");
    expect(document.activeElement).toBe(buttons[0]);
    await press(user, document.activeElement!, "{ArrowLeft}");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("mirrors row entry and exit arrows in right-to-left layouts", async () => {
    const { container, rows, user } = renderGridList();
    const buttons = rows[0]!.querySelectorAll("button");
    container.querySelector<HTMLElement>("[role='grid']")!.style.direction = "rtl";
    rows[0]!.focus();

    await press(user, rows[0]!, "{ArrowLeft}");
    expect(document.activeElement).toBe(buttons[0]);
    await press(user, buttons[0]!, "{ArrowRight}");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("keeps row navigation and child actions in the grid's owning document", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const onChange = vi.fn();
    const { rows, unmount, user } = renderGridList(onChange, frameDocument);
    const share = rows[0]!.querySelector("button")!;

    act(() => rows[0]!.focus());
    await user.keyboard("{ArrowDown}");
    expect(frameDocument.activeElement).toBe(rows[2]);

    await user.click(share);
    expect(onChange).not.toHaveBeenCalled();

    unmount();
    frame.remove();
  });

  it("selects a focused row with Enter and click, but not via child actions", async () => {
    const { onChange, rows, user } = renderGridList();
    rows[0]!.focus();
    await press(user, document.activeElement!, "{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("report");
    expect(rows[0]!.dataset["selected"]).toBe("");
    expect(rows[0]!.getAttribute("aria-selected")).toBe("true");

    await user.click(rows[2]!);
    expect(onChange).toHaveBeenLastCalledWith("photo");

    onChange.mockClear();
    await user.click(rows[0]!.querySelector("button")!);
    expect(onChange).not.toHaveBeenCalled();
  });
});
