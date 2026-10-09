import { Fragment, useState } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { Output } from "./Output.js";

function Price() {
  const [seats, setSeats] = useState(2);
  return (
    <form aria-label="Pricing">
      <input
        id="seats"
        type="number"
        min={1}
        max={10}
        aria-label="Seats"
        value={seats}
        onChange={(event) => {
          setSeats(Number(event.target.value));
        }}
      />
      <Output htmlFor="seats" name="total">
        ${seats * 12}
      </Output>
    </form>
  );
}

describe("output composition", () => {
  it("renders the native output element with its implicit status role", () => {
    const { getByRole } = setup(<Output htmlFor="a">24</Output>);

    const output = getByRole("status");
    expect(output.tagName).toBe("OUTPUT");
    expect(output.getAttribute("data-slot")).toBe("output");
  });

  it("joins a list of control ids into the for attribute", () => {
    const { getByRole } = setup(<Output htmlFor={["a", "b"]}>3</Output>);

    expect(getByRole("status").getAttribute("for")).toBe("a b");
  });

  it("keeps a single id and omits for without one", () => {
    const { getAllByRole } = setup(
      <>
        <Output htmlFor="a">1</Output>
        <Output>2</Output>
      </>,
    );

    const [first, second] = getAllByRole("status");
    expect(first?.getAttribute("for")).toBe("a");
    expect(second?.hasAttribute("for")).toBe(false);
  });

  it("follows the control it is computed from and submits under its name", async () => {
    const { getByRole, getByLabelText, user } = setup(<Price />);

    expect(getByRole("status").textContent).toContain("$24");
    await user.clear(getByLabelText("Seats"));
    await user.type(getByLabelText("Seats"), "4");
    expect(getByRole("status").textContent).toContain("$48");
    expect(
      ((getByRole("form") as HTMLFormElement).elements.namedItem("total") as HTMLOutputElement)
        .value,
    ).toBe("$48");
  });

  it("renders as another element and merges into a Fragment child", () => {
    const { getByTestId } = setup(
      <>
        <Output as="p" data-testid="p">
          1
        </Output>
        <Output as={Fragment}>
          <strong data-testid="strong">2</strong>
        </Output>
      </>,
    );

    expect(getByTestId("p").tagName).toBe("P");
    expect(getByTestId("strong").getAttribute("data-slot")).toBe("output");
  });
});
