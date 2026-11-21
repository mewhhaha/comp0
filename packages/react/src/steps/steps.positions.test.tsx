import {
  act,
  Fragment,
  Profiler,
  StrictMode,
  Suspense,
  createRef,
  startTransition,
  use,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToString } from "react-dom/server";
import fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireClick, render, setup } from "../../test/render.js";
import { Steps } from "./Steps.js";
import { StepsItem, type StepsItemProps } from "./StepsItem.js";
import { StepsList } from "./StepsList.js";
import { StepsPanel } from "./StepsPanel.js";
import { StepsTrigger } from "./StepsTrigger.js";

/**
 * Each item as `name:step`, `*` when current and `+` when completed, then `|` and what its
 * trigger shows: `**` for aria-current="step" plus data-current, `+` for data-completed.
 */
function rows(container: Element, selector = "[data-comp0='steps-item']") {
  return [...container.querySelectorAll(selector)].map((item) => {
    let row = `${item.getAttribute("data-name")}:${item.getAttribute("data-step")}`;
    if (item.hasAttribute("data-current")) row += "*";
    if (item.hasAttribute("data-completed")) row += "+";
    const trigger = item.querySelector(":scope > [data-comp0='steps-trigger']");
    if (!trigger) return row;
    row += "|";
    if (trigger.getAttribute("aria-current") === "step") row += "*";
    if (trigger.hasAttribute("data-current")) row += "*";
    if (trigger.hasAttribute("data-completed")) row += "+";
    return row;
  });
}

/** What `rows` must read for `names` in document order with `current` as the value. */
function expectedRows(names: readonly string[], current: string) {
  const currentIndex = names.indexOf(current);
  return names.map((name, index) => {
    if (name === current) return `${name}:${index + 1}*|**`;
    if (index < currentIndex) return `${name}:${index + 1}+|+`;
    return `${name}:${index + 1}|`;
  });
}

const item = (name: string, props: Partial<StepsItemProps> = {}) => (
  <StepsItem key={name} value={name} data-name={name} {...props}>
    <StepsTrigger>{name}</StepsTrigger>
  </StepsItem>
);

// A consumer component between the list and the item.
function Step({ name }: { name: string }) {
  return item(name);
}

type FlowProps = {
  names: readonly string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
};

function Flow({ names, ...props }: FlowProps) {
  return (
    <Steps {...props}>
      <StepsList>{names.map((name) => item(name))}</StepsList>
      {names.map((name) => (
        <StepsPanel key={name} value={name}>
          Panel {name}
        </StepsPanel>
      ))}
    </Steps>
  );
}

