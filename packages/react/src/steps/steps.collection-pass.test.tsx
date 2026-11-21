import { act, Fragment, StrictMode, Suspense, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { Steps } from "./Steps.js";
import { StepsItem, type StepsItemProps } from "./StepsItem.js";
import { StepsList } from "./StepsList.js";
import { StepsPanel } from "./StepsPanel.js";
import { StepsTrigger } from "./StepsTrigger.js";

function serverRender(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(ui);
  return container;
}

async function hydrate(container: Element, ui: ReactElement) {
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, ui);
  });
  return root;
}

/** Each item and its trigger as `step|completed|current`, in document order. */
function rows(container: Element, selector = "[data-comp0='steps-item']") {
  return [...container.querySelectorAll(selector)].map((item) => {
    const trigger = item.querySelector(":scope > [data-comp0='steps-trigger']")!;
    return [
      `${item.getAttribute("data-step")}|${item.hasAttribute("data-completed")}|${item.hasAttribute("data-current")}`,
      `${trigger.hasAttribute("data-completed")}|${trigger.getAttribute("aria-current")}`,
    ].join(" ");
  });
}

const item = (name: string, props: Partial<StepsItemProps> = {}) => (
  <StepsItem key={name} value={name} {...props}>
    <StepsTrigger>{name}</StepsTrigger>
  </StepsItem>
);

function Step({ name }: { name: string }) {
  return item(name);
}

const flow = (names: string[], props: { defaultValue?: string } = {}) => (
  <Steps {...props}>
    <StepsList>{names.map((name) => item(name))}</StepsList>
    {names.map((name) => (
      <StepsPanel key={name} value={name}>
        Panel {name}
      </StepsPanel>
    ))}
  </Steps>
);

/**
 * On the server and while hydrating, Steps renders its children once more ahead of the real
 * items, where each item records its value, so every item knows its own place and the current
 * step's before it renders and server HTML already has data-step and data-completed.
 */
