import { act, useState } from "react";
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

  function RemovableTags({
    initial,
    disabled = [],
    onTags,
  }: {
    initial: string[];
    disabled?: string[];
    onTags?: (set: (tags: string[]) => void) => void;
  }) {
    const [tags, setTags] = useState(initial);
    onTags?.(setTags);
    const remove = (value: string) => setTags((current) => current.filter((tag) => tag !== value));
    return (
      <TagGroup onRemove={remove}>
        <TagList aria-label="Filters">
          {tags.map((tag) => (
            <Tag key={tag} value={tag} disabled={disabled.includes(tag)}>
              {tag}{" "}
              <button type="button" onClick={() => remove(tag)}>
                Remove {tag}
              </button>
            </Tag>
          ))}
        </TagList>
      </TagGroup>
    );
  }

  const screenButton = (container: HTMLElement, name: string) =>
    [...container.querySelectorAll<HTMLElement>("button")].find(
      (button) => button.textContent === name,
    )!;

  const stops = (container: HTMLElement) =>
    [...container.querySelectorAll<HTMLElement>("[role='row'][tabindex='0']")].map(
      (tag) => tag.dataset["value"],
    );

  it("hands the stop to the next tag when the stop is removed", async () => {
    const { container, user } = setup(<RemovableTags initial={["news", "sports", "arts"]} />);
    const tags = [...container.querySelectorAll<HTMLElement>("[role='row']")];

    await press(user, tags[1]!, "{Delete}");

    expect(stops(container)).toEqual(["arts"]);
    expect(document.activeElement).toBe(tags[2]);
  });

  it("hands the stop to the previous tag when the last tag is removed", async () => {
    const { container, user } = setup(<RemovableTags initial={["news", "sports", "arts"]} />);
    const tags = [...container.querySelectorAll<HTMLElement>("[role='row']")];

    await press(user, tags[2]!, "{Backspace}");

    expect(stops(container)).toEqual(["sports"]);
    expect(document.activeElement).toBe(tags[1]);
  });

  it("hands the stop to the first enabled tag when its remove control removes the stop", async () => {
    const { container, user } = setup(
      <RemovableTags initial={["news", "sports", "arts"]} disabled={["news"]} />,
    );

    // Clicking the control focuses it, which records its tag as the stop; removing that tag
    // takes focus with it, so no key handler picks a neighbor and the stop falls back past the
    // disabled first tag.
    await user.click(screenButton(container, "Remove arts"));

    expect(stops(container)).toEqual(["sports"]);
  });

  it("does not hand the stop back to a removed tag that returns", async () => {
    let setTags: (tags: string[]) => void = () => {};
    const { container, user } = setup(
      <RemovableTags
        initial={["news", "sports", "arts"]}
        onTags={(set) => {
          setTags = set;
        }}
      />,
    );
    const tags = [...container.querySelectorAll<HTMLElement>("[role='row']")];

    act(() => tags[1]!.focus());
    expect(stops(container)).toEqual(["sports"]);
    await user.click(screenButton(container, "Remove sports"));
    expect(stops(container)).toEqual(["news"]);

    act(() => setTags(["news", "arts", "sports"]));
    expect(stops(container)).toEqual(["news"]);
  });

  it("keeps the stop on a tag whose element changes", async () => {
    const list = (as: "div" | "span") => (
      <TagGroup>
        <TagList aria-label="Filters">
          <Tag value="news">News</Tag>
          <Tag value="sports" as={as}>
            Sports
          </Tag>
        </TagList>
      </TagGroup>
    );
    const { container, rerender } = setup(list("div"));

    act(() => container.querySelectorAll<HTMLElement>("[role='row']")[1]!.focus());
    rerender(list("span"));
    await act(async () => {});

    expect(stops(container)).toEqual(["sports"]);
  });

  it("skips a disabled neighbor when Delete removes the stop", async () => {
    const { container, user } = setup(
      <RemovableTags initial={["news", "sports", "arts"]} disabled={["sports"]} />,
    );
    const tags = [...container.querySelectorAll<HTMLElement>("[role='row']")];

    await press(user, tags[0]!, "{Delete}");

    expect(document.activeElement).toBe(tags[2]);
    expect(stops(container)).toEqual(["arts"]);
  });

  it("does not remove a disabled tag with Delete from a control inside it", async () => {
    const { container, user } = setup(
      <RemovableTags initial={["news", "sports"]} disabled={["sports"]} />,
    );
    const control = screenButton(container, "Remove sports");

    await press(user, control, "{Delete}");

    expect(container.querySelectorAll("[role='row']")).toHaveLength(2);
  });

  it("moves the stop to a tag focused from outside the list", async () => {
    const { container, tags, user } = renderTags();
    const after = document.createElement("button");
    container.append(after);

    act(() => tags[2]!.focus());
    expect(stops(container)).toEqual(["arts"]);
    await user.click(after);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(tags[2]);
  });

  it("roves in the reading direction of a right-to-left list and skips disabled tags", async () => {
    const { container, user } = setup(
      <div dir="rtl">
        <TagGroup>
          <TagList aria-label="Filters">
            <Tag value="news">News</Tag>
            <Tag value="sports" disabled>
              Sports
            </Tag>
            <Tag value="arts">Arts</Tag>
          </TagList>
        </TagGroup>
      </div>,
    );
    const tags = [...container.querySelectorAll<HTMLElement>("[role='row']")];

    await press(user, tags[0]!, "{ArrowLeft}");
    expect(document.activeElement).toBe(tags[2]);
    expect(stops(container)).toEqual(["arts"]);
    expect(tags[1]!.hasAttribute("tabindex")).toBe(false);
    await press(user, tags[2]!, "{ArrowRight}");
    expect(document.activeElement).toBe(tags[0]);
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
