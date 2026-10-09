import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createGenUIStore } from "./state/store.js";
import { GenUI } from "./render/GenUI.js";
import { type GenUIAction } from "./render/context.js";
import { renderResponse, renderStack } from "../test/render.js";

const signup = {
  type: "Stack",
  children: [
    {
      type: "Form",
      name: "signup",
      title: "Sign up",
      submitLabel: "Create account",
      children: [
        { type: "TextField", label: "Email", name: "email" },
        {
          type: "Select",
          label: "Plan",
          name: "plan",
          options: [
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
          ],
        },
        { type: "NumberField", label: "Seats", name: "seats" },
      ],
    },
  ],
};

function events() {
  const received: GenUIAction[] = [];
  return { received, onAction: (event: GenUIAction) => void received.push(event) };
}

describe("form state", () => {
  it("stores values under the form name and reports them through onStateChange", async () => {
    const onStateChange = vi.fn();
    const { getByRole, user } = renderResponse(signup, { onStateChange });

    await user.type(getByRole("textbox", { name: "Email" }), "ada@example.com");

    expect(onStateChange).toHaveBeenLastCalledWith({ "signup.email": "ada@example.com" });
  });

  it("restores values from initialState", () => {
    const { getByRole } = renderResponse(signup, {
      initialState: { "signup.email": "grace@example.com", "signup.seats": 3 },
    });

    expect((getByRole("textbox", { name: "Email" }) as HTMLInputElement).value).toBe(
      "grace@example.com",
    );
    expect((getByRole("spinbutton", { name: "Seats" }) as HTMLInputElement).value).toBe("3");
  });

  it("keeps the person's value over the model's default while the response grows", async () => {
    const response =
      '{"type": "Stack", "children": [{"type": "TextField", "label": "Name", "name": "name", "value": "Ada"}';
    const { getByRole, user, rerender } = renderResponse(response, { streaming: true });
    const input = getByRole("textbox", { name: "Name" }) as HTMLInputElement;

    await user.clear(input);
    await user.type(input, "Grace");
    rerender(<GenUI response={`${response}]}`} streaming={false} />);

    expect((getByRole("textbox", { name: "Name" }) as HTMLInputElement).value).toBe("Grace");
  });

  it("stores controls outside a form under their own name", async () => {
    const onStateChange = vi.fn();
    const { getByRole, user } = renderStack([{ type: "TextField", label: "Name", name: "name" }], {
      onStateChange,
    });

    await user.type(getByRole("textbox", { name: "Name" }), "Ada");

    expect(onStateChange).toHaveBeenLastCalledWith({ name: "Ada" });
  });

  it("stores a bound control under its binding name, in or out of a form", async () => {
    const onStateChange = vi.fn();
    const { getByRole, user } = renderResponse(
      {
        type: "Form",
        name: "f",
        title: "F",
        children: [
          {
            type: "TextField",
            label: "Name",
            name: "name",
            value: { $bind: "who", initial: "Ada" },
          },
        ],
      },
      { onStateChange },
    );

    await user.type(getByRole("textbox", { name: "Name" }), "m");

    expect(onStateChange).toHaveBeenLastCalledWith({ who: "Adam" });
  });

  it("derives a key from the label when the model forgets the name", async () => {
    const onStateChange = vi.fn();
    const { getByRole, user } = renderStack([{ type: "TextField", label: "Full name", name: "" }], {
      onStateChange,
    });

    await user.type(getByRole("textbox", { name: "Full name" }), "A");

    expect(onStateChange).toHaveBeenLastCalledWith({ "full-name": "A" });
  });

  it("writes defaults into the store once the response is complete, and not an edit", () => {
    const store = createGenUIStore();
    const onStateChange = vi.fn();
    const response = {
      type: "Stack",
      children: [
        { type: "TextField", label: "Name", name: "name", value: "Ada" },
        {
          type: "Slider",
          label: "Seats",
          name: "seats",
          value: { $bind: "seats", initial: 4 },
          min: 0,
          max: 9,
        },
        { type: "Slider", label: "Volume", name: "volume", min: 2, max: 9 },
      ],
    };

    const streaming = renderResponse(response, { store, streaming: true, onStateChange });
    expect(store.getSnapshot()).toEqual({});
    streaming.rerender(
      <GenUI response={JSON.stringify(response)} store={store} onStateChange={onStateChange} />,
    );

    expect(store.getSnapshot()).toEqual({ name: "Ada", seats: 4, volume: 2 });
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("keeps state in a store the host owns across remounts", async () => {
    const store = createGenUIStore();
    const first = renderStack([{ type: "TextField", label: "Name", name: "name" }], { store });
    await first.user.type(first.getByRole("textbox", { name: "Name" }), "Ada");
    first.unmount();

    const second = renderStack([{ type: "TextField", label: "Name", name: "name" }], { store });

    expect((second.getByRole("textbox", { name: "Name" }) as HTMLInputElement).value).toBe("Ada");
  });

  it("ignores a stored value of the wrong type", () => {
    const { getByRole } = renderStack(
      [
        { type: "NumberField", label: "Seats", name: "seats" },
        { type: "TextField", label: "Name", name: "name" },
        { type: "Switch", label: "On", name: "on" },
        { type: "CheckboxGroup", label: "Pick", name: "pick", options: ["a", "b"] },
      ],
      { initialState: { seats: "lots", name: 5, on: "yes", pick: "a" } },
    );

    expect((getByRole("spinbutton", { name: "Seats" }) as HTMLInputElement).value).toBe("");
    expect((getByRole("textbox", { name: "Name" }) as HTMLInputElement).value).toBe("");
    expect(getByRole("switch", { name: "On" }).getAttribute("aria-checked")).toBe("false");
    expect((getByRole("checkbox", { name: "a" }) as HTMLInputElement).checked).toBe(false);
  });
});

describe("form actions", () => {
  it("submits a message made of the visible labels and values", async () => {
    const { received, onAction } = events();
    const { getByRole, user } = renderResponse(signup, { onAction });

    await user.type(getByRole("textbox", { name: "Email" }), "ada@example.com");
    await user.click(getByRole("button", { name: /Plan/ }));
    await user.click(getByRole("option", { name: "Pro", hidden: true }));
    await user.type(getByRole("spinbutton", { name: "Seats" }), "5");
    await user.click(getByRole("button", { name: "Create account" }));

    expect(received).toEqual([
      {
        type: "form",
        name: "signup",
        message: "Email: ada@example.com; Plan: Pro; Seats: 5",
        values: { email: "ada@example.com", plan: "pro", seats: 5 },
      },
    ]);
  });

  it("submits the model's defaults when the person changes nothing", async () => {
    const { received, onAction } = events();
    const { getByRole, user } = renderResponse(
      {
        type: "Form",
        name: "prefs",
        title: "Preferences",
        children: [
          { type: "TextField", label: "Name", name: "name", value: "Ada" },
          {
            type: "RadioGroup",
            label: "Plan",
            name: "plan",
            options: [
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
            ],
            value: "pro",
          },
          { type: "Switch", label: "Alerts", name: "alerts", checked: true },
          { type: "Checkbox", label: "Terms", name: "terms" },
          { type: "Slider", label: "Volume", name: "volume", min: 0, max: 10, value: 4 },
          {
            type: "CheckboxGroup",
            label: "Extras",
            name: "extras",
            options: ["A", "B"],
            value: ["B"],
          },
          { type: "DatePicker", label: "Start", name: "start", value: "2026-07-14" },
        ],
      },
      { onAction },
    );

    await user.click(getByRole("button", { name: "Submit" }));

    expect(received[0]?.message).toBe(
      "Name: Ada; Plan: Pro; Alerts: Yes; Terms: No; Volume: 4; Extras: B; Start: 2026-07-14",
    );
    expect(received[0]?.values).toEqual({
      name: "Ada",
      plan: "pro",
      alerts: true,
      terms: false,
      volume: 4,
      extras: ["B"],
      start: "2026-07-14",
    });
  });

  it("falls back to the submit label when nothing was filled in", async () => {
    const { received, onAction } = events();
    const { getByRole, user } = renderResponse(signup, { onAction });

    await user.click(getByRole("button", { name: "Create account" }));

    expect(received[0]?.message).toBe("Create account");
    expect(received[0]?.values).toEqual({});
  });

  it("reports toggled checkboxes, switches, and groups in the message", async () => {
    const { received, onAction } = events();
    const { getByRole, user } = renderResponse(
      {
        type: "Form",
        name: "f",
        title: "F",
        submitLabel: "Go",
        children: [
          { type: "Checkbox", label: "Accept terms", name: "terms" },
          { type: "Switch", label: "Alerts", name: "alerts" },
          {
            type: "CheckboxGroup",
            label: "Extras",
            name: "extras",
            options: ["Support", { value: "t", label: "Training" }],
          },
          { type: "RadioGroup", label: "Size", name: "size", options: ["S", "M"] },
        ],
      },
      { onAction },
    );

    await user.click(getByRole("checkbox", { name: "Accept terms" }));
    await user.click(getByRole("switch", { name: "Alerts" }));
    await user.click(getByRole("checkbox", { name: "Support" }));
    await user.click(getByRole("checkbox", { name: "Training" }));
    await user.click(getByRole("radio", { name: "M" }));
    await user.click(getByRole("button", { name: "Go" }));

    expect(received[0]?.message).toBe(
      "Accept terms: Yes; Alerts: Yes; Extras: Support, Training; Size: M",
    );
    expect(received[0]?.values?.extras).toEqual(["Support", "t"]);
  });

  it("sends a button's message, with the form it sits in and the values so far", async () => {
    const { received, onAction } = events();
    const { getByRole, user } = renderStack(
      [
        {
          type: "Button",
          label: "Show pricing",
          variant: "primary",
          message: "Show me the pricing details",
        },
        {
          type: "Form",
          name: "f",
          title: "F",
          submitLabel: "Go",
          children: [
            { type: "TextField", label: "Name", name: "name", value: "Ada" },
            { type: "Button", label: "Skip" },
          ],
        },
      ],
      { onAction },
    );

    await user.click(getByRole("button", { name: "Show pricing" }));
    await user.click(getByRole("button", { name: "Skip" }));

    expect(received).toEqual([
      {
        type: "button",
        name: undefined,
        message: "Show me the pricing details",
        values: undefined,
      },
      { type: "button", name: "f", message: "Skip", values: { name: "Ada" } },
    ]);
  });

  it("does not act while the response is still streaming", async () => {
    const { received, onAction } = events();
    const { getByRole, user } = renderStack(
      [
        { type: "Button", label: "Book it" },
        {
          type: "Form",
          name: "f",
          title: "F",
          submitLabel: "Go",
          children: [{ type: "TextField", label: "Name", name: "name", value: "Ada" }],
        },
      ],
      { onAction, streaming: true },
    );

    expect((getByRole("button", { name: "Book it" }) as HTMLButtonElement).disabled).toBe(true);
    expect((getByRole("button", { name: "Go" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(getByRole("button", { name: "Book it" }));
    await user.click(getByRole("button", { name: "Go" }));
    expect(received).toEqual([]);
  });

  it("enables buttons once streaming ends", () => {
    const response = { type: "Stack", children: [{ type: "Button", label: "Book it" }] };
    const { getByRole, rerender } = renderResponse(response, { streaming: true });
    expect((getByRole("button", { name: "Book it" }) as HTMLButtonElement).disabled).toBe(true);

    rerender(<GenUI response={JSON.stringify(response)} streaming={false} />);

    expect((getByRole("button", { name: "Book it" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("uses the newest onAction without re-rendering the response", async () => {
    const first = vi.fn();
    const second = vi.fn();
    const response = JSON.stringify({ type: "Stack", children: [{ type: "Button", label: "Go" }] });
    const { getByRole, user, rerender } = renderResponse(response, { onAction: first });

    rerender(<GenUI response={response} onAction={second} />);
    await act(async () => {});
    await user.click(getByRole("button", { name: "Go" }));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});

describe("errors", () => {
  it("reports the problems of a finished response once", async () => {
    const onError = vi.fn();
    const response = JSON.stringify({
      type: "Stack",
      children: [{ type: "Nope" }, { type: "Select" }],
    });
    const { rerender } = renderResponse(response, { onError });

    await act(async () => {});
    rerender(<GenUI response={response} onError={onError} />);
    await act(async () => {});

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0].map((error: { code: string }) => error.code)).toEqual([
      "unknown-type",
      "missing-prop",
      "missing-prop",
      "missing-prop",
    ]);
  });

  it("stays quiet while streaming and reports when the stream ends", async () => {
    const onError = vi.fn();
    const broken = JSON.stringify({ type: "Stack", children: [{ type: "Nope" }] });
    const { rerender } = renderResponse(broken.slice(0, 20), { onError, streaming: true });

    for (let end = 20; end <= broken.length; end += 5) {
      rerender(<GenUI response={broken.slice(0, end)} streaming onError={onError} />);
    }
    await act(async () => {});
    expect(onError).not.toHaveBeenCalled();

    rerender(<GenUI response={broken} streaming={false} onError={onError} />);
    await act(async () => {});
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0][0]).toMatchObject({ code: "unknown-type" });
  });

  it("reports a stream cut short", async () => {
    const onError = vi.fn();
    renderResponse('{"type": "Stack", "children": [{"type": "Text", "text": "Hel', { onError });
    await act(async () => {});

    expect(onError.mock.calls[0]?.[0][0].code).toBe("truncated");
  });

  it("renders what it can from a response that has problems", () => {
    const { container } = renderResponse({
      type: "Stack",
      children: [{ type: "Nope" }, { type: "Text", text: "still here" }],
    });

    expect(container.textContent).toBe("still here");
  });
});
