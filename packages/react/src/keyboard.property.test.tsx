import type { ReactElement } from "react";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  GridList,
  GridListItem,
  ListBox,
  ListBoxOption,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tag,
  TagGroup,
  TagList,
  Tree,
  TreeItem,
} from "./index.js";
import { cleanupRoots, setup } from "../test/render.js";

/**
 * Property tests for the keyboard contract every roving composite shares (WCAG 2.1.1 Keyboard,
 * 2.1.2 No Keyboard Trap, 2.4.3 Focus Order). fast-check generates the collection (size and
 * which items are disabled) and a sequence of navigation keys, then checks invariants after
 * every key instead of the handful of paths an example-based test happens to cover:
 *
 * - focus never leaves the composite on a navigation key, and never lands on a disabled item;
 * - the composite keeps exactly one tab stop, and it is the focused item;
 * - one Tab leaves the composite and one Shift+Tab returns to the item that was focused.
 *
 * A failure prints the shrunk counterexample (items, disabled set, keys) to replay by hand.
 */

type Composite = {
  name: string;
  role: string;
  render: (labels: string[], disabled: boolean[]) => ReactElement;
};

const composites: Composite[] = [
  {
    name: "ListBox",
    role: "listbox",
    render: (labels, disabled) => (
      <ListBox aria-label="Items">
        {labels.map((label, index) => (
          <ListBoxOption key={label} value={label} disabled={disabled[index]}>
            {label}
          </ListBoxOption>
        ))}
      </ListBox>
    ),
  },
  {
    name: "GridList",
    role: "grid",
    render: (labels, disabled) => (
      <GridList aria-label="Items">
        {labels.map((label, index) => (
          <GridListItem key={label} value={label} disabled={disabled[index]}>
            {label}
          </GridListItem>
        ))}
      </GridList>
    ),
  },
  {
    name: "TagGroup",
    role: "grid",
    render: (labels, disabled) => (
      <TagGroup>
        <TagList aria-label="Items">
          {labels.map((label, index) => (
            <Tag key={label} value={label} disabled={disabled[index]}>
              {label}
            </Tag>
          ))}
        </TagList>
      </TagGroup>
    ),
  },
  {
    name: "Tabs",
    role: "tablist",
    render: (labels, disabled) => (
      <Tabs>
        <TabList aria-label="Items">
          {labels.map((label, index) => (
            <Tab key={label} value={label} disabled={disabled[index]}>
              {label}
            </Tab>
          ))}
        </TabList>
        {labels.map((label) => (
          <TabPanel key={label} value={label}>
            {label} panel
          </TabPanel>
        ))}
      </Tabs>
    ),
  },
  {
    name: "Tree",
    role: "tree",
    render: (labels, disabled) => (
      <Tree aria-label="Items">
        {labels.map((label, index) => (
          <TreeItem key={label} value={label} disabled={disabled[index]}>
            {label}
          </TreeItem>
        ))}
      </Tree>
    ),
  },
];

const navigationKeys = [
  "{ArrowUp}",
  "{ArrowDown}",
  "{ArrowLeft}",
  "{ArrowRight}",
  "{Home}",
  "{End}",
  "{PageUp}",
  "{PageDown}",
] as const;

/** A collection of 1–6 items with at least one enabled, and 1–20 navigation keys. */
const scenario = fc.integer({ min: 1, max: 6 }).chain((size) =>
  fc.record({
    size: fc.constant(size),
    disabled: fc
      .array(fc.boolean(), { minLength: size, maxLength: size })
      .filter((flags) => flags.some((flag) => !flag)),
    keys: fc.array(fc.constantFrom(...navigationKeys), { minLength: 1, maxLength: 20 }),
  }),
);

const isDisabled = (element: Element) =>
  element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";

describe.each(composites)("$name keyboard invariants", ({ role, render }) => {
  it("keeps one tab stop on the focused enabled item and never traps focus", async () => {
    await fc.assert(
      fc.asyncProperty(scenario, async ({ size, disabled, keys }) => {
        const labels = Array.from({ length: size }, (_, index) => `Item ${index + 1}`);
        const { container, user } = setup(
          <>
            <button type="button">Before</button>
            {render(labels, disabled)}
            <button type="button">After</button>
          </>,
        );
        try {
          const root = container.querySelector(`[role='${role}']`)!;
          const [before] = container.querySelectorAll<HTMLElement>(":scope > button");
          const stops = () => [...root.querySelectorAll("[tabindex='0']")];

          await user.click(before!);
          await user.tab();
          expect(root.contains(document.activeElement), "Tab enters the composite").toBe(true);

          for (const key of keys) {
            await user.keyboard(key);
            const active = document.activeElement!;
            expect(root.contains(active), `${key} keeps focus inside`).toBe(true);
            expect(isDisabled(active), `${key} skips disabled items`).toBe(false);
            expect(stops(), `${key} leaves one tab stop, on the focused item`).toEqual([active]);
          }

          const focused = document.activeElement;
          await user.tab();
          // The next stop is the After button, or a tab panel, which is focusable by design.
          expect(root.contains(document.activeElement), "one Tab leaves the composite").toBe(false);
          expect(document.activeElement, "one Tab leaves the composite").not.toBe(document.body);
          await user.tab({ shift: true });
          expect(document.activeElement, "Shift+Tab returns to the same item").toBe(focused);
        } finally {
          cleanupRoots();
          document.body.innerHTML = "";
        }
      }),
      { numRuns: 40 },
    );
  });
});