const triggerFor = (container: Element, name: string) =>
  container.querySelector<HTMLElement>(`[data-name='${name}'] > [data-comp0='steps-trigger']`)!;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("steps positions on a client mount", () => {
  it("renders nothing to number and logs nothing with zero items", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<Flow names={[]} defaultValue="a" />);

    expect(container.querySelectorAll("li")).toHaveLength(0);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(errors).not.toHaveBeenCalled();
  });

  it("numbers a single item 1 and makes it current", () => {
    const { container } = render(<Flow names={["a"]} defaultValue="a" />);
    expect(rows(container)).toEqual(["a:1*|**"]);
  });

  it("marks nothing current or completed when the value matches no item", () => {
    const { container } = render(<Flow names={["a", "b", "c"]} defaultValue="missing" />);
    expect(rows(container)).toEqual(["a:1|", "b:2|", "c:3|"]);

    const unset = render(<Flow names={["a", "b"]} />);
    expect(rows(unset.container)).toEqual(["a:1|", "b:2|"]);
  });

  it("numbers duplicate values as before: every duplicate takes the last one's place", () => {
    // Measured at the commit before the store: the collection is keyed by value, so the last
    // duplicate's element wins and every item with that value reads its position. No throw.
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(
      <Steps defaultValue="b">
        <StepsList>
          {item("a")}
          <StepsItem key="x1" value="x" data-name="x">
            <StepsTrigger>x</StepsTrigger>
          </StepsItem>
          {item("b")}
          <StepsItem key="x2" value="x" data-name="x">
            <StepsTrigger>x</StepsTrigger>
          </StepsItem>
        </StepsList>
      </Steps>,
    );

    expect(rows(container)).toEqual(["a:1+|+", "x:3|", "b:2*|**", "x:3|"]);
    expect(errors).not.toHaveBeenCalled();
  });

  it("numbers items wrapped in a consumer component and in a Fragment", () => {
    const { container } = render(
      <Steps defaultValue="c">
        <StepsList>
          <Step name="a" />
          <Fragment>
            {item("b")}
            <Step name="c" />
          </Fragment>
          {item("d")}
        </StepsList>
      </Steps>,
    );
    expect(rows(container)).toEqual(expectedRows(["a", "b", "c", "d"], "c"));
  });

  it("numbers items inside a Suspense boundary once it resolves, in document order", async () => {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
      resolve = done;
    });
    function Later({ children }: { children: ReactNode }) {
      use(promise);
      return children;
    }
    const ui = (
      <Steps defaultValue="c">
        <StepsList>
          {item("a")}
          <Suspense fallback={null}>
            <Later>
              {item("b")}
              {item("c")}
            </Later>
          </Suspense>
          {item("d")}
        </StepsList>
      </Steps>
    );
    // A mount that suspends must be awaited, or act leaves the retry and the effects unflushed.
    let view!: ReturnType<typeof render>;
    await act(async () => {
      view = render(ui);
    });
    expect(rows(view.container)).toEqual(["a:1|", "d:2|"]);

    await act(async () => {
      resolve();
      await promise;
    });
    expect(rows(view.container)).toEqual(expectedRows(["a", "b", "c", "d"], "c"));
  });

  it("registers once per item under StrictMode and moves with one click", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container, user } = setup(
      <StrictMode>
        <Flow names={["a", "b", "c"]} defaultValue="b" />
      </StrictMode>,
    );
    expect(rows(container)).toEqual(expectedRows(["a", "b", "c"], "b"));

    await user.click(triggerFor(container, "c"));
    expect(rows(container)).toEqual(expectedRows(["a", "b", "c"], "c"));
    expect(errors).not.toHaveBeenCalled();
  });

  it("keeps a nested Steps' items out of the outer numbering", async () => {
    const { container, user } = setup(
      <Steps defaultValue="a">
        <StepsList>
          {item("a", { "data-probe": "outer" } as Partial<StepsItemProps>)}
          {item("b", { "data-probe": "outer" } as Partial<StepsItemProps>)}
        </StepsList>
        <StepsPanel value="a">
          <Steps defaultValue="y">
            <StepsList>
              {item("x", { "data-probe": "inner" } as Partial<StepsItemProps>)}
              {item("y", { "data-probe": "inner" } as Partial<StepsItemProps>)}
              {item("z", { "data-probe": "inner" } as Partial<StepsItemProps>)}
            </StepsList>
          </Steps>
        </StepsPanel>
        <StepsPanel value="b">Second</StepsPanel>
      </Steps>,
    );
    const outer = "[data-probe='outer']";
    const inner = "[data-probe='inner']";
    expect(rows(container, outer)).toEqual(expectedRows(["a", "b"], "a"));
    expect(rows(container, inner)).toEqual(expectedRows(["x", "y", "z"], "y"));

    await user.click(triggerFor(container, "z"));
    expect(rows(container, inner)).toEqual(expectedRows(["x", "y", "z"], "z"));
    expect(rows(container, outer)).toEqual(expectedRows(["a", "b"], "a"));

    await user.click(triggerFor(container, "b"));
    expect(rows(container, outer)).toEqual(expectedRows(["a", "b"], "b"));
    expect(rows(container, inner)).toEqual(expectedRows(["x", "y", "z"], "z"));
  });

  it("re-registers an item whose `as` changes and keeps numbering it", () => {
    const flow = (names: string[], asDiv: boolean) => (
      <Steps defaultValue="b">
        <StepsList>
          {names.map((name) => item(name, name === "b" && asDiv ? { as: "div" } : {}))}
        </StepsList>
      </Steps>
    );
    const { container, rerender } = render(flow(["a", "b", "c"], false));
    rerender(flow(["a", "b", "c"], true));

    expect(container.querySelector("div[data-name='b']")).not.toBeNull();
    expect(rows(container)).toEqual(expectedRows(["a", "b", "c"], "b"));

    rerender(flow(["z", "a", "b", "c"], true));
    expect(rows(container)).toEqual(expectedRows(["z", "a", "b", "c"], "b"));
  });

  it("hands the element to a consumer callback ref and object ref", () => {
    const callback = vi.fn();
    const objectRef = createRef<HTMLLIElement>();
    function Refs({ names }: { names: string[] }) {
      return (
        <Steps defaultValue="b">
          <StepsList>
            {names.map((name) => {
              if (name === "a") return item(name, { ref: callback });
              if (name === "b") return item(name, { ref: objectRef });
              return item(name);
            })}
          </StepsList>
        </Steps>
      );
    }
    const { container, rerender } = render(<Refs names={["a", "b", "c"]} />);

    expect(callback).toHaveBeenLastCalledWith(container.querySelector("[data-name='a']"));
    expect(objectRef.current).toBe(container.querySelector("[data-name='b']"));
    expect(rows(container)).toEqual(expectedRows(["a", "b", "c"], "b"));

    rerender(<Refs names={["b", "c"]} />);
    expect(callback).toHaveBeenLastCalledWith(null);
    expect(objectRef.current).toBe(container.querySelector("[data-name='b']"));
    expect(rows(container)).toEqual(expectedRows(["b", "c"], "b"));
  });
});

