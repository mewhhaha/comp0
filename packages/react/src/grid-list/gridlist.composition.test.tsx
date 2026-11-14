import { act, Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
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

  it("advances from the focused row when a controlled value rejects every change", async () => {
    const { container, user, unmount } = setup(
      <GridList aria-label="Files" value="report">
        <GridListItem value="report">report.pdf</GridListItem>
        <GridListItem value="notes">notes.txt</GridListItem>
        <GridListItem value="photo">photo.png</GridListItem>
      </GridList>,
    );
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.tab();
    expect(document.activeElement).toBe(rows[0]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[1]);
    expect(rows[1]!.tabIndex).toBe(0);
    expect(rows[0]!.tabIndex).toBe(-1);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[2]);
    expect(rows[2]!.tabIndex).toBe(0);
    expect(rows[1]!.tabIndex).toBe(-1);
    unmount();
  });

  it("stops at the last row and moves with Home and End", async () => {
    const { rows, user, unmount } = renderGridList();

    await user.tab();
    expect(document.activeElement).toBe(rows[0]);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(rows[2]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(rows[2]);
    expect(rows[2]!.tabIndex).toBe(0);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(rows[0]);
    expect(rows[0]!.tabIndex).toBe(0);
    unmount();
  });

  it("keeps no tab stop when every row is disabled and none when the grid is empty", () => {
    const { container, unmount } = render(
      <GridList aria-label="Files">
        <GridListItem value="report" disabled>
          report.pdf
        </GridListItem>
        <GridListItem value="notes" disabled>
          notes.txt
        </GridListItem>
      </GridList>,
    );
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");
    expect([...rows].map((row) => row.hasAttribute("tabindex"))).toEqual([false, false]);
    unmount();

    const empty = render(<GridList aria-label="Files" value="missing" />);
    expect(empty.container.querySelector("[role='grid']")).toBeTruthy();
    empty.unmount();
  });

  it("keeps one stop on the first enabled row when the controlled value names no row", () => {
    const { container, unmount } = render(
      <GridList aria-label="Files" value="missing">
        <GridListItem value="report">report.pdf</GridListItem>
        <GridListItem value="photo">photo.png</GridListItem>
      </GridList>,
    );
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");
    expect([...rows].map((row) => row.tabIndex)).toEqual([0, -1]);
    unmount();
  });

  it("moves the stop to the first enabled row when the focused row unmounts", async () => {
    const list = (values: string[]) => (
      <GridList aria-label="Files">
        {values.map((value) => (
          <GridListItem key={value} value={value}>
            {value}
          </GridListItem>
        ))}
      </GridList>
    );
    const { container, rerender, user, unmount } = setup(list(["report", "notes", "photo"]));
    const rows = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.click(rows[1]!);
    expect(document.activeElement).toBe(rows[1]);
    rerender(list(["report", "photo"]));
    const stops = container.querySelectorAll<HTMLElement>("[role='row'][tabindex='0']");
    expect([...stops].map((row) => row.dataset["value"])).toEqual(["report"]);
    unmount();
  });

  it("moves the stop when the row holding it changes its value", () => {
    const list = (second: string) => (
      <GridList aria-label="Files" defaultValue="notes">
        <GridListItem value="report">report.pdf</GridListItem>
        <GridListItem value={second}>{second}</GridListItem>
        <GridListItem value="photo">photo.png</GridListItem>
      </GridList>
    );
    const { container, rerender, unmount } = render(list("notes"));
    rerender(list("memo"));
    const stops = container.querySelectorAll<HTMLElement>("[role='row'][tabindex='0']");
    expect([...stops].map((row) => row.dataset["value"])).toEqual(["report"]);
    unmount();
  });
});
