import { describe, expect, it, vi } from "vitest";
import { render, setup } from "../../test/render.js";
import { Rating, type RatingProps } from "./Rating.js";
import { RatingItem } from "./RatingItem.js";

function Stars(props: RatingProps) {
  return (
    <Rating aria-label="Rate your stay" {...props}>
      {[1, 2, 3, 4, 5].map((star) => (
        <RatingItem key={star} value={star}>
          ★
        </RatingItem>
      ))}
    </Rating>
  );
}

const activeStars = (container: HTMLElement) =>
  container.querySelectorAll("[data-slot='rating-item'][data-active]").length;

describe("rating composition", () => {
  it("groups hidden native radios under one name and submits the selected value", () => {
    const { container } = render(
      <form>
        <Stars name="stay" defaultValue={3} />
      </form>,
    );
    const radios = [...container.querySelectorAll<HTMLInputElement>("input[type='radio']")];
    expect(radios).toHaveLength(5);
    expect(new Set(radios.map((radio) => radio.name)).size).toBe(1);
    expect(radios[2]!.checked).toBe(true);
    expect(container.querySelector("[data-selected]")?.textContent).toBe("★");
    expect(activeStars(container)).toBe(3);
    expect(new FormData(container.querySelector("form")!).get("stay")).toBe("3");
  });

  it("selects a new rating uncontrolled and reports the number", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(<Stars defaultValue={1} onChange={onChange} />);
    const radios = container.querySelectorAll<HTMLInputElement>("input");
    await user.click(radios[3]!);
    expect(onChange).toHaveBeenLastCalledWith(4);
    expect(radios[3]!.checked).toBe(true);
    expect(activeStars(container)).toBe(4);
  });

  it("keeps a controlled rating until the owner applies the change", async () => {
    const onChange = vi.fn();
    const { container, rerender, user } = setup(<Stars value={2} onChange={onChange} />);
    const radios = container.querySelectorAll<HTMLInputElement>("input");
    await user.click(radios[4]!);
    expect(onChange).toHaveBeenLastCalledWith(5);
    expect(radios[4]!.checked).toBe(false);
    await user.unhover(radios[4]!);
    expect(activeStars(container)).toBe(2);
    rerender(<Stars value={5} onChange={onChange} />);
    expect(radios[4]!.checked).toBe(true);
    expect(activeStars(container)).toBe(5);
  });

  it("previews the hovered rating with data-active and clears it on pointer leave", async () => {
    const { container, user } = setup(<Stars defaultValue={2} />);
    const items = container.querySelectorAll("[data-slot='rating-item']");
    await user.hover(items[3]!);
    expect(activeStars(container)).toBe(4);
    await user.unhover(items[3]!);
    expect(activeStars(container)).toBe(2);
  });

  it("stays focusable but discards changes when read-only", async () => {
    const onChange = vi.fn();
    const { container, user } = setup(<Stars defaultValue={2} readOnly onChange={onChange} />);
    const radios = container.querySelectorAll<HTMLInputElement>("input");
    expect(radios[4]!.disabled).toBe(false);
    await user.click(radios[4]!);
    expect(onChange).not.toHaveBeenCalled();
    expect(radios[4]!.checked).toBe(false);
    expect(radios[1]!.checked).toBe(true);
    expect(container.querySelector("[data-slot='rating']")?.hasAttribute("data-readonly")).toBe(
      true,
    );
  });

  it("skips an invalid item value with a warning", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container } = render(
      <Rating>
        <RatingItem value={-1}>★</RatingItem>
        <RatingItem value={1}>★</RatingItem>
      </Rating>,
    );

    expect(container.querySelectorAll("input")).toHaveLength(1);
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        "RatingItem value must be a positive finite number; received -1. It was skipped.",
      ),
    );
    error.mockRestore();
  });
});