describe("steps that change while shown", () => {
  it("keeps the same item current after a prepend and commits the clicked item", async () => {
    const onChange = vi.fn();
    const { container, rerender, user } = setup(
      <Flow names={["a", "b", "c"]} defaultValue="b" onChange={onChange} />,
    );
    rerender(<Flow names={["z", "a", "b", "c"]} defaultValue="b" onChange={onChange} />);
    expect(rows(container)).toEqual(expectedRows(["z", "a", "b", "c"], "b"));

    await user.click(triggerFor(container, "c"));
    expect(onChange).toHaveBeenCalledWith("c");
    expect(rows(container)).toEqual(expectedRows(["z", "a", "b", "c"], "c"));
  });

  it("marks nothing current or completed once the current item is removed", () => {
    const { container, rerender } = render(<Flow names={["a", "b", "c"]} value="b" />);
    rerender(<Flow names={["a", "c"]} value="b" />);

    expect(rows(container)).toEqual(["a:1|", "c:2|"]);
    const panels = [...container.querySelectorAll("[data-comp0='steps-panel']")];
    expect(panels.map((panel) => panel.hasAttribute("hidden"))).toEqual([true, true]);
  });

  it("renumbers an item rendered conditionally", () => {
    const flow = (show: boolean) => (
      <Steps defaultValue="c">
        <StepsList>
          {item("a")}
          {show && item("b")}
          {item("c")}
        </StepsList>
      </Steps>
    );
    const { container, rerender } = render(flow(false));
    expect(rows(container)).toEqual(expectedRows(["a", "c"], "c"));

    rerender(flow(true));
    expect(rows(container)).toEqual(expectedRows(["a", "b", "c"], "c"));

    rerender(flow(false));
    expect(rows(container)).toEqual(expectedRows(["a", "c"], "c"));
  });

  it("renumbers by document order after a pure keyed reorder", () => {
    const { container, rerender } = render(<Flow names={["a", "b", "c", "d"]} value="c" />);
    rerender(<Flow names={["d", "c", "b", "a"]} value="c" />);

    expect(rows(container)).toEqual(expectedRows(["d", "c", "b", "a"], "c"));
  });

  it.each([
    { from: ["a", "b", "c", "d", "e"], to: ["c", "b", "e"] },
    { from: ["e", "a", "d", "b", "c"], to: ["c", "b", "e"] },
  ])("renumbers by document order after $from becomes $to in one update", ({ from, to }) => {
    const { container, rerender } = render(<Flow names={from} value="b" />);
    rerender(<Flow names={to} value="b" />);

    expect(rows(container)).toEqual(expectedRows(to, "b"));
  });
});

