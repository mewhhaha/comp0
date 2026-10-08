import { userEvent } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { render } from "../../test/render.js";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanel,
  NavigationMenuTrigger,
} from "../index.js";

describe("navigation menu browser accessibility", () => {
  it("has no axe violations with a panel open", async () => {
    const { container, unmount } = render(
      <NavigationMenu aria-label="Main">
        <NavigationMenuList>
          <NavigationMenuItem value="products">
            <NavigationMenuTrigger>Products</NavigationMenuTrigger>
            <NavigationMenuPanel>
              <NavigationMenuLink href="#analytics" current>
                Analytics
              </NavigationMenuLink>
              <NavigationMenuLink href="#reports">Reports</NavigationMenuLink>
            </NavigationMenuPanel>
          </NavigationMenuItem>
          <NavigationMenuItem value="pricing">
            <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );
    await expectNoAxeViolations(container, "closed navigation menu");

    const trigger = container.querySelector<HTMLElement>("button")!;
    await userEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    await expectNoAxeViolations(container, "open navigation panel");
    unmount();
  });
});
