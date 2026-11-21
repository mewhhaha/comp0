import { act, type ReactElement } from "react";
import { commands, page } from "vitest/browser";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Checkbox,
  Connect,
  ConnectCard,
  ConnectInput,
  ConnectInputTrigger,
  ConnectOutput,
  CopyButton,
  Dialog,
  DialogContent,
  DialogTrigger,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
  Link,
  ListBox,
  ListBoxOption,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  PasswordField,
  PasswordFieldInput,
  PasswordFieldToggle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectOption,
  SelectPopover,
  SelectTrigger,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tabs,
  ToggleButton,
} from "./index.js";
import { cleanupRoots, render } from "../test/render.js";
import type { PointerStep } from "../test/pointer-command.js";

/**
 * WCAG 2.5.2 Pointer Cancellation, in real Chromium: a press activates on release, and pressing,
 * moving off, and releasing elsewhere aborts it. `commands.pointerSequence` drives Playwright's
 * mouse step by step, so the browser itself decides where `click` lands.
 *
 * Exempt, and not listed here: controls whose down event starts a drag that the up event
 * completes or reverses, where acting on the down event is essential (2.5.2's up-reversal and
 * essential exceptions). That is RangeSlider's track and thumbs, ColorArea, Resizer, the
 * FloatingPanel drag and resize handles, Inventory's move and resize handles, GridList drag
 * reordering, and the Drawer's drag-to-dismiss. ContextMenuTrigger opens on the native
 * `contextmenu` event, whose timing (down or up) is the platform convention.
 */

const PRESS = "[data-press]";
const ELSEWHERE = "[data-elsewhere]";
const OUTPUT = "[data-comp0='connect-output']";

type Pressable = {
  name: string;
  /** The control, with `data-press` on the element to press, and whether it has activated. */
  setup: () => {
    ui: ReactElement;
    activated: (container: HTMLElement) => boolean;
  };
  /**
   * Whether leaving and coming back before release still activates. A link is natively
   * draggable, so moving off it with the button held starts Chromium's link drag, which never
   * ends in a click: no activation, which 2.5.2 allows.
   */
  returnActivates?: boolean;
};

const pressed = (container: HTMLElement, attribute: string) =>
  container.querySelector(PRESS)!.getAttribute(attribute) === "true";

