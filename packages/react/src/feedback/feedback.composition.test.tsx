import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { Feedback, FeedbackButton } from "./index.js";

describe("feedback composition", () => {
  it("rates exclusively and lets the user withdraw the rating", async () => {
    const onChange = vi.fn();
    const { getByRole, user } = setup(
      <Feedback aria-label="Rate this response" onChange={onChange}>
        <FeedbackButton value="good">Good response</FeedbackButton>
        <FeedbackButton value="bad">Bad response</FeedbackButton>
      </Feedback>,
    );
    const good = getByRole("button", { name: "Good response" });
    const bad = getByRole("button", { name: "Bad response" });
    expect(getByRole("group", { name: "Rate this response" })).toBeTruthy();
    expect(good.getAttribute("aria-pressed")).toBe("false");

    await user.click(good);
    expect(good.getAttribute("aria-pressed")).toBe("true");
    await user.click(bad);
    expect(good.getAttribute("aria-pressed")).toBe("false");
    expect(bad.getAttribute("aria-pressed")).toBe("true");
    expect(bad.hasAttribute("data-selected")).toBe(true);
    await user.click(bad);
    expect(onChange.mock.calls).toEqual([["good"], ["bad"], [""]]);
  });

  it("follows a controlled value", () => {
    const { getByRole } = setup(
      <Feedback aria-label="Rate" value="bad">
        <FeedbackButton value="good">Good response</FeedbackButton>
        <FeedbackButton value="bad">Bad response</FeedbackButton>
      </Feedback>,
    );
    expect(getByRole("button", { name: "Bad response" }).getAttribute("aria-pressed")).toBe("true");
  });
});
