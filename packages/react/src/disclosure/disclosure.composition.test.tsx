import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { Disclosure } from "./Disclosure.js";
import { DisclosurePanel } from "./DisclosurePanel.js";
import { DisclosureTrigger } from "./DisclosureTrigger.js";

describe("disclosure composition", () => {
  it("renders a native details with the trigger wired to its panel", () => {
    const { container } = setup(
      <Disclosure id="more">
        <DisclosureTrigger>More</DisclosureTrigger>
        <DisclosurePanel>Hidden details</DisclosurePanel>
      </Disclosure>,
    );
    const details = container.querySelector("details")!;
    const trigger = container.querySelector("summary")!;
    const panel = container.querySelector<HTMLElement>("[id='more-panel']")!;

    expect(details.open).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    expect(details.hasAttribute("data-open")).toBe(false);
  });

  it("reports the next open state through onOpenChange and the native toggle through onToggle", async () => {
    const onOpenChange = vi.fn();
    const onToggle = vi.fn();
    const { container, user } = setup(
      <Disclosure onOpenChange={onOpenChange} onToggle={onToggle}>
        <DisclosureTrigger>More</DisclosureTrigger>
        <DisclosurePanel>Hidden details</DisclosurePanel>
      </Disclosure>,
    );
    const details = container.querySelector("details")!;
    const trigger = container.querySelector("summary")!;

    await user.click(trigger);
    await vi.waitFor(() => expect(onOpenChange).toHaveBeenLastCalledWith(true));
    expect(onToggle).toHaveBeenCalled();
    expect(details.open).toBe(true);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(details.hasAttribute("data-open")).toBe(true);
  });

  it("follows a controlled open prop and starts open from defaultOpen", () => {
    const { container, rerender } = setup(
      <Disclosure open={false}>
        <DisclosureTrigger>More</DisclosureTrigger>
        <DisclosurePanel>Hidden details</DisclosurePanel>
      </Disclosure>,
    );
    const details = container.querySelector("details")!;
    expect(details.open).toBe(false);

    rerender(
      <Disclosure open>
        <DisclosureTrigger>More</DisclosureTrigger>
        <DisclosurePanel>Hidden details</DisclosurePanel>
      </Disclosure>,
    );
    expect(details.open).toBe(true);

    const second = setup(
      <Disclosure defaultOpen>
        <DisclosureTrigger>Other</DisclosureTrigger>
      </Disclosure>,
    );
    expect(second.container.querySelector("details")!.open).toBe(true);
  });
});
