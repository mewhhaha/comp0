import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { FormValue } from "./form-value.js";

function hiddenInputs(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLInputElement>("input")];
}

describe("FormValue", () => {
  it("renders nothing without a name or a value", () => {
    const withoutName = render(<FormValue name={undefined} value="a" />);
    expect(hiddenInputs(withoutName.container)).toHaveLength(0);
    const withoutValue = render(<FormValue name="field" value={undefined} />);
    expect(hiddenInputs(withoutValue.container)).toHaveLength(0);
  });

  it("submits a single value as one hidden input", () => {
    const { container } = render(
      <form>
        <FormValue name="code" value="1234" />
      </form>,
    );
    const [input] = hiddenInputs(container);

    expect(input?.type).toBe("hidden");
    expect(new FormData(container.querySelector("form")!).getAll("code")).toEqual(["1234"]);
  });

  it("submits each value of a list as its own input", () => {
    const { container } = render(
      <form>
        <FormValue name="tags" value={["a", "b", "c"]} />
      </form>,
    );

    expect(new FormData(container.querySelector("form")!).getAll("tags")).toEqual(["a", "b", "c"]);
  });

  it("anchors the ref on the first input and forwards form and disabled", () => {
    const ref = createRef<HTMLInputElement>();
    const { container } = render(
      <>
        <form id="outside" />
        <FormValue ref={ref} name="tags" value={["a", "b"]} form="outside" disabled />
      </>,
    );
    const inputs = hiddenInputs(container);

    expect(ref.current).toBe(inputs[0]);
    expect(inputs.every((input) => input.getAttribute("form") === "outside")).toBe(true);
    expect(inputs.every((input) => input.disabled)).toBe(true);
    expect(new FormData(container.querySelector("form")!).getAll("tags")).toEqual([]);
  });

  it("renders an empty list as no inputs", () => {
    const { container } = render(<FormValue name="tags" value={[]} />);
    expect(hiddenInputs(container)).toHaveLength(0);
  });
});