const pressables: Pressable[] = [
  {
    name: "Button",
    setup: () => {
      const onClick = vi.fn();
      return {
        ui: (
          <Button data-press="" onClick={onClick}>
            Save
          </Button>
        ),
        activated: () => onClick.mock.calls.length > 0,
      };
    },
  },
  {
    name: "MenuTrigger",
    setup: () => ({
      ui: (
        <Menu>
          <MenuTrigger data-press="">Actions</MenuTrigger>
          <MenuPopover>
            <MenuList>
              <MenuItem>Rename</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
      ),
      activated: (container) => pressed(container, "aria-expanded"),
    }),
  },
  {
    name: "SelectTrigger",
    setup: () => ({
      ui: (
        <Select>
          <SelectTrigger data-press="" aria-label="Plan">
            Choose
          </SelectTrigger>
          <SelectPopover>
            <SelectOption value="free">Free</SelectOption>
          </SelectPopover>
        </Select>
      ),
      activated: (container) => pressed(container, "aria-expanded"),
    }),
  },
  {
    name: "PopoverTrigger",
    setup: () => ({
      ui: (
        <Popover>
          <PopoverTrigger data-press="">More</PopoverTrigger>
          <PopoverContent aria-label="More choices">
            <button type="button">Choice</button>
          </PopoverContent>
        </Popover>
      ),
      activated: (container) => pressed(container, "aria-expanded"),
    }),
  },
  {
    name: "DialogTrigger",
    setup: () => ({
      ui: (
        <Dialog>
          <DialogTrigger data-press="">Open dialog</DialogTrigger>
          <DialogContent aria-label="Details">
            <button type="button">Close</button>
          </DialogContent>
        </Dialog>
      ),
      activated: () => document.querySelector("dialog[open]") !== null,
    }),
  },
  {
    name: "DisclosureTrigger",
    setup: () => ({
      ui: (
        <Disclosure>
          <DisclosureTrigger data-press="">Shipping</DisclosureTrigger>
          <DisclosurePanel>Ships in two days.</DisclosurePanel>
        </Disclosure>
      ),
      activated: (container) => container.querySelector("details")!.open,
    }),
  },
  {
    name: "AccordionTrigger",
    setup: () => ({
      ui: (
        <Accordion collapsible>
          <AccordionItem value="shipping">
            <AccordionHeader>
              <AccordionTrigger data-press="">Shipping</AccordionTrigger>
            </AccordionHeader>
            <AccordionPanel>Ships in two days.</AccordionPanel>
          </AccordionItem>
        </Accordion>
      ),
      activated: (container) => pressed(container, "aria-expanded"),
    }),
  },
  {
    name: "Tab",
    setup: () => ({
      ui: (
        <Tabs defaultValue="first">
          <TabList aria-label="Sections">
            <Tab value="first">First</Tab>
            <Tab value="second" data-press="">
              Second
            </Tab>
          </TabList>
          <TabPanel value="first">First panel</TabPanel>
          <TabPanel value="second">Second panel</TabPanel>
        </Tabs>
      ),
      activated: (container) => pressed(container, "aria-selected"),
    }),
  },
  {
    name: "Checkbox",
    setup: () => ({
      ui: <Checkbox data-press="">Subscribe</Checkbox>,
      activated: (container) => container.querySelector("input")!.checked,
    }),
  },
  {
    name: "Switch",
    setup: () => ({
      ui: <Switch data-press="">Alerts</Switch>,
      activated: (container) => container.querySelector("input")!.checked,
    }),
  },
  {
    name: "ListBoxOption",
    setup: () => ({
      ui: (
        <ListBox aria-label="Fruit" defaultValue="apple">
          <ListBoxOption value="apple">Apple</ListBoxOption>
          <ListBoxOption value="pear" data-press="">
            Pear
          </ListBoxOption>
        </ListBox>
      ),
      activated: (container) => pressed(container, "aria-selected"),
    }),
  },
  {
    name: "MenuItem in an open menu",
    setup: () => {
      const onClick = vi.fn();
      return {
        ui: (
          <Menu defaultOpen>
            <MenuTrigger>Actions</MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem data-press="" onClick={onClick}>
                  Rename
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        ),
        activated: () => onClick.mock.calls.length > 0,
      };
    },
  },
  {
    name: "ToggleButton",
    setup: () => ({
      ui: <ToggleButton data-press="">Bold</ToggleButton>,
      activated: (container) => pressed(container, "aria-pressed"),
    }),
  },
  {
    name: "PasswordFieldToggle",
    setup: () => ({
      ui: (
        <PasswordField defaultValue="correct horse">
          <PasswordFieldInput aria-label="Password" />
          <PasswordFieldToggle data-press="" />
        </PasswordField>
      ),
      activated: (container) => container.querySelector("input")!.type === "text",
    }),
  },
  {
    name: "CopyButton",
    setup: () => {
      // The copy itself runs from this click; the clipboard's answer is asynchronous.
      const onClick = vi.fn();
      return {
        ui: (
          <CopyButton data-press="" value="npm i comp0" onClick={onClick}>
            Copy
          </CopyButton>
        ),
        activated: () => onClick.mock.calls.length > 0,
      };
    },
  },
  {
    name: "Link",
    setup: () => ({
      ui: (
        <Link data-press="" href="#pointer-cancellation-link">
          Pricing
        </Link>
      ),
      activated: () => location.hash === "#pointer-cancellation-link",
    }),
    returnActivates: false,
  },
];

/** A pressable at the top left and an unrelated button in the far corner, clear of popovers. */
function renderPressable(control: ReactElement) {
  return render(
    <>
      <div style={{ padding: 40 }}>{control}</div>
      <button
        type="button"
        data-elsewhere=""
        style={{
          position: "fixed",
          right: 8,
          bottom: 8,
          width: 80,
          height: 40,
        }}
      >
        Elsewhere
      </button>
    </>,
  );
}

async function pointer(steps: PointerStep[]) {
  await act(async () => commands.pointerSequence(steps));
}

const moveTo = (selector: string, point: { x?: number; y?: number } = {}): PointerStep => ({
  type: "move",
  selector,
  ...point,
});

