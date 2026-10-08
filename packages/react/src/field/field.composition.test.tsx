import { Fragment } from "react";
import { describe, expect, it } from "vitest";
import { render } from "../../test/render.js";
import { Description } from "./Description.js";
import { FieldError } from "./FieldError.js";
import { Fieldset } from "./Fieldset.js";
import { Label } from "./Label.js";
import { Legend } from "./Legend.js";

describe("field parts", () => {
  it("renders the element named by as and merges into a Fragment child", () => {
    const { container } = render(
      <Fieldset as="section" invalid>
        <Legend as="h2">Contact</Legend>
        <Label as="span">Email</Label>
        <Description as="p">For receipts.</Description>
        <FieldError as={Fragment}>
          <strong className="error">Enter an email.</strong>
        </FieldError>
      </Fieldset>,
    );

    expect(container.querySelector("section[data-invalid]")).not.toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("Contact");
    expect(container.querySelector("span")?.textContent).toBe("Email");
    expect(container.querySelector("p")?.textContent).toBe("For receipts.");
    const error = container.querySelector("strong")!;
    expect(error.getAttribute("role")).toBe("alert");
    expect(error.className).toBe("error");
  });
});
