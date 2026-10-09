import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireKeyDown, setup } from "../../test/render.js";
import { Composer, ComposerInput, ComposerSend, ComposerStop } from "./index.js";

function Fixture(props: Partial<React.ComponentProps<typeof Composer>>) {
  return (
    <Composer {...props}>
      <ComposerInput aria-label="Message" />
      <ComposerSend>Send</ComposerSend>
      <ComposerStop>Stop</ComposerStop>
    </Composer>
  );
}

describe("composer composition", () => {
  it("sends on Enter, clears the draft and keeps focus in the input", async () => {
    const onSend = vi.fn();
    const { getByLabelText, user } = setup(<Fixture onSend={onSend} />);
    const input = getByLabelText("Message") as HTMLTextAreaElement;

    await user.type(input, "Hello{Enter}");

    expect(onSend).toHaveBeenCalledExactlyOnceWith("Hello");
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
  });

  it("inserts a newline on Shift+Enter without sending", async () => {
    const onSend = vi.fn();
    const { getByLabelText, user } = setup(<Fixture onSend={onSend} />);
    const input = getByLabelText("Message") as HTMLTextAreaElement;

    await user.type(input, "a{Shift>}{Enter}{/Shift}b");

    expect(onSend).not.toHaveBeenCalled();
    expect(input.value).toBe("a\nb");
  });

  it("never sends while an IME composition is confirmed with Enter", async () => {
    const onSend = vi.fn();
    const { getByLabelText, user } = setup(<Fixture onSend={onSend} defaultValue="こんにちは" />);
    const input = getByLabelText("Message");

    // oxlint-disable-next-line comp0/no-synthetic-events -- userEvent cannot express an IME composition.
    fireKeyDown(input, "Enter", { isComposing: true });
    // oxlint-disable-next-line comp0/no-synthetic-events -- Safari reports the confirming Enter as keyCode 229.
    fireKeyDown(input, "Enter", { keyCode: 229 });
    expect(onSend).not.toHaveBeenCalled();

    await user.type(input, "{Enter}");
    expect(onSend).toHaveBeenCalledExactlyOnceWith("こんにちは");
  });

  it("ignores empty drafts and disables Send until there is text", async () => {
    const onSend = vi.fn();
    const { getByLabelText, getByRole, user } = setup(<Fixture onSend={onSend} />);
    const send = getByRole("button", { name: "Send" }) as HTMLButtonElement;

    expect(send.disabled).toBe(true);
    await user.type(getByLabelText("Message"), "   {Enter}");
    expect(onSend).not.toHaveBeenCalled();

    await user.type(getByLabelText("Message"), "x");
    expect(send.disabled).toBe(false);
    await user.click(send);
    expect(onSend).toHaveBeenCalledExactlyOnceWith("   x");
    expect(document.activeElement).toBe(getByLabelText("Message"));
  });

  it("runs the native onSubmit first and lets it veto the send", async () => {
    const onSend = vi.fn();
    const { getByLabelText, user } = setup(
      <Fixture onSend={onSend} onSubmit={(event) => event.preventDefault()} />,
    );
    await user.type(getByLabelText("Message"), "hi{Enter}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("supports a controlled draft", async () => {
    const onChange = vi.fn();
    function Controlled() {
      const [value, setValue] = useState("");
      return (
        <Fixture
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }
    const { getByLabelText, user } = setup(<Controlled />);
    await user.type(getByLabelText("Message"), "ab");
    expect(onChange).toHaveBeenLastCalledWith("ab");
    expect((getByLabelText("Message") as HTMLTextAreaElement).value).toBe("ab");
  });

  it("shows Stop only while generating, blocks sending, and refocuses the input on stop", async () => {
    const onSend = vi.fn();
    const onStop = vi.fn();
    const { getByLabelText, queryByRole, getByRole, rerender, user } = setup(
      <Fixture onSend={onSend} onStop={onStop} />,
    );
    expect(queryByRole("button", { name: "Stop" })).toBeNull();

    rerender(<Fixture onSend={onSend} onStop={onStop} generating defaultValue="draft" />);
    const input = getByLabelText("Message");
    await user.type(input, "{Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect((getByRole("button", { name: "Send" }) as HTMLButtonElement).disabled).toBe(true);

    await user.click(getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(input);
  });

  it("names the missing provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => setup(<ComposerInput aria-label="x" />)).toThrow(
      "ComposerInput must be rendered inside Composer.",
    );
    spy.mockRestore();
  });
});
