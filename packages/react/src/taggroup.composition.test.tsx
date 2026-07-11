import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { Tag } from "./components/Tag.js";
import { TagGroup } from "./components/TagGroup.js";

function renderTags(overrides: { onRemove?: (value: string) => void } = {}) {
  const onChange = vi.fn();
  const result = render(
    <TagGroup aria-label="Filters" defaultValue={["news"]} onChange={onChange} {...overrides}>
      <Tag value="news">
        News <button type="button">Remove news</button>
      </Tag>
      <Tag value="sports">
        Sports <button type="button">Remove sports</button>
      </Tag>
      <Tag value="arts">Arts</Tag>
    </TagGroup>,
  );
  const tags = [...result.container.querySelectorAll<HTMLElement>("[role='row']")];
  return { ...result, onChange, tags };
}

describe("tag group composition", () => {
  it("renders a grid of tag rows with one tab stop and hidden remove buttons", () => {
    const { container, tags } = renderTags();
    expect(container.querySelector("[role='grid']")).toBeTruthy();
    expect(tags).toHaveLength(3);
    expect(tags[0]!.tabIndex).toBe(0);
    expect(tags[1]!.tabIndex).toBe(-1);
    expect(tags[0]!.dataset["selected"]).toBe("");
    for (const button of container.querySelectorAll("button")) {
      expect(button.tabIndex).toBe(-1);
    }
  });

  it("roves horizontally and toggles selection with Space", () => {
    const { onChange, tags } = renderTags();
    tags[0]!.focus();
    fireKeyDown(tags[0]!, "ArrowRight");
    expect(document.activeElement).toBe(tags[1]);
    fireKeyDown(tags[1]!, " ");
    expect(onChange).toHaveBeenLastCalledWith(["news", "sports"]);
    fireKeyDown(tags[1]!, "End");
    expect(document.activeElement).toBe(tags[2]);
    fireKeyDown(tags[2]!, "Home");
    expect(document.activeElement).toBe(tags[0]);
    fireKeyDown(tags[0]!, " ");
    expect(onChange).toHaveBeenLastCalledWith(["sports"]);
  });

  it("removes with Delete and moves focus to a neighbor", () => {
    const onRemove = vi.fn();
    const { tags } = renderTags({ onRemove });
    tags[0]!.focus();
    fireKeyDown(tags[0]!, "Delete");
    expect(onRemove).toHaveBeenLastCalledWith("news");
    expect(document.activeElement).toBe(tags[1]);
  });

  it("selects on tag click but not when clicking a control inside", () => {
    const { onChange, tags } = renderTags();
    fireClick(tags[1]!);
    expect(onChange).toHaveBeenLastCalledWith(["news", "sports"]);
    onChange.mockClear();
    fireClick(tags[0]!.querySelector("button")!);
    expect(onChange).not.toHaveBeenCalled();
  });
});
