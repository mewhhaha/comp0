import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { ListBox } from "../list-box/ListBox.js";
import { Tag } from "../tag-group/Tag.js";
import { TagGroup } from "../tag-group/TagGroup.js";
import { TagList } from "../tag-group/TagList.js";
import { TagPicker } from "./TagPicker.js";
import { TagPickerInput } from "./TagPickerInput.js";
import { TagPickerOption } from "./TagPickerOption.js";
import { TextField } from "../text-field/TextField.js";

function Tags({ values }: { values: string[] }) {
  return (
    <TagList aria-label="Selected frameworks">
      {values.map((value) => (
        <Tag key={value} value={value}>
          {value}
        </Tag>
      ))}
    </TagList>
  );
}

function FrameworkPicker({
  value,
  defaultValue,
  onChange,
  name,
  disabled,
}: {
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onChange?: ((value: string[]) => void) | undefined;
  name?: string | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <TagPicker
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      name={name}
      disabled={disabled}
    >
      {({ value: selected }) => (
        <>
          <Tags values={selected} />
          <TextField>
            <TagPickerInput aria-label="Add framework" />
          </TextField>
          <ListBox aria-label="Frameworks">
            <TagPickerOption value="react" textValue="React">
              React
            </TagPickerOption>
            <TagPickerOption value="vue" textValue="Vue">
              Vue
            </TagPickerOption>
          </ListBox>
        </>
      )}
    </TagPicker>
  );
}

describe("tag picker composition", () => {
  it("requires its input and option adapters to be inside TagPicker", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      expect(() => render(<TagPickerInput />)).toThrow(
        "TagPickerInput must be rendered inside TagPicker.",
      );
      expect(() => render(<TagPickerOption value="react">React</TagPickerOption>)).toThrow(
        "TagPickerOption must be rendered inside TagPicker.",
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it("adds a ListBox option once, clears the query, and announces its label", async () => {
    const changed = vi.fn();
    const { container, user } = setup(<FrameworkPicker defaultValue={[]} onChange={changed} />);
    const input = container.querySelector<HTMLInputElement>("input[aria-label='Add framework']")!;

    await user.type(input, "v");
    await user.click(container.querySelector<HTMLElement>("[data-value='vue']")!);

    expect(changed).toHaveBeenLastCalledWith(["vue"]);
    expect(container.querySelectorAll("[role='row']")).toHaveLength(1);
    expect(container.querySelector("[role='row']")?.textContent).toBe("vue");
    expect(container.querySelector("[role='row']")?.hasAttribute("aria-selected")).toBe(false);
    expect(container.querySelector("[role='grid']")?.hasAttribute("aria-multiselectable")).toBe(
      false,
    );
    expect(container.querySelector("[aria-live]")?.textContent).toBe("Added Vue.");
    expect(container.querySelector("[role='option'][data-value='vue']")).toBeNull();
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
  });

  it("hands an empty input back to the last tag so Backspace removes it", async () => {
    const { container, user } = setup(<FrameworkPicker defaultValue={["react", "vue"]} />);
    const input = container.querySelector<HTMLInputElement>("input[aria-label='Add framework']")!;
    const tags = container.querySelectorAll<HTMLElement>("[role='row']");

    await user.click(input);
    await user.keyboard("{Backspace}");
    expect(document.activeElement).toBe(tags[1]);

    await user.keyboard("{Backspace}");
    expect(container.querySelectorAll("[role='row']")).toHaveLength(1);
    expect(document.activeElement).toBe(tags[0]);
    expect(container.querySelector("[aria-live]")?.textContent).toBe("Removed Vue.");
  });

  it("uses the inline-backward arrow to reach the last tag", async () => {
    const { container, user } = setup(<FrameworkPicker defaultValue={["react", "vue"]} />);
    const input = container.querySelector<HTMLInputElement>("input[aria-label='Add framework']")!;
    const tags = container.querySelectorAll<HTMLElement>("[role='row']");
    input.style.direction = "rtl";
    await user.click(input);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(tags[1]);
  });

  it("returns focus to the input when the final tag is removed", async () => {
    const { container, user } = setup(<FrameworkPicker defaultValue={["react"]} />);
    const input = container.querySelector<HTMLInputElement>("input[aria-label='Add framework']")!;
    const tag = container.querySelector<HTMLElement>("[role='row']")!;

    tag.focus();
    await user.keyboard("{Backspace}");

    expect(container.querySelector("[role='row']")).toBeNull();
    expect(document.activeElement).toBe(input);
  });

  it("serializes repeated hidden values and restores uncontrolled state on form reset", async () => {
    const { container, user } = setup(
      <form>
        <FrameworkPicker defaultValue={["react"]} name="framework" />
      </form>,
    );
    const form = container.querySelector("form")!;
    await user.click(container.querySelector<HTMLElement>("[role='option'][data-value='vue']")!);
    expect(new FormData(form).getAll("framework")).toEqual(["react", "vue"]);

    await act(async () => {
      form.reset();
      await Promise.resolve();
    });

    expect(new FormData(form).getAll("framework")).toEqual(["react"]);
    expect(container.querySelectorAll("[role='row']")).toHaveLength(1);
  });

  it("reports controlled additions without rendering a rejected value", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <FrameworkPicker value={["react"]} onChange={changed} name="framework" />,
    );

    await user.click(container.querySelector<HTMLElement>("[role='option'][data-value='vue']")!);

    expect(changed).toHaveBeenLastCalledWith(["react", "vue"]);
    expect(container.querySelectorAll("[role='row']")).toHaveLength(1);
    expect(container.querySelector("[role='option'][data-value='vue']")).not.toBeNull();
  });

  it("disables additions, removals, and successful form controls as one contract", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <form>
        <FrameworkPicker defaultValue={["react"]} onChange={changed} name="framework" disabled />
      </form>,
    );
    const picker = container.querySelector<HTMLElement>("[data-slot='tag-picker']")!;
    const input = container.querySelector<HTMLInputElement>("input[aria-label='Add framework']")!;
    const option = container.querySelector<HTMLElement>("[role='option'][data-value='vue']")!;
    const tag = container.querySelector<HTMLElement>("[role='row']")!;

    expect(picker.getAttribute("aria-disabled")).toBe("true");
    expect(input.disabled).toBe(true);
    expect(option.getAttribute("aria-disabled")).toBe("true");
    expect(tag.getAttribute("aria-disabled")).toBeNull();
    await user.click(option);
    tag.focus();
    await user.keyboard("{Backspace}");
    expect(changed).not.toHaveBeenCalled();
    expect(container.querySelectorAll("[role='row']")).toHaveLength(1);
    expect(new FormData(container.querySelector("form")!).getAll("framework")).toEqual([]);
  });

  it("rejects duplicate controlled values with the offending value attached", async () => {
    expect(() => render(<FrameworkPicker value={["react", "react"]} />)).toThrow(
      'TagPicker value contains duplicate value "react". Tag values must be unique.',
    );
  });

  it("does not inherit an unrelated outer TagGroup selection contract", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <TagGroup defaultValue={["outside"]} onChange={changed}>
        <FrameworkPicker defaultValue={["react"]} />
      </TagGroup>,
    );

    await user.click(container.querySelector<HTMLElement>("[role='option'][data-value='vue']")!);
    expect(changed).not.toHaveBeenCalled();
    expect(container.querySelectorAll("[role='row']")).toHaveLength(2);
  });
});
