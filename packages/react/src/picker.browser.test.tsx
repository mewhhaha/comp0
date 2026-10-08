import { act } from "react";
import { page, userEvent } from "vitest/browser";
import { describe, it, vi } from "vitest";
import { expectNoAxeViolations } from "../test/axe.js";
import { render } from "../test/render.js";
import {
  Autocomplete,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxPopover,
  Label,
  ListBox,
  ListBoxOption,
  MentionField,
  MentionFieldInput,
  MentionFieldPopover,
  SearchField,
  SearchFieldInput,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  Tag,
  TagList,
  TagPicker,
  TagPickerInput,
  TagPickerOption,
  TextField,
} from "./index.js";

describe("open picker accessibility", () => {
  it("has no violations with an open Select, labelled and unlabelled", async () => {
    const { unmount } = render(
      <div>
        <Select id="axe-labelled-select">
          <Label>Plan</Label>
          <SelectTrigger>Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="free">Free</SelectOption>
            <SelectOption value="pro">Pro</SelectOption>
          </SelectPopover>
        </Select>
        <Select id="axe-unlabelled-select">
          <SelectTrigger aria-label="Size">Choose</SelectTrigger>
          <SelectPopover>
            <SelectOption value="small">Small</SelectOption>
          </SelectPopover>
        </Select>
      </div>,
    );

    for (const name of [/Plan/, /Size/]) {
      const trigger = page.getByRole("button", { name }).element();
      await act(async () => userEvent.click(trigger));
      await vi.waitFor(() => expectNoAxeViolations(document.body, "open select"));
      await act(async () => userEvent.keyboard("{Escape}"));
    }
    unmount();
  });

  it("has no violations with open Combobox results", async () => {
    const { unmount } = render(
      <Combobox id="axe-combobox">
        <Label>City</Label>
        <ComboboxInput />
        <ComboboxPopover>
          <ComboboxOption value="paris">Paris</ComboboxOption>
          <ComboboxOption value="prague">Prague</ComboboxOption>
        </ComboboxPopover>
      </Combobox>,
    );

    await act(async () => userEvent.click(page.getByRole("combobox").element()));
    await act(async () => userEvent.keyboard("p{ArrowDown}"));
    await vi.waitFor(() => expectNoAxeViolations(document.body, "open combobox"));
    unmount();
  });

  it("has no violations with Autocomplete results and an active descendant", async () => {
    const { unmount } = render(
      <Autocomplete>
        <SearchField>
          <Label>Destination</Label>
          <SearchFieldInput />
        </SearchField>
        <ListBox aria-label="Destinations">
          <ListBoxOption value="paris">Paris</ListBoxOption>
          <ListBoxOption value="prague">Prague</ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );

    await act(async () => userEvent.click(page.getByRole("searchbox").element()));
    await act(async () => userEvent.keyboard("p{ArrowDown}"));
    await vi.waitFor(() => expectNoAxeViolations(document.body, "autocomplete results"));
    unmount();
  });

  it("has no violations with a TagPicker holding tags and filtered options", async () => {
    const { unmount } = render(
      <TagPicker defaultValue={["react"]}>
        {({ value }) => (
          <>
            <TagList aria-label="Selected frameworks">
              {value.map((entry) => (
                <Tag key={entry} value={entry}>
                  {entry}
                </Tag>
              ))}
            </TagList>
            <TextField>
              <TagPickerInput aria-label="Add framework" />
            </TextField>
            <ListBox aria-label="Frameworks">
              <TagPickerOption value="react">React</TagPickerOption>
              <TagPickerOption value="vue">Vue</TagPickerOption>
            </ListBox>
          </>
        )}
      </TagPicker>,
    );

    await act(async () => userEvent.click(page.getByLabelText("Add framework").element()));
    await act(async () => userEvent.keyboard("v"));
    await vi.waitFor(() => expectNoAxeViolations(document.body, "tag picker"));
    unmount();
  });

  it("has no violations with open MentionField suggestions", async () => {
    const { unmount } = render(
      <MentionField as="div" defaultValue="">
        <Label>Message</Label>
        <MentionFieldInput />
        <MentionFieldPopover>
          <ListBox aria-label="Teammates">
            <ListBoxOption value="Aisha">Aisha</ListBoxOption>
            <ListBoxOption value="Diego">Diego</ListBoxOption>
          </ListBox>
        </MentionFieldPopover>
      </MentionField>,
    );

    await act(async () => userEvent.click(page.getByLabelText("Message").element()));
    await act(async () => userEvent.keyboard("Hi @"));
    await vi.waitFor(() => expectNoAxeViolations(document.body, "mention suggestions"));
    unmount();
  });
});
