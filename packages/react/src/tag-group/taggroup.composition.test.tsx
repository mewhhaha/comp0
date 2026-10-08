import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Label } from "../field/Label.js";
import { Tag } from "./Tag.js";
import { TagGroup } from "./TagGroup.js";
import { TagList } from "./TagList.js";

async function press(user: ReturnType<typeof setup>["user"], element: HTMLElement, keys: string) {
  if (document.activeElement !== element) act(() => element.focus());
  await user.keyboard(keys);
}

function renderTags(overrides: { onRemove?: (value: string) => void } = {}) {
  const onChange = vi.fn();
  const result = setup(
    <TagGroup defaultValue={["news"]} onChange={onChange} {...overrides}>
      <Label>Filters</Label>
      <TagList>
        <Tag value="news">
          News <button type="button">Remove news</button>
        </Tag>
        <Tag value="sports">
          Sports <button type="button">Remove sports</button>
        </Tag>
        <Tag value="arts">Arts</Tag>
      </TagList>
    </TagGroup>,
  );
  const tags = [...result.container.querySelectorAll<HTMLElement>("[role='row']")];
  return { ...result, onChange, tags };
}

describe("tag group composition", () => {
  it("requires TagList inside TagGroup and tags inside TagList", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<TagList />)).toThrow("TagList must be rendered inside TagGroup.");
      expect(() => render(<Tag value="news">News</Tag>)).toThrow(
        "Tag must be rendered inside TagList.",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("renders the list and tags as the elements given to as", () => {
    const { container } = render(
      <TagGroup as="section" className="tags">
        <TagList as="ul" aria-label="Filters">
          <Tag as="li" value="news">
            News
          </Tag>
        </TagList>
      </TagGroup>,
    );
    expect(container.querySelector("section.tags")).toBeTruthy();
    expect(container.querySelector("ul")!.getAttribute("role")).toBe("grid");
    expect(container.querySelector("li")!.getAttribute("role")).toBe("row");
  });

  it("renders a labelled grid of tag rows with one tab stop and hidden remove buttons", () => {
    const { container, tags } = renderTags();
    const grid = container.querySelector<HTMLElement>("[role='grid']")!;
    const label = container.querySelector<HTMLLabelElement>("label")!;
    expect(label.textContent).toBe("Filters");
    expect(grid.id).toBe(label.htmlFor);
    expect(grid.getAttribute("aria-labelledby")).toBe(label.id);
    expect(tags).toHaveLength(3);
    expect(tags[0]!.tabIndex).toBe(0);
    expect(tags[1]!.tabIndex).toBe(-1);
    expect(tags[0]!.dataset["selected"]).toBe("");
    for (const button of container.querySelectorAll("button")) {
      expect(button.tabIndex).toBe(-1);
    }
  });

  it("roves horizontally and toggles selection with Space", async () => {
    const { onChange, tags, user } = renderTags();
    tags[0]!.focus();
    await press(user, tags[0]!, "{ArrowRight}");
    expect(document.activeElement).toBe(tags[1]);
    await press(user, tags[1]!, " ");
    expect(onChange).toHaveBeenLastCalledWith(["news", "sports"]);
    await press(user, tags[1]!, "{End}");
    expect(document.activeElement).toBe(tags[2]);
    await press(user, tags[2]!, "{Home}");
    expect(document.activeElement).toBe(tags[0]);
    await press(user, tags[0]!, " ");
    expect(onChange).toHaveBeenLastCalledWith(["sports"]);
  });

  it("removes with Delete and moves focus to a neighbor", async () => {
    const onRemove = vi.fn();
    const { tags, user } = renderTags({ onRemove });
    tags[0]!.focus();
    await press(user, tags[0]!, "{Delete}");
    expect(onRemove).toHaveBeenLastCalledWith("news");
    expect(document.activeElement).toBe(tags[1]);
  });

  it("moves focus to the grid when removing its only tag", async () => {
    const onRemove = vi.fn();
    const { container, user } = setup(
      <TagGroup onRemove={onRemove}>
        <TagList aria-label="Filters">
          <Tag value="news">News</Tag>
        </TagList>
      </TagGroup>,
    );
    const grid = container.querySelector<HTMLElement>("[role='grid']")!;
    const tag = container.querySelector<HTMLElement>("[role='row']")!;
    tag.focus();

    await press(user, tag, "{Delete}");

    expect(onRemove).toHaveBeenLastCalledWith("news");
    expect(document.activeElement).toBe(grid);
  });

  it("selects on tag click but not when clicking a control inside", async () => {
    const { onChange, tags, user } = renderTags();
    await user.click(tags[1]!);
    expect(onChange).toHaveBeenLastCalledWith(["news", "sports"]);
    onChange.mockClear();
    await user.click(tags[0]!.querySelector("button")!);
    expect(onChange).not.toHaveBeenCalled();
  });
});