describe("steps commits", () => {
  function profiled(ui: ReactElement) {
    let commits = 0;
    const view = render(
      <Profiler id="steps" onRender={() => (commits += 1)}>
        {ui}
      </Profiler>,
    );
    return {
      ...view,
      commits: () => commits,
      reset: () => {
        commits = 0;
      },
    };
  }

  it("mounts in at most two commits", () => {
    // The commit before the store took three: element state, then the root's order sync.
    const view = profiled(<Flow names={["a", "b", "c", "d"]} defaultValue="c" />);
    expect(rows(view.container)).toEqual(expectedRows(["a", "b", "c", "d"], "c"));
    expect(view.commits()).toBeLessThanOrEqual(2);
  });

  it("moves the current step in one commit without re-registering any item", () => {
    const names = ["a", "b", "c", "d", "e", "f"];
    const view = profiled(<Flow names={names} defaultValue="a" />);
    view.reset();
    // Re-registering would notify and re-sort the collection; with none, each item's
    // after-commit order check compares its element with the next one's at most once.
    const compare = vi.spyOn(Node.prototype, "compareDocumentPosition");
    // oxlint-disable-next-line comp0/no-synthetic-events -- counts the commits of exactly one click
    fireClick(triggerFor(view.container, "e"));

    expect(rows(view.container)).toEqual(expectedRows(names, "e"));
    expect(view.commits()).toBe(1);
    expect(compare.mock.calls.length).toBeLessThanOrEqual(names.length);
  });

  it("re-renders only the items, triggers, and panels whose status changes", () => {
    const names = ["a", "b", "c", "d", "e", "f"];
    const rendered = new Set<string>();
    const onRender = (id: string) => {
      rendered.add(id);
    };
    const { container } = render(
      <Steps defaultValue="c">
        <StepsList>
          {names.map((name) => (
            <Profiler key={name} id={name} onRender={onRender}>
              {item(name)}
            </Profiler>
          ))}
        </StepsList>
        {names.map((name) => (
          <Profiler key={name} id={`panel-${name}`} onRender={onRender}>
            <StepsPanel value={name}>Panel {name}</StepsPanel>
          </Profiler>
        ))}
      </Steps>,
    );
    rendered.clear();

    // oxlint-disable-next-line comp0/no-synthetic-events -- records the renders of exactly one click
    fireClick(triggerFor(container, "d"));
    expect(rows(container)).toEqual(expectedRows(names, "d"));
    expect([...rendered].sort()).toEqual(["c", "d", "panel-c", "panel-d"]);

    rendered.clear();
    // oxlint-disable-next-line comp0/no-synthetic-events -- records the renders of exactly one click
    fireClick(triggerFor(container, "a"));
    // Moving back flips every status between the two steps.
    expect(rows(container)).toEqual(expectedRows(names, "a"));
    expect([...rendered].sort()).toEqual(["a", "b", "c", "d", "panel-a", "panel-d"]);
  });

  it("follows a controlled value changed from outside when the item elements never change", async () => {
    const names = ["a", "b", "c", "d"];
    // Built once, so the owner's re-render renders no item by itself.
    const list = <StepsList>{names.map((name) => item(name))}</StepsList>;
    function Owner() {
      const [step, setStep] = useState("a");
      return (
        <>
          <button type="button" onClick={() => setStep("c")}>
            Skip
          </button>
          <Steps value={step} onChange={setStep}>
            {list}
          </Steps>
        </>
      );
    }
    const { container, user } = setup(<Owner />);
    expect(rows(container)).toEqual(expectedRows(names, "a"));

    await user.click(container.querySelector<HTMLButtonElement>(":scope > button")!);
    expect(rows(container)).toEqual(expectedRows(names, "c"));

    await user.click(triggerFor(container, "b"));
    expect(rows(container)).toEqual(expectedRows(names, "b"));
  });

  it("re-renders no item when a controlled value rejects the change", () => {
    const names = ["a", "b", "c"];
    const rendered = new Set<string>();
    const { container } = render(
      <Steps value="b" onChange={() => {}}>
        <StepsList>
          {names.map((name) => (
            <Profiler key={name} id={name} onRender={(id) => rendered.add(id)}>
              {item(name)}
            </Profiler>
          ))}
        </StepsList>
      </Steps>,
    );
    rendered.clear();

    // oxlint-disable-next-line comp0/no-synthetic-events -- records the renders of exactly one click
    fireClick(triggerFor(container, "c"));
    expect(rows(container)).toEqual(expectedRows(names, "b"));
    expect([...rendered]).toEqual([]);
  });
});