describe("Steps collection pass", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders data-step and data-completed on items and triggers in server HTML", () => {
    const container = serverRender(flow(["a", "b", "c"], { defaultValue: "c" }));

    expect(rows(container)).toEqual([
      "1|true|false true|null",
      "2|true|false true|null",
      "3|false|true false|step",
    ]);
  });

  it("leaves no items, triggers, or panels in the pass's hidden holder", () => {
    const container = serverRender(flow(["a", "b"], { defaultValue: "a" }));

    const holder = container.firstElementChild!;
    expect(holder.hasAttribute("hidden")).toBe(true);
    expect(holder.querySelectorAll("*")).toHaveLength(0);
    expect(container.querySelectorAll("[data-comp0='steps-item']")).toHaveLength(2);
    expect(container.querySelectorAll("[data-comp0='steps-panel']")).toHaveLength(2);
  });

  it.each([
    { names: ["a", "b", "c"], props: { defaultValue: "b" } },
    { names: ["a", "b", "c"], props: { defaultValue: "a" } },
    { names: ["a", "b", "c"], props: { defaultValue: "missing" } },
    { names: ["a", "b", "c"], props: {} },
    { names: ["a"], props: { defaultValue: "a" } },
    { names: [], props: { defaultValue: "a" } },
  ])("matches a client mount in server HTML ($names.length items, $props)", ({ names, props }) => {
    const server = serverRender(flow(names, props));
    const client = render(flow(names, props)).container;

    expect(rows(server)).toEqual(rows(client));
  });

  it("numbers items in a consumer component and a Fragment", () => {
    const container = serverRender(
      <Steps defaultValue="c">
        <StepsList>
          <Step name="a" />
          <Fragment>
            {item("b")}
            <Step name="c" />
          </Fragment>
        </StepsList>
      </Steps>,
    );

    expect(rows(container)).toEqual([
      "1|true|false true|null",
      "2|true|false true|null",
      "3|false|true false|step",
    ]);
  });

  it("starts a nested Steps' numbering at its own root", () => {
    const container = serverRender(
      <Steps defaultValue="b">
        <StepsList>
          {item("a", { "data-probe": "outer" } as Partial<StepsItemProps>)}
          {item("b", { "data-probe": "outer" } as Partial<StepsItemProps>)}
        </StepsList>
        <StepsPanel value="b">
          <Steps defaultValue="y">
            <StepsList>
              {item("x", { "data-probe": "inner" } as Partial<StepsItemProps>)}
              {item("y", { "data-probe": "inner" } as Partial<StepsItemProps>)}
              {item("z", { "data-probe": "inner" } as Partial<StepsItemProps>)}
            </StepsList>
          </Steps>
        </StepsPanel>
      </Steps>,
    );

    expect(rows(container, "[data-probe='outer']")).toEqual([
      "1|true|false true|null",
      "2|false|true false|step",
    ]);
    expect(rows(container, "[data-probe='inner']")).toEqual([
      "1|true|false true|null",
      "2|false|true false|step",
      "3|false|false false|null",
    ]);
  });

  it("hydrates without a mismatch or an attribute write and removes the pass", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = flow(["a", "b", "c"], { defaultValue: "b" });
    const container = serverRender(ui);
    const before = rows(container);
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    const root = await hydrate(container, <StrictMode>{ui}</StrictMode>);

    expect(errors).not.toHaveBeenCalled();
    const parts = [
      ...container.querySelectorAll("[data-comp0='steps-item'], [data-comp0='steps-trigger']"),
    ];
    const partWrites = (spy: typeof writes | typeof removals) =>
      spy.mock.contexts.filter((element) => parts.includes(element as Element));
    expect(partWrites(writes)).toEqual([]);
    expect(partWrites(removals)).toEqual([]);
    expect(rows(container)).toEqual(before);
    // Steps renders no element of its own, so the list follows directly once the pass is gone.
    expect(container.firstElementChild?.getAttribute("data-comp0")).toBe("steps-list");
    await act(async () => root.unmount());
  });

  it("repairs item and trigger attributes the server rendered differently", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = flow(["a", "b", "c"], { defaultValue: "b" });
    const container = serverRender(ui);
    const [first, , third] = container.querySelectorAll("[data-comp0='steps-item']");
    first!.setAttribute("data-step", "9");
    first!.removeAttribute("data-completed");
    first!.querySelector("button")!.removeAttribute("data-completed");
    third!.setAttribute("data-completed", "");
    third!.querySelector("button")!.setAttribute("data-completed", "");

    const root = await hydrate(container, ui);

    expect(rows(container)).toEqual([
      "1|true|false true|null",
      "2|false|true false|step",
      "3|false|false false|null",
    ]);
    await act(async () => root.unmount());
  });

  it("ends with the right positions after hydrating items inside a Suspense boundary", async () => {
    // The pass's own copy of the boundary is still dehydrated while the root hydrates, so the
    // client sees only the items outside it and React logs the mismatch the repair then fixes
    // (the known limit in AGENTS.md "DOM state").
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <Steps defaultValue="c">
        <StepsList>
          {item("a")}
          <Suspense fallback={null}>
            {item("b")}
            {item("c")}
          </Suspense>
          {item("d")}
        </StepsList>
      </Steps>
    );
    const expected = [
      "1|true|false true|null",
      "2|true|false true|null",
      "3|false|true false|step",
      "4|false|false false|null",
    ];
    const container = serverRender(ui);
    expect(rows(container)).toEqual(expected);

    const root = await hydrate(container, ui);

    expect(rows(container)).toEqual(expected);
    await act(async () => root.unmount());
  });

  it.each([
    {
      current: "b",
      expected: [
        "2|false|false false|null",
        "1|false|true false|step",
        "2|false|false false|null",
        "3|false|false false|null",
      ],
    },
    {
      current: "c",
      expected: [
        "2|true|false true|null",
        "1|true|false true|null",
        "2|true|false true|null",
        "3|false|true false|step",
      ],
    },
  ])(
    "numbers duplicate values in server HTML as the client does (current $current)",
    async ({ current, expected }) => {
      // As before the store: the last duplicate's element is the one registered under the value,
      // so every item with that value takes its place.
      const errors = vi.spyOn(console, "error").mockImplementation(() => {});
      const ui = (
        <Steps defaultValue={current}>
          <StepsList>
            <StepsItem key="a1" value="a">
              <StepsTrigger>a</StepsTrigger>
            </StepsItem>
            {item("b")}
            <StepsItem key="a2" value="a">
              <StepsTrigger>a</StepsTrigger>
            </StepsItem>
            {item("c")}
          </StepsList>
        </Steps>
      );
      const container = serverRender(ui);
      const client = render(ui).container;
      expect(rows(client)).toEqual(expected);
      expect(rows(container)).toEqual(expected);

      const root = await hydrate(container, ui);
      expect(errors).not.toHaveBeenCalled();
      expect(rows(container)).toEqual(expected);
      await act(async () => root.unmount());
    },
  );
});
