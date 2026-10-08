import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import {
  Combobox,
  ComboboxInput,
  ComboboxOptGroup,
  ComboboxOption,
  ComboboxPopover,
  ComboboxTrigger,
} from "../index.js";

describe("Combobox", () => {
  it("navigates labelled combobox opt groups and serializes a committed option", async () => {
    const { container, user } = setup(
      <form>
        <Combobox name="city">
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOptGroup label="Poland">
              <ComboboxOption value="krakow">Kraków</ComboboxOption>
            </ComboboxOptGroup>
            <ComboboxOptGroup label="Portugal">
              <ComboboxOption value="lisbon">Lisbon</ComboboxOption>
            </ComboboxOptGroup>
          </ComboboxPopover>
        </Combobox>
      </form>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;
    const groups = container.querySelectorAll<HTMLElement>("[role='group']");

    expect([...groups].map((group) => group.getAttribute("aria-label"))).toEqual([
      "Poland",
      "Portugal",
    ]);
    await user.tab();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      container.querySelector<HTMLElement>("[data-value='lisbon']")?.id,
    );
    await user.keyboard("{Enter}");

    expect(new FormData(container.querySelector("form")!).get("city")).toBe("lisbon");
  });

  it("preserves native combobox onChange and supports navigation and commit keys", async () => {
    const changed = vi.fn();
    const inputChanged = vi.fn();
    const nativeChanged = vi.fn();
    const { container, user } = setup(
      <Combobox id="framework" onChange={changed} onInputChange={inputChanged}>
        <ComboboxInput aria-label="Framework" onChange={nativeChanged} />
        <ComboboxTrigger />
        <ComboboxPopover>
          <ComboboxOption value="react" id="react-option">
            React
          </ComboboxOption>
          <ComboboxOption value="svelte" id="svelte-option">
            Svelte
          </ComboboxOption>
          <ComboboxOption value="vue" id="vue-option">
            Vue
          </ComboboxOption>
        </ComboboxPopover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;
    const trigger = container.querySelector<HTMLButtonElement>("button[aria-haspopup='listbox']")!;

    expect(trigger.getAttribute("aria-controls")).toBe("framework-listbox");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(input);

    await user.type(input, "r");
    expect(nativeChanged.mock.calls[0]?.[0].nativeEvent).toBeInstanceOf(Event);
    expect(inputChanged).toHaveBeenLastCalledWith("r");
    await user.clear(input);
    await user.keyboard("{ArrowDown}{ArrowDown}{Home}{End}{Enter}");

    expect(input.value).toBe("Vue");
    expect(changed).toHaveBeenLastCalledWith("vue");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    await user.keyboard("{Escape}");
    expect(input.getAttribute("aria-expanded")).toBe("false");
    await user.keyboard("{ArrowUp}");
    expect(input.getAttribute("aria-expanded")).toBe("true");
  });

  it("points aria-activedescendant at a mounted option despite a different logical value", async () => {
    const { container, user } = setup(
      <Combobox id="city" defaultValue="logical-value" allowEmptyCollection>
        <ComboboxInput aria-label="City" />
        <ComboboxPopover>
          <ComboboxOption value="paris" id="mounted-paris">
            Paris
          </ComboboxOption>
        </ComboboxPopover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    await user.tab();
    await user.keyboard("{ArrowDown}");

    expect(input.getAttribute("aria-activedescendant")).toBe("mounted-paris");
    expect(document.getElementById("mounted-paris")).not.toBeNull();
    expect(document.getElementById("mounted-paris")?.hasAttribute("data-active")).toBe(true);
    await user.keyboard("{Escape}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.getElementById("mounted-paris")?.hasAttribute("data-active")).toBe(false);
  });

  it("automatically highlights the first visible enabled option after editing", async () => {
    const { container, user } = setup(
      <Combobox autoHighlight defaultOpen>
        <ComboboxInput aria-label="City" />
        <ComboboxPopover>
          <ComboboxOption value="disabled" id="disabled-city" disabled>
            Prague disabled
          </ComboboxOption>
          <ComboboxOption value="paris" id="paris-option">
            Paris
          </ComboboxOption>
          <ComboboxOption value="prague" id="prague-option">
            Prague
          </ComboboxOption>
        </ComboboxPopover>
      </Combobox>,
    );
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    expect(input.getAttribute("aria-activedescendant")).toBe("paris-option");
    await user.type(input, "prag");
    expect(input.getAttribute("aria-activedescendant")).toBe("prague-option");
    expect(container.querySelector("#prague-option")?.hasAttribute("data-active")).toBe(true);

    await user.clear(input);
    await user.type(input, "missing");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("treats an initial committed combobox value as a valid form value", () => {
    const { container } = render(
      <form>
        <Combobox id="initial-city" name="city" defaultValue="paris" required>
          <ComboboxInput aria-label="City" />
          <ComboboxPopover>
            <ComboboxOption value="paris">Paris</ComboboxOption>
          </ComboboxPopover>
        </Combobox>
      </form>,
    );
    const form = container.querySelector("form")!;
    const input = container.querySelector<HTMLInputElement>("input[role='combobox']")!;

    expect(input.value).toBe("Paris");
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("city")).toBe("paris");
  });
});
