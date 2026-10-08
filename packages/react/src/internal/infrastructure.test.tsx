import { createRef, Fragment, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, render, setup } from "../../test/render.js";
import { createRequiredContext } from "./context.js";
import { FormValue } from "./form-value.js";
import { partElement, rootElement, type AsProp, type RootProps } from "./polymorphic.js";

describe("createRequiredContext", () => {
  const [ExampleContext, useExample, useOptionalExample] = createRequiredContext<{
    label: string;
  }>("Example");

  function Part() {
    return <span>{useExample("ExamplePart").label}</span>;
  }

  function OptionalPart() {
    return <span>{useOptionalExample()?.label ?? "standalone"}</span>;
  }

  it("reads the provided value and names the root in its display name", () => {
    const { container } = render(
      <ExampleContext value={{ label: "inside" }}>
        <Part />
        <OptionalPart />
      </ExampleContext>,
    );

    expect(container.textContent).toBe("insideinside");
    expect(ExampleContext.displayName).toBe("ExampleContext");
  });

  it("throws a part-specific error outside the root and lets optional parts stand alone", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<Part />)).toThrow("ExamplePart must be rendered inside Example.");
    vi.restoreAllMocks();

    expect(render(<OptionalPart />).container.textContent).toBe("standalone");
  });
});

type ExampleRootProps = RootProps<{ value?: string | undefined; children?: ReactNode }>;

function ExampleRoot({ as, children, value, ...props }: ExampleRootProps) {
  const Root = rootElement(as);
  return (
    <Root {...props} data-value={value}>
      {children}
    </Root>
  );
}

type ExamplePartProps = AsProp & { className?: string; onClick?: () => void; children?: ReactNode };

function ExamplePart({ as, ...props }: ExamplePartProps) {
  const Part = partElement(as, "button");
  return <Part {...props} type="button" data-part="" />;
}