describe("pointer cancellation (WCAG 2.5.2)", () => {
  beforeEach(async () => {
    await page.viewport(800, 600);
    history.replaceState(null, "", location.pathname + location.search);
  });
  afterEach(async () => {
    // Leaves no button held down for the next test, wherever the last step ended.
    await commands.pointerSequence([{ type: "up" }]).catch(() => undefined);
    cleanupRoots();
    history.replaceState(null, "", location.pathname + location.search);
  });

  describe.each(pressables)("$name", ({ setup, returnActivates = true }) => {
    it("does not activate on press, and activates on release over the same element", async () => {
      const { ui, activated } = setup();
      const { container } = renderPressable(ui);

      await pointer([moveTo(PRESS), { type: "down" }]);
      expect(activated(container), "pointer down alone").toBe(false);
      await pointer([{ type: "up" }]);
      expect(activated(container), "release on the element").toBe(true);
    });

    it("aborts when the pointer moves to another element before release", async () => {
      const { ui, activated } = setup();
      const { container } = renderPressable(ui);

      await pointer([moveTo(PRESS), { type: "down" }, moveTo(ELSEWHERE), { type: "up" }]);
      expect(activated(container)).toBe(false);
    });

    it("aborts when the pointer is released outside the test frame", async () => {
      const { ui, activated } = setup();
      const { container } = renderPressable(ui);

      await pointer([
        moveTo(PRESS),
        { type: "down" },
        { type: "moveOutsideFrame" },
        { type: "up" },
      ]);
      expect(activated(container)).toBe(false);
    });

    it("acts on where the pointer is released after leaving and coming back", async () => {
      const { ui, activated } = setup();
      const { container } = renderPressable(ui);

      await pointer([
        moveTo(PRESS),
        { type: "down" },
        moveTo(ELSEWHERE),
        moveTo(PRESS),
        { type: "up" },
      ]);
      expect(activated(container)).toBe(returnActivates);
    });

    it("activates when released on the element's last pixel", async () => {
      const { ui, activated } = setup();
      const { container } = renderPressable(ui);
      const box = container.querySelector(PRESS)!.getBoundingClientRect();
      const y = box.height / 2;

      // Pressed 2px in from the right edge, so the move stays under Chromium's link-drag and
      // label text-selection thresholds, which would cancel the click on their own.
      await pointer([
        moveTo(PRESS, { x: box.width - 2.5, y }),
        { type: "down" },
        moveTo(PRESS, { x: box.width - 0.5, y }),
        { type: "up" },
      ]);
      expect(activated(container)).toBe(true);
    });
  });

  describe("Table", () => {
    function renderTable() {
      const onRowClick = vi.fn();
      const onRangeSelect = vi.fn();
      const result = render(
        <Table aria-label="Orders" onRangeSelect={onRangeSelect}>
          <TableBody>
            {["first", "second", "third"].map((value) => (
              <TableRow key={value} value={value} data-row={value} onClick={onRowClick}>
                <TableCell style={{ padding: 12 }}>{value} order</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>,
      );
      return { ...result, onRowClick, onRangeSelect };
    }

    it("fires no row action and keeps the selection anchor when released on another row", async () => {
      const { onRowClick, onRangeSelect } = renderTable();

      // Anchor the selection on the first row with a full click.
      await pointer([moveTo("[data-row='first']"), { type: "down" }, { type: "up" }]);
      expect(onRowClick).toHaveBeenCalledTimes(1);
      onRowClick.mockClear();

      // Chromium fires this click on the rows' common ancestor, not on either row.
      await pointer([
        moveTo("[data-row='second']"),
        { type: "down" },
        moveTo("[data-row='third']"),
        { type: "up" },
      ]);
      expect(onRowClick).not.toHaveBeenCalled();

      await act(async () =>
        page.getByRole("row", { name: "third order" }).click({ modifiers: ["Shift"] }),
      );
      expect(onRangeSelect).toHaveBeenLastCalledWith(["first", "second", "third"]);
    });
  });

  describe("ConnectOutput", () => {
    function renderConnect() {
      const result = render(
        <Connect aria-label="Connections" style={{ display: "flex", gap: 150, padding: 40 }}>
          <ConnectCard value="source" label="Source" style={{ width: 160 }}>
            <ConnectOutput value="color" label="Color" kind="color" style={{ padding: 20 }}>
              Color output
            </ConnectOutput>
          </ConnectCard>
          <ConnectCard value="target" label="Target" style={{ width: 160 }}>
            <ConnectInput value="color" label="Color" kind="color">
              <ConnectInputTrigger style={{ padding: 20 }}>Color input</ConnectInputTrigger>
            </ConnectInput>
          </ConnectCard>
          <p data-elsewhere="" style={{ width: 80, height: 40 }}>
            Notes
          </p>
        </Connect>,
      );
      return result.container.querySelector<HTMLElement>(OUTPUT)!;
    }

    it("selects on release over the output, not on press", async () => {
      const output = renderConnect();

      await pointer([moveTo(OUTPUT), { type: "down" }]);
      expect(output.getAttribute("aria-pressed")).toBe("false");
      await pointer([{ type: "up" }]);
      expect(output.getAttribute("aria-pressed")).toBe("true");
    });

    it("cancels a drag released away from any input, past the drag threshold", async () => {
      const output = renderConnect();

      await pointer([
        moveTo(OUTPUT),
        { type: "down" },
        { type: "move", selector: ELSEWHERE, steps: 5 },
      ]);
      // Crossing the threshold starts the drag, which selects the output. A person's drag spans
      // frames, so React has rendered that selection before the release.
      await act(async () => new Promise(requestAnimationFrame));
      expect(output.getAttribute("aria-pressed"), "the drag selected the output").toBe("true");
      await pointer([{ type: "up" }]);
      expect(output.getAttribute("aria-pressed"), "release over nothing cancels it").toBe("false");
    });

    it("does not select when released just off the output, within the drag threshold", async () => {
      const output = renderConnect();
      const box = output.getBoundingClientRect();

      // Pressed 1px inside the right edge, released 2px past it: 3px of travel, under the 4px
      // mouse threshold, so no drag starts, but the release is off the output.
      await pointer([
        moveTo(OUTPUT, { x: box.width - 1 }),
        { type: "down" },
        moveTo(OUTPUT, { x: box.width + 2 }),
        { type: "up" },
      ]);
      expect(output.getAttribute("aria-pressed")).toBe("false");
    });
  });
});
