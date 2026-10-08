import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { render } from "../../test/render.js";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Disclosure,
  DisclosurePanel,
  DisclosureTrigger,
} from "../index.js";

describe("accordion and disclosure browser accessibility", () => {
  it("has no axe violations with accordion items expanded", async () => {
    const { container, unmount } = render(
      <Accordion type="multiple">
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
      </Accordion>,
    );
    const triggers = [...container.querySelectorAll<HTMLElement>("button")];

    await userEvent.click(triggers[0]!);
    await userEvent.click(triggers[1]!);
    expect(triggers.map((trigger) => trigger.getAttribute("aria-expanded"))).toEqual([
      "true",
      "true",
    ]);
    await expectNoAxeViolations(container, "expanded accordion");
    unmount();
  });

  it("has no axe violations with a disclosure expanded", async () => {
    const { container, unmount } = render(
      <Disclosure>
        <DisclosureTrigger>More</DisclosureTrigger>
        <DisclosurePanel>Hidden details</DisclosurePanel>
      </Disclosure>,
    );
    const trigger = container.querySelector<HTMLElement>("summary")!;

    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await expectNoAxeViolations(container, "expanded disclosure");
    unmount();
  });
});
