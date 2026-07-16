import { type AnchorHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireClick, fireKeyDown, render } from "../test/render.js";
import { NavigationMenu } from "./components/NavigationMenu.js";
import { NavigationMenuContent } from "./components/NavigationMenuContent.js";
import { NavigationMenuItem } from "./components/NavigationMenuItem.js";
import { NavigationMenuLink } from "./components/NavigationMenuLink.js";
import { NavigationMenuList } from "./components/NavigationMenuList.js";
import { NavigationMenuTrigger } from "./components/NavigationMenuTrigger.js";

function SiteNavigation(props: { value?: string; onChange?: (value: string) => void }) {
  return (
    <NavigationMenu aria-label="Main" {...props}>
      <NavigationMenuList>
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
          </NavigationMenuContent>
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
  it("wires each trigger to its hidden panel with aria-expanded and aria-controls", () => {
    const { container } = render(<SiteNavigation />);

    const navigation = container.querySelector("nav")!;
    expect(navigation.getAttribute("aria-label")).toBe("Main");
    const trigger = triggerNamed(container, "Products");
    const panel = document.getElementById(trigger.getAttribute("aria-controls")!)!;
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);

    fireClick(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(trigger.hasAttribute("data-open")).toBe(true);
    expect(panel.hasAttribute("data-open")).toBe(true);
    expect(trigger.closest("li")?.hasAttribute("data-open")).toBe(true);
  });

  it("keeps a single panel open: opening one item closes the other", () => {
    const { container } = render(<SiteNavigation />);

    fireClick(triggerNamed(container, "Products"));
    fireClick(triggerNamed(container, "Resources"));
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
    expect(triggerNamed(container, "Resources").getAttribute("aria-expanded")).toBe("true");
    expect(
      container.querySelectorAll("[data-slot='navigation-menu-content']:not([hidden])"),
    ).toHaveLength(1);
  });

  it("closes the open panel on Escape and refocuses its trigger", () => {
    const { container } = render(<SiteNavigation />);

    const trigger = triggerNamed(container, "Products");
    fireClick(trigger);
    const link = container.querySelector<HTMLAnchorElement>("a[href='#analytics']")!;
    fireKeyDown(link, "Escape");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes the menu when a panel link is activated", () => {
    const { container } = render(<SiteNavigation />);

    fireClick(triggerNamed(container, "Products"));
    fireClick(container.querySelector("a[href='#analytics']")!);
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector("nav")?.hasAttribute("data-open")).toBe(false);
  });

  it("marks the current link with aria-current='page'", () => {
    const { container } = render(
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

  it("follows a controlled value and reports toggles without changing itself", () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<SiteNavigation value="products" onChange={onChange} />);

    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("true");
    fireClick(triggerNamed(container, "Products"));
    expect(onChange).toHaveBeenCalledWith("");
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("true");

    rerender(<SiteNavigation value="resources" onChange={onChange} />);
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
    expect(triggerNamed(container, "Resources").getAttribute("aria-expanded")).toBe("true");
  });

  it("composes router-style links through as and still closes on activation", () => {
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

    const { container } = render(
      <NavigationMenu aria-label="Main">
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink as={RouterLink} to="#reports">
                Reports
              </NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    fireClick(triggerNamed(container, "Products"));
    const link = container.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("#reports");
    fireClick(link);
    expect(triggerNamed(container, "Products").getAttribute("aria-expanded")).toBe("false");
  });

  it("reports a missing item value with the received value", () => {
    expect(() =>
      render(
        <NavigationMenu aria-label="Main">
          <NavigationMenuList>
            <NavigationMenuItem value="">
              <NavigationMenuTrigger>Broken</NavigationMenuTrigger>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>,
      ),
    ).toThrow('NavigationMenuItem requires a non-empty value; received "".');
  });
});
