import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Input } from "../text-field/Input.js";
import { TextField } from "../text-field/TextField.js";
import { CharacterCount } from "./CharacterCount.js";

function spyOnWarnings() {
  return vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("character count", () => {
  it("counts the field value and participates in its description", async () => {
    const { getByRole, user } = setup(
      <TextField id="message" defaultValue="Hello">
        <Input maxLength={10} />
        <CharacterCount maxLength={10}>{({ remaining }) => `${remaining} left`}</CharacterCount>
      </TextField>,
    );
    const input = getByRole("textbox");
    const status = getByRole("status");

    expect(status.textContent).toBe("5 left");
    expect(status.getAttribute("for")).toBe("message");
    expect(input.getAttribute("aria-describedby")?.split(" ")).toContain(status.id);

    await user.type(input, " you");
    expect(status.textContent).toBe("1 left");
    expect(status.getAttribute("data-remaining")).toBe("1");
    expect(status.hasAttribute("data-limit-reached")).toBe(false);

    await user.type(input, "!");
    expect(status.hasAttribute("data-limit-reached")).toBe(true);
  });

  it("warns and rounds an out-of-range character limit to a non-negative integer", () => {
    const warn = spyOnWarnings();
    const { getByRole } = render(
      <TextField defaultValue="">
        <CharacterCount maxLength={-1.5} />
      </TextField>,
    );

    expect(getByRole("status").textContent).toBe("0 characters remaining");
    expect(warn).toHaveBeenCalledWith(
      "CharacterCount maxLength must be a non-negative integer; received -1.5. It was rounded to 0.",
    );
    warn.mockRestore();
  });

  it("warns and renders nothing for a non-finite limit", () => {
    const warn = spyOnWarnings();
    const { queryByRole } = render(
      <TextField defaultValue="">
        <CharacterCount maxLength={Number.NaN} />
      </TextField>,
    );

    expect(queryByRole("status")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "CharacterCount maxLength must be a non-negative integer; received NaN. It was not rendered.",
    );
    warn.mockRestore();
  });

  it("warns and renders nothing when the TextField state is not observable", () => {
    const warn = spyOnWarnings();
    const { queryByRole } = render(
      <TextField>
        <CharacterCount maxLength={10} />
      </TextField>,
    );

    expect(queryByRole("status")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "CharacterCount requires TextField value, defaultValue, or onChange so it can observe the text. It was not rendered.",
    );
    warn.mockRestore();
  });

  it("warns and renders nothing outside a TextField", () => {
    const warn = spyOnWarnings();
    const { queryByRole } = render(<CharacterCount maxLength={10} />);

    expect(queryByRole("status")).toBeNull();
    expect(warn).toHaveBeenCalledWith(
      "CharacterCount must be rendered inside TextField. It was not rendered.",
    );
    warn.mockRestore();
  });
});
