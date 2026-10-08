import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { Accordion } from "./Accordion.js";
import { AccordionHeader } from "./AccordionHeader.js";
import { AccordionItem } from "./AccordionItem.js";
import { AccordionPanel } from "./AccordionPanel.js";
import { AccordionTrigger } from "./AccordionTrigger.js";

function renderAccordion(props: Record<string, unknown> = {}) {
  const result = setup(
    <Accordion {...props}>
      <AccordionItem value="one">
        <AccordionHeader>
          <AccordionTrigger>One</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>First panel</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionHeader>
          <AccordionTrigger>Two</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Second panel</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="three" disabled>
        <AccordionHeader>
          <AccordionTrigger>Three</AccordionTrigger>
        </AccordionHeader>
        <AccordionPanel>Third panel</AccordionPanel>
      </AccordionItem>
    </Accordion>,
  );
  const triggers = [...result.container.querySelectorAll<HTMLButtonElement>("button")];
  const panels = [
    ...result.container.querySelectorAll<HTMLElement>("[data-slot='accordion-panel']"),
  ];
  return { ...result, triggers, panels };
}

describe("accordion composition", () => {
  it("wires each trigger to its panel and hides collapsed panels", () => {
    const { triggers, panels } = renderAccordion({ defaultValue: "one" });

    expect(triggers.map((trigger) => trigger.getAttribute("aria-expanded"))).toEqual([
      "true",
      "false",
      "false",
    ]);
    expect(triggers[0]!.getAttribute("aria-controls")).toBe(panels[0]!.id);
    expect(panels[0]!.getAttribute("aria-labelledby")).toBe(triggers[0]!.id);
    expect(panels.map((panel) => panel.hidden)).toEqual([false, true, true]);
    expect(triggers[0]!.hasAttribute("data-open")).toBe(true);
    expect(triggers[2]!.disabled).toBe(true);
  });

  it("keeps a single open item and locks the open one until collapsible", async () => {
    const onChange = vi.fn();
    const { triggers, panels, user } = renderAccordion({ defaultValue: "one", onChange });

    expect(triggers[0]!.getAttribute("aria-disabled")).toBe("true");
    await user.click(triggers[0]!);
    expect(onChange).not.toHaveBeenCalled();
    expect(panels[0]!.hidden).toBe(false);

    await user.click(triggers[1]!);
    expect(onChange).toHaveBeenLastCalledWith("two");
    expect(panels.map((panel) => panel.hidden)).toEqual([true, false, true]);
  });

  it("collapses the open item when collapsible", async () => {
    const { triggers, panels, user } = renderAccordion({ defaultValue: "one", collapsible: true });

    await user.click(triggers[0]!);
    expect(panels.every((panel) => panel.hidden)).toBe(true);
  });

  it("opens several items independently in multiple mode", async () => {
    const onChange = vi.fn();
    const { triggers, panels, user } = renderAccordion({ type: "multiple", onChange });

    await user.click(triggers[0]!);
    await user.click(triggers[1]!);
    expect(onChange).toHaveBeenLastCalledWith(["one", "two"]);
    expect(panels.map((panel) => panel.hidden)).toEqual([false, false, true]);

    await user.click(triggers[0]!);
    expect(onChange).toHaveBeenLastCalledWith(["two"]);
  });

  it("moves focus between triggers with arrows, Home, and End, looping", async () => {
    const { triggers, user } = renderAccordion();
    triggers[0]!.focus();

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(triggers[1]);
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(triggers[1]);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(triggers[0]);
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(triggers[1]);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(triggers[0]);
  });

  it("toggles from the keyboard with Enter and Space", async () => {
    const { triggers, panels, user } = renderAccordion({ type: "multiple" });
    triggers[0]!.focus();

    await user.keyboard("{Enter}");
    expect(panels[0]!.hidden).toBe(false);
    await user.keyboard(" ");
    expect(panels[0]!.hidden).toBe(true);
  });

  it("renders a non-native trigger with aria-disabled when its item is disabled", () => {
    const { container } = setup(
      <Accordion>
        <AccordionItem value="one" disabled>
          <AccordionHeader level={2}>
            <AccordionTrigger as="div">One</AccordionTrigger>
          </AccordionHeader>
          <AccordionPanel>Panel</AccordionPanel>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = container.querySelector<HTMLElement>("[data-slot='accordion-trigger']")!;

    expect(container.querySelector("h2")).toBeTruthy();
    expect(trigger.tagName).toBe("DIV");
    expect(trigger.getAttribute("aria-disabled")).toBe("true");
    expect(trigger.hasAttribute("type")).toBe(false);
  });
});
