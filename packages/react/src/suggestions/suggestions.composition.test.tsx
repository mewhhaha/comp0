import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { Suggestion, Suggestions } from "./index.js";

describe("suggestions composition", () => {
  it("renders a named group and sends the chosen value", async () => {
    const onSend = vi.fn();
    const { getByRole, user } = setup(
      <Suggestions aria-label="Quick replies" onSend={onSend}>
        <Suggestion value="Tell me more">More</Suggestion>
        <Suggestion value="Thanks">Thanks</Suggestion>
      </Suggestions>,
    );
    expect(getByRole("group", { name: "Quick replies" })).toBeTruthy();

    await user.tab();
    expect(document.activeElement?.textContent).toBe("More");
    await user.keyboard("{Enter}");
    await user.click(getByRole("button", { name: "Thanks" }));

    expect(onSend.mock.calls).toEqual([["Tell me more"], ["Thanks"]]);
  });

  it("disables every suggestion from the root", async () => {
    const onSend = vi.fn();
    const { getAllByRole, user } = setup(
      <Suggestions aria-label="Quick replies" onSend={onSend} disabled>
        <Suggestion value="a">A</Suggestion>
        <Suggestion value="b">B</Suggestion>
      </Suggestions>,
    );
    for (const button of getAllByRole("button")) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
      await user.click(button);
    }
    expect(onSend).not.toHaveBeenCalled();
  });

  it("lets a click handler veto the send", async () => {
    const onSend = vi.fn();
    const { getByRole, user } = setup(
      <Suggestions aria-label="Quick replies" onSend={onSend}>
        <Suggestion value="a" onClick={(event) => event.preventDefault()}>
          A
        </Suggestion>
      </Suggestions>,
    );
    await user.click(getByRole("button"));
    expect(onSend).not.toHaveBeenCalled();
  });
});