describe("polymorphic helpers", () => {
  it("renders a root's children directly unless as names an element", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <>
        <ExampleRoot value="bare">
          <i>bare</i>
        </ExampleRoot>
        <ExampleRoot as={Fragment}>
          <i>fragment</i>
        </ExampleRoot>
        <ExampleRoot as="div" className="wrapper" ref={ref} value="wrapped">
          <i>wrapped</i>
        </ExampleRoot>
      </>,
    );

    expect(container.children).toHaveLength(3);
    expect(ref.current?.tagName).toBe("DIV");
    expect(ref.current?.className).toBe("wrapper");
    expect(ref.current?.dataset.value).toBe("wrapped");
  });

  it("types DOM props on a root as errors unless as is set", () => {
    // @ts-expect-error className would be dropped without an element to render.
    const bare = <ExampleRoot className="dropped" />;
    // @ts-expect-error ref has nothing to attach to without an element to render.
    const bareRef = <ExampleRoot ref={createRef<HTMLDivElement>()} />;
    const wrapped = <ExampleRoot as="div" className="kept" />;

    expect([bare, bareRef, wrapped]).toHaveLength(3);
  });

  it("types a part's attributes and ref from its fallback tag", () => {
    const buttonRef = createRef<HTMLButtonElement>();

    function TypedPart() {
      const Part = partElement(undefined, "button");
      return (
        <>
          <Part ref={buttonRef} type="button" data-state="open" aria-expanded="true" />
          {/* @ts-expect-error href is not a button attribute. */}
          <Part href="#nope" />
          {/* @ts-expect-error a button part's ref is a button ref. */}
          <Part ref={createRef<HTMLDivElement>()} />
          {/* @ts-expect-error type only accepts button types. */}
          <Part type="checkbox" />
        </>
      );
    }

    const { container } = render(<TypedPart />);

    expect(buttonRef.current).toBe(container.querySelector("button"));
    expect(buttonRef.current?.getAttribute("aria-expanded")).toBe("true");
  });

  it("types a typed root's attributes from its tag", () => {
    function TypedRoot() {
      const Root = rootElement<"ul">("ul");
      return (
        <>
          <Root data-kind="list" ref={createRef<HTMLUListElement>()} />
          {/* @ts-expect-error a ul root's ref is a ul ref. */}
          <Root ref={createRef<HTMLButtonElement>()} />
          {/* @ts-expect-error unknown attributes are not part of a ul. */}
          <Root unknownAttribute="x" />
        </>
      );
    }

    expect(render(<TypedRoot />).container.querySelectorAll("ul")).toHaveLength(3);
  });

  it("renders a part as its fallback tag or the as element", () => {
    const { container } = render(
      <>
        <ExamplePart>Default</ExamplePart>
        <ExamplePart as="a">Anchor</ExamplePart>
      </>,
    );

    expect(container.querySelector("button")?.dataset.part).toBe("");
    expect(container.querySelector("a")?.dataset.part).toBe("");
  });

  it("merges a Fragment part into its single child with mergeProps semantics", () => {
    const calls: string[] = [];
    const childRef = createRef<HTMLAnchorElement>();
    const { container } = render(
      <ExamplePart as={Fragment} className="part" onClick={() => calls.push("part")}>
        <a ref={childRef} className="child" href="#target" onClick={() => calls.push("child")}>
          Child
        </a>
      </ExamplePart>,
    );
    const anchor = container.querySelector("a")!;

    // oxlint-disable-next-line comp0/no-synthetic-events -- the merged anchor's click must not navigate the jsdom page
    fireClick(anchor);

    expect(container.querySelector("button")).toBeNull();
    expect(childRef.current).toBe(anchor);
    expect(anchor.className).toBe("child part");
    expect(anchor.textContent).toBe("Child");
    expect(anchor.dataset.part).toBe("");
    expect(calls).toEqual(["child", "part"]);
  });

  it("stops the part's handler when the child prevents default", () => {
    const part = vi.fn();
    const { container } = render(
      <ExamplePart as={Fragment} onClick={part}>
        <a href="#target" onClick={(event) => event.preventDefault()}>
          Child
        </a>
      </ExamplePart>,
    );

    // oxlint-disable-next-line comp0/no-synthetic-events -- the merged anchor's click must not navigate the jsdom page
    fireClick(container.querySelector("a")!);

    expect(part).not.toHaveBeenCalled();
  });

  it("requires exactly one element child for a Fragment part", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() => render(<ExamplePart as={Fragment}>text</ExamplePart>)).toThrow(
      "A part rendered as={Fragment} needs exactly one element child.",
    );
    vi.restoreAllMocks();
  });
});

describe("FormValue", () => {
  it("submits one hidden input per value and nothing without a name or value", () => {
    const { container } = render(
      <form>
        <FormValue name="size" value="small" />
        <FormValue name="tags" value={["a", "b"]} form="other" disabled />
        <FormValue name={undefined} value="ignored" />
        <FormValue name="missing" value={undefined} />
      </form>,
    );
    const inputs = [...container.querySelectorAll("input")];

    expect(inputs.map((input) => [input.name, input.value, input.type])).toEqual([
      ["size", "small", "hidden"],
      ["tags", "a", "hidden"],
      ["tags", "b", "hidden"],
    ]);
    expect(inputs[1]?.getAttribute("form")).toBe("other");
    expect(inputs[1]?.disabled).toBe(true);
    expect([...new FormData(container.querySelector("form")!).entries()]).toEqual([
      ["size", "small"],
    ]);
  });
});

describe("setup", () => {
  it("drives real pointer and keyboard sequences through user", async () => {
    const calls: string[] = [];
    const { getByRole, user } = setup(
      <button type="button" onClick={() => calls.push("click")} onFocus={() => calls.push("focus")}>
        Press
      </button>,
    );
    const button = getByRole("button");

    await user.click(button);
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(document.activeElement).toBe(button);
    expect(calls).toEqual(["focus", "click", "click", "click"]);
  });
});
