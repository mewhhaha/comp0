import { Suspense, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoAxeViolations } from "../../../react/test/axe.js";
import { setup } from "../../../react/test/render.js";
import { GenUIContext, type GenUIAction } from "../render/context.js";
import { createGenUIStore } from "../state/store.js";
import { Binding } from "../validate/values.js";
import {
  ButtonPart,
  LinkPart,
  OptionPart,
  SelectPart,
  TabsPart,
  TabListPart,
  TabPart,
  TabPanelPart,
  AccordionPart,
  SectionPart,
} from "./parts.js";

type ScopeProps = {
  children: ReactNode;
  store?: ReturnType<typeof createGenUIStore>;
  act?: (action: GenUIAction) => void;
};
function Scope({ children, store = createGenUIStore(), act = vi.fn() }: ScopeProps) {
  return (
    <GenUIContext value={{ store, act, streaming: false, bindings: new Map(), slots: {} }}>
      {children}
    </GenUIContext>
  );
}

describe("composition parts", () => {
  it("keeps streamed React children as accessible button and link text", async () => {
    const act = vi.fn();
    const result = setup(
      <Scope act={act}>
        <ButtonPart>
          <Suspense fallback={null}>Show details</Suspense>
        </ButtonPart>
        <LinkPart href="https://example.com">
          <Suspense fallback={null}>Read more</Suspense>
        </LinkPart>
      </Scope>,
    );
    await result.user.click(result.getByRole("button", { name: "Show details" }));
    expect(act).toHaveBeenCalledWith({
      type: "button",
      name: undefined,
      message: "Show details",
      values: undefined,
    });
    expect(result.getByRole("link", { name: "Read more" }).getAttribute("href")).toBe(
      "https://example.com",
    );
  });

  it("writes a selected child option into shared state", async () => {
    const store = createGenUIStore({ plan: "basic" });
    const result = setup(
      <Scope store={store}>
        <SelectPart label="Plan" value={new Binding("plan", "basic")}>
          <OptionPart value="basic">Basic</OptionPart>
          <OptionPart value="pro">Professional</OptionPart>
        </SelectPart>
      </Scope>,
    );
    await result.user.click(result.getByRole("button", { name: "Plan" }));
    await result.user.click(result.getByRole("option", { name: "Professional" }));
    expect(store.get("plan")).toBe("pro");
    await expectNoAxeViolations(result.container);
  });

  it("selects the first streamed tab and opens the matching panel", async () => {
    const result = setup(
      <TabsPart>
        <TabListPart label="Regions">
          <TabPart value="north">North</TabPart>
          <TabPart value="south">South</TabPart>
        </TabListPart>
        <TabPanelPart value="north">Northern view</TabPanelPart>
        <TabPanelPart value="south">Southern view</TabPanelPart>
      </TabsPart>,
    );
    expect(result.getByRole("tab", { name: "North" }).getAttribute("aria-selected")).toBe("true");
    await result.user.click(result.getByRole("tab", { name: "South" }));
    expect(result.getByRole("tabpanel").textContent).toBe("Southern view");
    await expectNoAxeViolations(result.container);
  });

  it("expands an accordion section without inspecting streamed children", async () => {
    const result = setup(
      <AccordionPart>
        <SectionPart value="shipping" title="Shipping">
          <Suspense fallback={null}>Arrives tomorrow</Suspense>
        </SectionPart>
      </AccordionPart>,
    );
    const trigger = result.getByRole("button", { name: "Shipping" });
    await result.user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(result.getByText("Arrives tomorrow")).toBeDefined();
    await expectNoAxeViolations(result.container);
  });

  it("withholds provider-dependent parts outside their roots", () => {
    const result = setup(
      <>
        <OptionPart value="one">One</OptionPart>
        <TabPart value="one">One</TabPart>
        <TabPanelPart value="one">One</TabPanelPart>
        <SectionPart value="one" title="One">
          One
        </SectionPart>
      </>,
    );
    expect(result.container.textContent).toBe("");
  });
});