/** What the committed DOM shows: current item, current trigger, visible panel, completed items. */
function shown(root: Element) {
  const names = (selector: string) =>
    [...root.querySelectorAll(selector)].map((element) =>
      element.closest("[data-name]")?.getAttribute("data-name"),
    );
  const panel = root.querySelector("[data-comp0='steps-panel']:not([hidden])");
  return [
    `cur=${names("li[data-current]").join(",")}`,
    `trig=${names("button[aria-current='step']").join(",")}`,
    `panel=${panel?.getAttribute("data-panel") ?? ""}`,
    `done=${names("li[data-completed]").join(",")}`,
  ].join(" ");
}

const CONSISTENT = ["a", "b", "c", "d"];

const shownFor = (value: string) => {
  const index = CONSISTENT.indexOf(value);
  return `cur=${value} trig=${value} panel=${value} done=${CONSISTENT.slice(0, index).join(",")}`;
};

function consistentSteps(props: { value?: string; onChange: (value: string) => void }) {
  return (
    <Steps {...props}>
      <StepsList>{CONSISTENT.map((name) => item(name))}</StepsList>
      {CONSISTENT.map((name) => (
        <StepsPanel key={name} value={name} data-panel={name}>
          <input aria-label={name} data-input={name} />
        </StepsPanel>
      ))}
    </Steps>
  );
}

/**
 * Logs what the DOM shows from the owner's layout and passive effects on `step`, and focuses the
 * input in the step's panel the way a consumer would, which fails while that panel is hidden.
 */
function useWatchedStep(step: string, root: { current: HTMLElement | null }, log: string[]) {
  useLayoutEffect(() => {
    log.push(`layout ${step}: ${shown(root.current!)}`);
  }, [step, root, log]);
  useEffect(() => {
    log.push(`effect ${step}: ${shown(root.current!)}`);
    root.current!.querySelector<HTMLInputElement>(`[data-input='${step}']`)!.focus();
  }, [step, root, log]);
}

describe("every commit agrees with the value Steps rendered", () => {
  it.each([
    { transition: false, strict: false },
    { transition: true, strict: false },
    { transition: false, strict: true },
    { transition: true, strict: true },
  ])(
    "for a controlled value (transition: $transition, StrictMode: $strict)",
    async ({ transition, strict }) => {
      const log: string[] = [];
      function Owner() {
        const [step, setStep] = useState("a");
        const root = useRef<HTMLDivElement>(null);
        useWatchedStep(step, root, log);
        const change = (next: string) => {
          if (transition) startTransition(() => setStep(next));
          else setStep(next);
        };
        return (
          <div ref={root}>
            <button type="button" data-skip="" onClick={() => change("c")}>
              Skip
            </button>
            {consistentSteps({ value: step, onChange: change })}
          </div>
        );
      }
      let ui = <Owner />;
      if (strict) ui = <StrictMode>{ui}</StrictMode>;
      const { container, user } = setup(ui);

      await user.click(container.querySelector("[data-skip]")!);
      await user.click(triggerFor(container, "b"));
      await user.click(triggerFor(container, "d"));

      expect(log.length).toBeGreaterThanOrEqual(8);
      for (const entry of log) {
        const step = entry.split(" ")[1]!.slice(0, -1);
        expect(entry).toBe(`${entry.split(":")[0]}: ${shownFor(step)}`);
      }
      expect(document.activeElement?.getAttribute("data-input")).toBe("d");
    },
  );

  it("for an uncontrolled value the owner follows through onChange", async () => {
    const log: string[] = [];
    function Owner() {
      const [seen, setSeen] = useState("a");
      const root = useRef<HTMLDivElement>(null);
      useWatchedStep(seen, root, log);
      return <div ref={root}>{consistentSteps({ onChange: setSeen })}</div>;
    }
    const { container, user } = setup(
      <StrictMode>
        <Owner />
      </StrictMode>,
    );
    // The uncontrolled Steps starts at "" until a step is chosen, so the first entries show none.
    log.length = 0;

    await user.click(triggerFor(container, "c"));
    await user.click(triggerFor(container, "b"));

    expect(log.length).toBeGreaterThanOrEqual(4);
    for (const entry of log) {
      const step = entry.split(" ")[1]!.slice(0, -1);
      expect(entry).toBe(`${entry.split(":")[0]}: ${shownFor(step)}`);
    }
    expect(document.activeElement?.getAttribute("data-input")).toBe("b");
  });
});

