import { describe, expect, it, vi } from "vitest";
import { createRef, type ReactElement, useEffect, useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  Slot,
  composeRefs,
  dataAttr,
  dataAttributes,
  getRovingFocusTarget,
  mergeProps,
  renderProp,
  useControllableState,
} from "./index.js";
import { findTypeaheadMatch } from "./typeahead.js";

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return { container };
}

describe("shared utilities", () => {
  it("merges classes, styles, and event handlers", () => {
    const first = vi.fn();
    const second = vi.fn();
    const props = mergeProps(
      { className: "a", style: { color: "red" }, onClick: first },
      { className: "b", style: { background: "blue" }, onClick: second },
    );

    props.onClick({ defaultPrevented: false });

    expect(props.className).toBe("a b");
    expect(props.style).toEqual({ color: "red", background: "blue" });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it("composes callback and object refs", () => {
    const objectRef = createRef<HTMLButtonElement>();
    const callbackRef = vi.fn();
    const ref = composeRefs(objectRef, callbackRef);
    const element = document.createElement("button");

    ref(element);

    expect(objectRef.current).toBe(element);
    expect(callbackRef).toHaveBeenCalledWith(element);
  });

  it("renders render props and data attributes", () => {
    expect(
      renderProp<{ selected: boolean }>(({ selected }) => (selected ? "yes" : "no"), {
        selected: true,
      }),
    ).toBe("yes");
    expect(dataAttr(true)).toBe("");
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttributes({ selected: true, disabled: false })).toEqual({ "data-selected": "" });
  });

  it("merges props through Slot", () => {
    const clicked = vi.fn();
    const { container } = render(
      <Slot className="from-slot" data-open="" onClick={clicked}>
        <button type="button" className="from-child">
          Save
        </button>
      </Slot>,
    );

    const button = container.querySelector("button");
    button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(button?.className).toBe("from-child from-slot");
    expect(button?.getAttribute("data-open")).toBe("");
    expect(clicked).toHaveBeenCalledOnce();
  });
});

describe("state utilities", () => {
  it("supports uncontrolled state", () => {
    function Counter() {
      const [value, setValue] = useControllableState({ defaultValue: 0 });
      return (
        <button type="button" onClick={() => setValue((current) => current + 1)}>
          {value}
        </button>
      );
    }

    const { container } = render(<Counter />);
    const button = container.querySelector("button");

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(button?.textContent).toBe("1");
  });

  it("keeps controlled state external", () => {
    const changed = vi.fn();

    function Controlled() {
      const [outer, setOuter] = useState("a");
      const [value, setValue] = useControllableState({
        value: outer,
        defaultValue: "x",
        onChange: changed,
      });

      useEffect(() => {
        setOuter("b");
      }, []);

      return (
        <button type="button" onClick={() => setValue("c")}>
          {value}
        </button>
      );
    }

    const { container } = render(<Controlled />);
    const button = container.querySelector("button");

    expect(button?.textContent).toBe("b");
    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(button?.textContent).toBe("b");
    expect(changed).toHaveBeenCalledWith("c");
  });
});

describe("focus navigation primitives", () => {
  it("finds roving focus targets by orientation", () => {
    const items = [{ key: "one" }, { key: "two", disabled: true }, { key: "three" }];

    expect(getRovingFocusTarget(items, "one", "ArrowDown", { orientation: "vertical" })).toBe(
      "three",
    );
    expect(getRovingFocusTarget(items, "one", "End")).toBe("three");
    expect(getRovingFocusTarget(items, "three", "ArrowDown", { loop: true })).toBe("one");
  });

  it("finds typeahead matches after the current item", () => {
    const items = [
      { key: "alpha", textValue: "Alpha" },
      { key: "apricot", textValue: "Apricot" },
      { key: "banana", textValue: "Banana" },
    ];

    expect(findTypeaheadMatch(items, "a", "alpha")).toBe("apricot");
    expect(findTypeaheadMatch(items, "ban", "alpha")).toBe("banana");
  });
});
