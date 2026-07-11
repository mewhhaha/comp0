import { describe, expect, it, vi } from "vitest";
import { createRef, type ReactElement, useEffect, useState } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  composeRefs,
  dataAttr,
  dataAttributes,
  getRovingFocusTarget,
  mergeProps,
  sortByDocumentPosition,
  useControllableState,
  useFocusRing,
} from "./index.js";
import { findTypeaheadMatch } from "./typeahead.js";

function render(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return {
    container,
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
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

  it("creates presence-based data attributes", () => {
    expect(dataAttr(true)).toBe("");
    expect(dataAttr(false)).toBeUndefined();
    expect(dataAttributes({ selected: true, disabled: false })).toEqual({ "data-selected": "" });
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
  it("keeps logical collection keys separate from DOM ids", () => {
    const first = document.createElement("div");
    const second = document.createElement("div");
    document.body.append(first, second);

    const items = sortByDocumentPosition([
      { key: 2, id: "option-second", value: "second", textValue: "Second", element: second },
      { key: 1, id: "option-first", value: "first", textValue: "First", element: first },
    ]);

    expect(items.map((item) => item.key)).toEqual([1, 2]);
    expect(items.map((item) => item.id)).toEqual(["option-first", "option-second"]);
    first.remove();
    second.remove();
  });

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

describe("useFocusRing", () => {
  it("subscribes lazily to the focused element's document and cleans up listeners", () => {
    function Focusable() {
      const { focusProps, isFocusVisible } = useFocusRing<HTMLButtonElement>();
      return (
        <button type="button" {...focusProps} data-focus-visible={dataAttr(isFocusVisible)}>
          Focus
        </button>
      );
    }

    const { container, unmount } = render(<Focusable />);
    const button = container.querySelector("button");
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");

    expect(addListener).not.toHaveBeenCalledWith("keydown", expect.any(Function), true);

    act(() => {
      button?.focus();
    });

    expect(addListener).toHaveBeenCalledWith("keydown", expect.any(Function), true);
    expect(addListener).toHaveBeenCalledWith("pointerdown", expect.any(Function), true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Tab" }));
    });

    expect(button?.getAttribute("data-focus-visible")).toBe("");

    act(() => {
      button?.blur();
    });

    expect(removeListener).toHaveBeenCalledWith("keydown", expect.any(Function), true);
    expect(removeListener).toHaveBeenCalledWith("pointerdown", expect.any(Function), true);
    unmount();
  });
});