type Wrap = "plain" | "fragment" | "component";
type GeneratedCase = { names: string[]; current: string; nested: boolean };

const POOL = ["a", "b", "c", "d", "e", "f"];
const WRAPS: readonly Wrap[] = ["plain", "fragment", "component"];

const generatedCase: fc.Arbitrary<GeneratedCase> = fc.record({
  names: fc.shuffledSubarray(POOL),
  current: fc.constantFrom(...POOL, "missing", ""),
  nested: fc.boolean(),
});

/** Inner items never count toward the outer Steps. */
const INNER = ["x", "y", "z"];

const innerSteps = (
  <Steps defaultValue="y">
    <StepsList>
      {INNER.map((inner) => item(inner, { "data-inner": "" } as Partial<StepsItemProps>))}
    </StepsList>
  </Steps>
);

function generatedSteps({ names, current, nested }: GeneratedCase) {
  return (
    <Steps value={current} onChange={() => {}}>
      <StepsList>
        {names.map((name) => {
          // A name keeps its wrap across cases, so successive cases move kept items.
          const wrap = WRAPS[POOL.indexOf(name) % WRAPS.length];
          if (wrap === "component") return <Step key={name} name={name} />;
          if (wrap === "fragment") return <Fragment key={name}>{item(name)}</Fragment>;
          return item(name);
        })}
      </StepsList>
      {names.map((name, index) => (
        <StepsPanel key={name} value={name}>
          {nested && index === 0 ? innerSteps : name}
        </StepsPanel>
      ))}
    </Steps>
  );
}

const outerRows = (container: Element) =>
  rows(container, "[data-comp0='steps-item']:not([data-inner])");

describe("steps positions over generated item lists", () => {
  it("match document order on the client after every change, and on the server", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const server = document.createElement("div");
    const hostile: GeneratedCase[][] = [
      [{ names: [], current: "a", nested: false }],
      [{ names: ["a"], current: "a", nested: false }],
      [{ names: ["a", "b", "c"], current: "missing", nested: true }],
      [
        { names: ["a", "b", "c"], current: "b", nested: false },
        { names: ["a", "c"], current: "b", nested: false },
      ],
      [
        { names: ["a", "b", "c", "d"], current: "c", nested: false },
        { names: ["d", "c", "b", "a"], current: "c", nested: false },
      ],
      [
        { names: ["b", "c", "d"], current: "c", nested: false },
        { names: ["a", "b", "c", "d"], current: "c", nested: true },
      ],
    ];
    fc.assert(
      fc.property(fc.array(generatedCase, { minLength: 1, maxLength: 4 }), (sequence) => {
        const view = render(generatedSteps(sequence[0]!));
        try {
          for (const generated of sequence) {
            const ui = generatedSteps(generated);
            view.rerender(ui);
            const expected = expectedRows(generated.names, generated.current);
            expect(outerRows(view.container)).toEqual(expected);
            server.innerHTML = renderToString(ui);
            expect(outerRows(server)).toEqual(expected);
            if (generated.nested && generated.names.length > 0) {
              const inner = expectedRows(INNER, "y");
              expect(rows(view.container, "[data-inner]")).toEqual(inner);
              expect(rows(server, "[data-inner]")).toEqual(inner);
            }
          }
        } finally {
          view.unmount();
        }
      }),
      { numRuns: 1000, examples: hostile.map((sequence) => [sequence]) },
    );
    expect(errors).not.toHaveBeenCalled();
  }, 180_000);
});
