import { afterEach, describe, expect, it } from "vitest";
import { expectNoAxeViolations } from "../../test/axe.js";
import { cleanupRoots, render } from "../../test/render.js";
import { Carousel } from "./Carousel.js";
import { CarouselAutoplayToggle } from "./CarouselAutoplayToggle.js";
import { CarouselNext } from "./CarouselNext.js";
import { CarouselPrevious } from "./CarouselPrevious.js";
import { CarouselSlide } from "./CarouselSlide.js";
import { CarouselViewport } from "./CarouselViewport.js";

afterEach(() => cleanupRoots());

describe("Carousel browser accessibility", () => {
  it("has no axe violations while autoplay is rotating onto a later slide", async () => {
    const { container } = render(
      <Carousel aria-label="Featured recipes" autoplay={150}>
        <CarouselAutoplayToggle />
        <CarouselPrevious />
        <CarouselNext />
        <CarouselViewport>
          <CarouselSlide>Soup</CarouselSlide>
          <CarouselSlide>Salad</CarouselSlide>
          <CarouselSlide>Stew</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );
    const viewport = container.querySelector("[aria-live]")!;
    expect(viewport.getAttribute("aria-live")).toBe("off");
    await expect
      .poll(() => container.querySelector("[data-current]")?.textContent, { timeout: 3000 })
      .not.toBe("Soup");
    await expectNoAxeViolations(container, "rotating carousel");
  });
});
