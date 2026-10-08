import { Fragment } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Autocomplete,
  Label,
  ListBox,
  ListBoxOption,
  SearchField,
  SearchFieldInput,
  TextArea,
  TextField,
} from "../index.js";
import { setup } from "../../test/render.js";

function CityOptions() {
  return (
    <ListBox aria-label="Cities">
      <ListBoxOption value="warsaw" textValue="Warsaw">
        Warsaw
      </ListBoxOption>
      <ListBoxOption value="new-york" textValue="New York">
        NYC
      </ListBoxOption>
    </ListBox>
  );
}

describe("Autocomplete with a ListBox", () => {
  it("is a provider and does not add a wrapper around its children", () => {
    const { container } = setup(
      <Autocomplete>
        <SearchField as={Fragment}>
          <SearchFieldInput aria-label="City" />
        </SearchField>
      </Autocomplete>,
    );

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("INPUT");
  });

  it("filters ListBox items by their textValue and leaves unfiltered collections intact", async () => {
    const { container, user } = setup(
      <Autocomplete filter={(textValue, inputValue) => textValue.includes(inputValue)}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    expect(container.querySelectorAll("[role='option']")).toHaveLength(2);
    await user.type(input, "York");

    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(container.querySelector("[role='option']")?.textContent).toBe("NYC");

    const unfiltered = setup(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    expect(unfiltered.container.querySelectorAll("[role='option']")).toHaveLength(2);
  });

  it("keeps the query separate when a ListBox item is selected", async () => {
    const { container, user } = setup(
      <Autocomplete defaultInputValue="war">
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const option = container.querySelector<HTMLElement>("[data-value='warsaw']")!;

    await user.click(option);

    expect(option.getAttribute("aria-selected")).toBe("true");
    expect(input.value).toBe("war");
  });

  it("only exposes the effective ListBox id while the collection is mounted", () => {
    const { container, rerender } = setup(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.hasAttribute("aria-controls")).toBe(false);

    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox id="city-results" aria-label="Cities">
          <ListBoxOption value="warsaw">Warsaw</ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.getAttribute("aria-controls")).toBe("city-results");

    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-controls")).toBe(false);
  });

  it("reports edits without replacing a rejected controlled query", async () => {
    const changed = vi.fn();
    const { container, user } = setup(
      <Autocomplete inputValue="War" onInputChange={changed}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.type(input, "k");

    expect(changed).toHaveBeenLastCalledWith("Wark");
    expect(input.value).toBe("War");
  });

  it("uses virtual focus only for rendered enabled items and clears it on editing keys", async () => {
    const { container, user } = setup(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="Framework" />
        </SearchField>
        <ListBox aria-label="Frameworks">
          <ListBoxOption id="disabled-first" value="angular" disabled>
            Angular
          </ListBoxOption>
          <ListBoxOption id="react-option" value="react">
            React
          </ListBoxOption>
          <ListBoxOption id="disabled-middle" value="solid" disabled>
            Solid
          </ListBoxOption>
          <ListBoxOption id="vue-option" value="vue">
            Vue
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.type(input, "r");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");
    expect(container.querySelector("#react-option")?.hasAttribute("data-active")).toBe(true);

    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe("vue-option");
    await user.keyboard("{ArrowUp}");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");
    await user.keyboard("{End}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Home}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowRight}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");
    await user.keyboard("{Escape}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("leaves Home and End to the text input while clearing virtual focus", async () => {
    const { container, user } = setup(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="Framework" />
        </SearchField>
        <ListBox aria-label="Frameworks">
          <ListBoxOption id="react-option" value="react">
            React
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await user.type(input, "r");
    expect(input.getAttribute("aria-activedescendant")).toBe("react-option");

    // userEvent cannot report whether the app prevented the default action.
    const end = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });
    input.dispatchEvent(end);
    expect(end.defaultPrevented).toBe(false);
    await user.keyboard("{Tab}");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("activates a delayed external result once for the current forward edit", async () => {
    const { container, rerender, user } = setup(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities" />
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.type(input, "wa");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption id="delayed-warsaw" value="warsaw">
            Warsaw
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.getAttribute("aria-activedescendant")).toBe("delayed-warsaw");

    await user.keyboard("{ArrowRight}");
    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption id="delayed-warsaw" value="warsaw">
            Warsaw
          </ListBoxOption>
          <ListBoxOption id="delayed-wawel" value="wawel">
            Wawel
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    await user.keyboard("{Backspace}");
    rerender(
      <Autocomplete>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption id="delayed-warsaw" value="warsaw">
            Warsaw
          </ListBoxOption>
          <ListBoxOption id="delayed-wawel" value="wawel">
            Wawel
          </ListBoxOption>
          <ListBoxOption id="delayed-wroclaw" value="wroclaw">
            Wroclaw
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("drops an active item when filtered results remove it", async () => {
    const { container, rerender, user } = setup(
      <Autocomplete filter={() => true}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption id="warsaw-option" value="warsaw">
            Warsaw
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.click(input);
    await user.keyboard("{ArrowDown}");
    expect(input.getAttribute("aria-activedescendant")).toBe("warsaw-option");

    rerender(
      <Autocomplete filter={() => false}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption id="warsaw-option" value="warsaw">
            Warsaw
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );

    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("supports disabling automatic and virtual focus independently", async () => {
    const { container, rerender, user } = setup(
      <Autocomplete disableAutoFocusFirst>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    let input = container.querySelector<HTMLInputElement>("input")!;

    await user.type(input, "war");
    expect(input.hasAttribute("aria-activedescendant")).toBe(false);

    rerender(
      <Autocomplete disableVirtualFocus>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <CityOptions />
      </Autocomplete>,
    );
    input = container.querySelector<HTMLInputElement>("input")!;
    await user.click(input);
    await user.keyboard("{ArrowDown}");

    expect(input.hasAttribute("aria-activedescendant")).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it("filters rich ListBox children on the initial query without a measurement render", () => {
    const { container } = setup(
      <Autocomplete
        defaultInputValue="New York"
        filter={(textValue, inputValue) => textValue.includes(inputValue)}
      >
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption value="nyc">
            <span>
              New <strong>York</strong>
            </span>
          </ListBoxOption>
          <ListBoxOption value="warsaw">
            <span>Warsaw</span>
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(container.querySelector("[role='option']")?.textContent).toBe("New York");
  });

  it("warns and filters an opaque child by its value when it has no textValue", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      function CityName() {
        return <span>New York</span>;
      }

      const { container } = setup(
        <Autocomplete defaultInputValue="New" filter={(textValue) => textValue.startsWith("New")}>
          <SearchField>
            <SearchFieldInput aria-label="City" />
          </SearchField>
          <ListBox aria-label="Cities">
            <ListBoxOption value="nyc">
              <CityName />
            </ListBoxOption>
          </ListBox>
        </Autocomplete>,
      );

      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining('ListBoxOption with value "nyc" requires textValue'),
      );
      // Its text cannot be read before it renders, so the value "nyc" is filtered instead.
      expect(container.querySelectorAll("[role='option']")).toHaveLength(0);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("filters an opaque child label after its text has been crawled from an initial render", async () => {
    function CityName() {
      return <span>New York</span>;
    }

    const { container, user } = setup(
      <Autocomplete filter={(textValue, inputValue) => textValue.startsWith(inputValue)}>
        <SearchField>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption value="nyc">
            <CityName />
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.type(input, "New");

    expect(container.querySelector("[role='option']")?.textContent).toBe("New York");
  });

  it("selects the active item instead of submitting a SearchField", async () => {
    const submitted = vi.fn();
    const clicked = vi.fn();
    const { container, user } = setup(
      <Autocomplete defaultInputValue="war">
        <SearchField onSubmit={submitted}>
          <SearchFieldInput aria-label="City" />
        </SearchField>
        <ListBox aria-label="Cities">
          <ListBoxOption value="warsaw" onClick={clicked}>
            Warsaw
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;

    await user.click(input);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(clicked).toHaveBeenCalledOnce();
    expect(submitted).not.toHaveBeenCalled();
    expect(input.value).toBe("war");
    expect(document.activeElement).toBe(input);
  });

  it("filters TextArea suggestions by substring and selects the active item on Enter", async () => {
    const clicked = vi.fn();
    const { container, user } = setup(
      <Autocomplete filter={(textValue, inputValue) => textValue.includes(inputValue)}>
        <TextField>
          <Label>Destination</Label>
          <TextArea />
        </TextField>
        <ListBox aria-label="Destinations">
          <ListBoxOption value="warsaw">Warsaw</ListBoxOption>
          <ListBoxOption value="newark" onClick={clicked}>
            Newark
          </ListBoxOption>
        </ListBox>
      </Autocomplete>,
    );
    const input = container.querySelector<HTMLTextAreaElement>("textarea")!;

    await user.type(input, "ark");
    expect(container.querySelectorAll("[role='option']")).toHaveLength(1);
    expect(input.getAttribute("aria-activedescendant")).toBe(
      container.querySelector("[role='option']")?.id,
    );
    await user.keyboard("{Enter}");

    expect(clicked).toHaveBeenCalledOnce();
    expect(input.value).toBe("ark");
    expect(document.activeElement).toBe(input);
  });
});
