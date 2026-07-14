import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { render } from "../test/render.js";
import { Description } from "./components/Description.js";
import { FieldError } from "./components/FieldError.js";
import { Input } from "./components/Input.js";
import { Label } from "./components/Label.js";
import { TextField } from "./components/TextField.js";

describe("field feedback wiring", () => {
  it("renders feedback relationships in server markup", () => {
    const markup = renderToString(
      <TextField id="server-name" invalid>
        <Label>Name</Label>
        <Input name="name" />
        <Description>Shown on your profile.</Description>
        <FieldError>Enter a name.</FieldError>
      </TextField>,
    );

    expect(markup).toContain('aria-describedby="server-name-description server-name-error"');
    expect(markup).toContain('id="server-name-description"');
    expect(markup).toContain('id="server-name-error"');
  });

  it("does not reference a conditional error that is absent from server markup", () => {
    const markup = renderToString(
      <TextField id="server-name">
        <Input name="name" />
        <FieldError>Enter a name.</FieldError>
      </TextField>,
    );

    expect(markup).not.toContain("server-name-error");
  });

  it("omits aria-describedby ids for feedback that is not rendered", () => {
    const { container, unmount } = render(
      <TextField>
        <Label>Name</Label>
        <Input name="name" />
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("aria-describedby")).toBeNull();
    unmount();
  });

  it("links only the feedback that actually exists", () => {
    const { container, rerender, unmount } = render(
      <TextField>
        <Label>Name</Label>
        <Input name="name" />
        <Description>Shown on your profile.</Description>
      </TextField>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const description = container.querySelector<HTMLElement>("div:not(:has(*))")!;
    expect(input.getAttribute("aria-describedby")).toBe(description.id);

    rerender(
      <TextField invalid>
        <Label>Name</Label>
        <Input name="name" />
        <Description>Shown on your profile.</Description>
        <FieldError>Enter a name.</FieldError>
      </TextField>,
    );
    const error = container.querySelector<HTMLElement>("[role='alert']")!;
    const describedBy = input.getAttribute("aria-describedby")!.split(" ");
    expect(describedBy).toContain(description.id);
    expect(describedBy).toContain(error.id);
    unmount();
  });
});
