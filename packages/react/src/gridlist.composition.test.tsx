import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { GridList } from "./components/GridList.js";
import { GridListItem } from "./components/GridListItem.js";

function renderGridList(onChange = vi.fn()) {
  const result = render(
    <GridList aria-label="Files" onChange={onChange}>
      <GridListItem value="report">
        report.pdf <button type="button">Share</button> <button type="button">Delete</button>
      </GridListItem>
      <GridListItem value="notes" disabled>
        notes.txt
      </GridListItem>
      <GridListItem value="photo">photo.png</GridListItem>
    </GridList>,
  );
  const rows = result.container.querySelectorAll<HTMLElement>("[role='row']");
  return { ...result, onChange, rows };
}

describe("grid list composition", () => {
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

  it("moves row focus with arrows, skipping disabled rows", () => {
    const { rows } = renderGridList();
    rows[0]!.focus();
    fireKeyDown(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(rows[2]);
    fireKeyDown(document.activeElement!, "ArrowUp");
    expect(document.activeElement).toBe(rows[0]);
    fireKeyDown(document.activeElement!, "End");
    expect(document.activeElement).toBe(rows[2]);
    fireKeyDown(document.activeElement!, "Home");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("steps into and out of a row's interactive children with left and right", () => {
    const { rows } = renderGridList();
    const buttons = rows[0]!.querySelectorAll("button");
    rows[0]!.focus();
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(buttons[1]);
    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(buttons[0]);
    fireKeyDown(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(rows[0]);
  });

  it("selects a focused row with Enter and click, but not via child actions", () => {
    const { onChange, rows } = renderGridList();
    rows[0]!.focus();
    fireKeyDown(document.activeElement!, "Enter");
    expect(onChange).toHaveBeenLastCalledWith("report");
    expect(rows[0]!.dataset["selected"]).toBe("");
    expect(rows[0]!.getAttribute("aria-selected")).toBe("true");

    fireClick(rows[2]!);
    expect(onChange).toHaveBeenLastCalledWith("photo");

    onChange.mockClear();
    fireClick(rows[0]!.querySelector("button")!);
    expect(onChange).not.toHaveBeenCalled();
  });
});
