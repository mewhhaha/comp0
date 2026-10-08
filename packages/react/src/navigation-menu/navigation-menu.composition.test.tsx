import { type AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { setup } from "../../test/render.js";
import { NavigationMenu } from "./NavigationMenu.js";
import { NavigationMenuPanel } from "./NavigationMenuPanel.js";
import { NavigationMenuItem } from "./NavigationMenuItem.js";
import { NavigationMenuLink } from "./NavigationMenuLink.js";
import { NavigationMenuList } from "./NavigationMenuList.js";
import { NavigationMenuTrigger } from "./NavigationMenuTrigger.js";

function SiteNavigation(props: { value?: string; onChange?: (value: string) => void }) {
  return (
    <NavigationMenu aria-label="Main" {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuPanel>
            <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
            <NavigationMenuLink href="#reports">Reports</NavigationMenuLink>
          </NavigationMenuPanel>
        </NavigationMenuItem>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuPanel>
            <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          </NavigationMenuPanel>
        </NavigationMenuItem>
        <NavigationMenuItem value="pricing">
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const triggerNamed = (container: Element, text: string) =>
  [...container.querySelectorAll<HTMLButtonElement>("button")].find(
    (element) => element.textContent === text,
  )!;

describe("navigation menu composition", () => {
  it("wires each trigger to its hidden panel with aria-expanded and aria-controls", async () => {
    const { container, user } = setup(<SiteNavigation />);

    const navigation = container.querySelector("nav")!;
    expect(navigation.getAttribute("aria-label")).toBe("Main");
    const trigger = triggerNamed(container, "Products");
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(trigger.hasAttribute("data-open")).toBe(true);
    expect(panel.hasAttribute("data-open")).toBe(true);
    expect(trigger.closest("li")?.hasAttribute("data-open")).toBe(true);
  });

  it("keeps a single panel open: opening one item closes the other", async () => {
    const { container, user } = setup(<SiteNavigation />);

    await user.click(triggerNamed(container, "Products"));
    await user.click(triggerNamed(container, "Resources"));
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
    expect(triggerNamed(container, "Resources").getAttribute("aria-expanded")).toBe("true");
    expect(
      container.querySelectorAll("[data-slot='navigation-menu-panel']:not([hidden])"),
    ).toHaveLength(1);
  });

  it("closes the open panel on Escape and refocuses its trigger", async () => {
    const { container, user } = setup(<SiteNavigation />);

    const trigger = triggerNamed(container, "Products");
    await user.click(trigger);
    container.querySelector<HTMLAnchorElement>("a[href='#analytics']")!.focus();
    await user.keyboard("{Escape}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes the menu when a panel link is activated", async () => {
    const { container, user } = setup(<SiteNavigation />);

    await user.click(triggerNamed(container, "Products"));
    await user.click(container.querySelector("a[href='#analytics']")!);
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("nav")?.hasAttribute("data-open")).toBe(false);
  });

  it("marks the current link with aria-current='page'", () => {
    const { container } = setup(
      <NavigationMenu aria-label="Main">
        <NavigationMenuList>
          <NavigationMenuItem value="pricing">
            <NavigationMenuLink href="#pricing" current>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    const link = container.querySelector("a")!;
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.hasAttribute("data-current")).toBe(true);
  });

  it("follows a controlled value and reports toggles without changing itself", async () => {
    const onChange = vi.fn();
    const { container, rerender, user } = setup(
      <SiteNavigation value="products" onChange={onChange} />,
    );

    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("true");
    await user.click(triggerNamed(container, "Products"));
    expect(onChange).toHaveBeenCalledWith("");
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("true");

    rerender(<SiteNavigation value="resources" onChange={onChange} />);
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
    expect(triggerNamed(container, "Resources").getAttribute("aria-expanded")).toBe("true");
  });

  it("composes router-style links through as and still closes on activation", async () => {
    function RouterLink({
      to,
      children,
      ...props
    }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
      return (
        <a {...props} href={to}>
          {children}
        </a>
      );
    }

    const { container, user } = setup(
      <NavigationMenu aria-label="Main">
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuPanel>
              <NavigationMenuLink as={RouterLink} to="#reports">
                Reports
              </NavigationMenuLink>
            </NavigationMenuPanel>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    await user.click(triggerNamed(container, "Products"));
    const link = container.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("#reports");
    await user.click(link);
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
  });

  it("moves along the top-level row with arrow keys without opening panels", async () => {
    const { container, user } = setup(<SiteNavigation />);

    const products = triggerNamed(container, "Products");
    products.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(triggerNamed(container, "Resources"));
    await user.keyboard("{ArrowDown}");
    const pricing = container.querySelector<HTMLAnchorElement>("a[href='#pricing']")!;
    expect(document.activeElement).toBe(pricing);
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(pricing);
    await user.keyboard("{ArrowLeft}");
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(products);
    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(products);
    expect(container.querySelector("nav")?.hasAttribute("data-open")).toBe(false);
  });

  it("mirrors top-level arrow navigation in right-to-left layouts", async () => {
    const { container, user } = setup(<SiteNavigation />);
    const navigation = container.querySelector("nav")!;
    const products = triggerNamed(container, "Products");
    navigation.style.direction = "rtl";
    products.focus();

    await user.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(triggerNamed(container, "Resources"));
  });

  it("moves focus within the navigation menu's owning document", async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameDocument = frame.contentDocument!;
    const { container, unmount, user } = setup(<SiteNavigation />, frameDocument);
    const products = triggerNamed(container, "Products");
    const resources = triggerNamed(container, "Resources");

    products.focus();
    await user.keyboard("{ArrowRight}");

    expect(frameDocument.activeElement).toBe(resources);
    unmount();
    frame.remove();
  });

  it("moves from an expanded trigger into its panel and between the panel links without wrapping", async () => {
    const { container, user } = setup(<SiteNavigation />);

    const products = triggerNamed(container, "Products");
    await user.click(products);
    products.focus();
    await user.keyboard("{ArrowDown}");
    const analytics = container.querySelector<HTMLAnchorElement>("a[href='#analytics']")!;
    const reports = container.querySelector<HTMLAnchorElement>("a[href='#reports']")!;
    expect(document.activeElement).toBe(analytics);
    expect(products.getAttribute("aria-expanded")).toBe("true");

    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(reports);
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(reports);
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(analytics);
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(analytics);
  });

  it("jumps to the first and last stop with Home and End in each context", async () => {
    const { container, user } = setup(<SiteNavigation />);

    const resources = triggerNamed(container, "Resources");
    resources.focus();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(container.querySelector("a[href='#pricing']"));
    resources.focus();
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(triggerNamed(container, "Products"));

    await user.click(triggerNamed(container, "Products"));
    const analytics = container.querySelector<HTMLAnchorElement>("a[href='#analytics']")!;
    const reports = container.querySelector<HTMLAnchorElement>("a[href='#reports']")!;
    analytics.focus();
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(reports);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(analytics);
  });

  it("leaves modified keys and non-link panel widgets to their own behavior", async () => {
    const { container, user } = setup(
      <NavigationMenu aria-label="Main">
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuPanel>
              <input aria-label="Filter destinations" />
              <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
            </NavigationMenuPanel>
          </NavigationMenuItem>
          <NavigationMenuItem value="resources">
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuPanel>
              <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
            </NavigationMenuPanel>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    const products = triggerNamed(container, "Products");
    products.focus();
    await user.keyboard("{Control>}{ArrowRight}{/Control}");
    expect(document.activeElement).toBe(products);

    await user.click(products);
    const filter = container.querySelector("input")!;
    filter.focus();
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(filter);
  });

  it("warns about a missing item value and keeps that item closed", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { container, user } = setup(
      <NavigationMenu aria-label="Main">
        <NavigationMenuList>
          <NavigationMenuItem value="">
            <NavigationMenuTrigger>Broken</NavigationMenuTrigger>
            <NavigationMenuPanel>
              <NavigationMenuLink href="#broken">Broken link</NavigationMenuLink>
            </NavigationMenuPanel>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    const trigger = triggerNamed(container, "Broken");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(
      container.querySelector<HTMLElement>("[data-slot='navigation-menu-panel']")?.hidden,
    ).toBe(true);
    expect(error.mock.calls.flat().join(" ")).toContain(
      'NavigationMenuItem requires a non-empty value; received "".',
    );
    error.mockRestore();
  });
});
