import { act } from "react";
import { describe, expect, it } from "vitest";
import { setup } from "../../test/render.js";
import { Checkbox } from "./Checkbox.js";
import { CheckboxGroup } from "./CheckboxGroup.js";

function Topics({ events = true }: { events?: boolean }) {
  return (
    <form>
      <CheckboxGroup name="topics" required>
        <Checkbox value="news">News</Checkbox>
        {events && <Checkbox value="events">Events</Checkbox>}
        <Checkbox value="tips">Tips</Checkbox>
      </CheckboxGroup>
    </form>
  );
}

describe("CheckboxGroup", () => {
  it("focuses the first checkbox when a required empty group fails validation", () => {
    const { container } = setup(<Topics />);
    const form = container.querySelector("form")!;
    const first = container.querySelector<HTMLInputElement>("input[value=news]")!;

    expect(form.checkValidity()).toBe(false);
    act(() => {
      form.reportValidity();
    });
    expect(document.activeElement).toBe(first);
  });

  it("submits the checked values in document order and follows added and removed boxes", async () => {
    const { container, rerender, user } = setup(<Topics />);
    const form = container.querySelector("form")!;
    const box = (value: string) =>
      container.querySelector<HTMLInputElement>(`input[value=${value}]`)!;

    await user.click(box("tips"));
    await user.click(box("news"));
    expect(new FormData(form).getAll("topics")).toEqual(["news", "tips"]);

    rerender(<Topics events={false} />);
    expect(container.querySelector("input[value=events]")).toBeNull();
    expect(new FormData(form).getAll("topics")).toEqual(["news", "tips"]);

    rerender(<Topics />);
    await user.click(box("events"));
    expect(new FormData(form).getAll("topics")).toEqual(["news", "events", "tips"]);
  });

  it("restores the initial selection when the form resets", async () => {
    const { container, user } = setup(
      <form>
        <CheckboxGroup name="topics" defaultValue={["events"]}>
          <Checkbox value="news">News</Checkbox>
          <Checkbox value="events">Events</Checkbox>
        </CheckboxGroup>
      </form>,
    );
    const news = container.querySelector<HTMLInputElement>("input[value=news]")!;
    const events = container.querySelector<HTMLInputElement>("input[value=events]")!;

    await user.click(news);
    await user.click(events);
    act(() => container.querySelector("form")!.reset());
    await act(async () => Promise.resolve());

    expect(news.checked).toBe(false);
    expect(events.checked).toBe(true);
  });
});
