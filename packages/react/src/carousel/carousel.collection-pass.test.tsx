import { act, Fragment, StrictMode, Suspense, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "../../test/render.js";
import { Carousel, type CarouselProps } from "./Carousel.js";
import { CarouselAutoplayToggle } from "./CarouselAutoplayToggle.js";
import { CarouselNext } from "./CarouselNext.js";
import { CarouselPrevious } from "./CarouselPrevious.js";
import { CarouselSlide, type CarouselSlideProps } from "./CarouselSlide.js";
import { CarouselViewport } from "./CarouselViewport.js";

function serverRender(ui: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  container.innerHTML = renderToString(ui);
  return container;
}

async function hydrate(container: Element, ui: ReactElement) {
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, ui);
  });
  return root;
}

/** Each slide as `label|current|aria-hidden|inert`, in document order. */
const slideRows = (container: Element, selector = "[aria-roledescription='slide']") =>
  [...container.querySelectorAll(selector)].map(
    (slide) =>
      `${slide.getAttribute("aria-label")}|${slide.hasAttribute("data-current")}|${slide.getAttribute("aria-hidden")}|${slide.hasAttribute("inert")}`,
  );

function disabledButtons(container: Element) {
  const previous = container.querySelector<HTMLButtonElement>("[aria-label='Previous slide']")!;
  const next = container.querySelector<HTMLButtonElement>("[aria-label='Next slide']")!;
  return { previous: previous.disabled, next: next.disabled };
}

function Card(props: CarouselSlideProps) {
  return <CarouselSlide {...props} />;
}

const deck = (names: string[], props: Partial<CarouselProps> = {}) => (
  <Carousel aria-label="Deck" {...props}>
    <CarouselAutoplayToggle />
    <CarouselPrevious />
    <CarouselNext />
    <CarouselViewport>
      {names.map((name) => (
        <CarouselSlide key={name}>{name}</CarouselSlide>
      ))}
    </CarouselViewport>
  </Carousel>
);

/**
 * On the server and while hydrating, Carousel renders its children once more ahead of the real
 * slides, where each slide records itself, so the real slides know how many there are and server
 * HTML already has every "N of M" label and the current slide.
 */
describe("Carousel collection pass", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders every slide's label, the current slide, and hidden inert others in server HTML", () => {
    const container = serverRender(deck(["A", "B", "C"], { defaultValue: 1 }));

    expect(slideRows(container)).toEqual([
      "1 of 3|false|true|true",
      "2 of 3|true|null|false",
      "3 of 3|false|true|true",
    ]);
  });

  it("leaves no slides or buttons in the pass's hidden holder ahead of the carousel", () => {
    const container = serverRender(deck(["A", "B"]));

    const holder = container.firstElementChild!;
    expect(holder.hasAttribute("hidden")).toBe(true);
    expect(holder.querySelectorAll("*")).toHaveLength(0);
    expect(holder.nextElementSibling).toBe(container.querySelector("section"));
    expect(container.querySelectorAll("[aria-roledescription='slide']")).toHaveLength(2);
    expect(container.querySelectorAll("button")).toHaveLength(2);
  });

  it.each([
    { names: ["A", "B", "C"], props: {} },
    { names: ["A", "B", "C"], props: { defaultValue: 2 } },
    { names: ["A", "B", "C"], props: { defaultValue: 1, loop: true } },
    { names: ["A"], props: {} },
    { names: [], props: {} },
    { names: [], props: { loop: true } },
    { names: ["A", "B"], props: { defaultValue: 7 } },
  ])(
    "disables Next and Previous in server HTML as a client mount does ($names.length slides, $props)",
    ({ names, props }) => {
      const server = serverRender(deck(names, props));
      const client = render(deck(names, props)).container;

      expect(disabledButtons(server)).toEqual(disabledButtons(client));
      expect(slideRows(server)).toEqual(slideRows(client));
    },
  );

  it("numbers slides in a consumer component and a Fragment, and keeps a consumer aria-label", () => {
    const container = serverRender(
      <Carousel aria-label="Deck">
        <CarouselViewport>
          <Card>A</Card>
          <Fragment>
            <CarouselSlide aria-label="Named B">B</CarouselSlide>
            <Card>C</Card>
          </Fragment>
        </CarouselViewport>
      </Carousel>,
    );

    expect(slideRows(container)).toEqual([
      "1 of 3|true|null|false",
      "Named B|false|true|true",
      "3 of 3|false|true|true",
    ]);
  });

  it("starts a nested carousel's numbering at its own root", () => {
    const container = serverRender(
      <Carousel aria-label="Outer">
        <CarouselNext data-probe="outer-next" />
        <CarouselViewport>
          <CarouselSlide data-probe="outer">
            <Carousel aria-label="Inner">
              <CarouselViewport>
                <CarouselSlide data-probe="inner">x</CarouselSlide>
                <CarouselSlide data-probe="inner">y</CarouselSlide>
                <CarouselSlide data-probe="inner">z</CarouselSlide>
              </CarouselViewport>
            </Carousel>
          </CarouselSlide>
          <CarouselSlide data-probe="outer">Second</CarouselSlide>
        </CarouselViewport>
      </Carousel>,
    );

    expect(slideRows(container, "[data-probe='outer']")).toEqual([
      "1 of 2|true|null|false",
      "2 of 2|false|true|true",
    ]);
    expect(slideRows(container, "[data-probe='inner']")).toEqual([
      "1 of 3|true|null|false",
      "2 of 3|false|true|true",
      "3 of 3|false|true|true",
    ]);
    expect(container.querySelector<HTMLButtonElement>("[data-probe='outer-next']")!.disabled).toBe(
      false,
    );
  });

  it("hydrates without a mismatch or an attribute write and removes the pass", async () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = deck(["A", "B", "C"], { defaultValue: 2 });
    const container = serverRender(ui);
    const before = slideRows(container);
    const writes = vi.spyOn(Element.prototype, "setAttribute");
    const removals = vi.spyOn(Element.prototype, "removeAttribute");

    const root = await hydrate(container, <StrictMode>{ui}</StrictMode>);

    expect(errors).not.toHaveBeenCalled();
    const slides = [...container.querySelectorAll("[aria-roledescription='slide']")];
    const slideWrites = (spy: typeof writes | typeof removals) =>
      spy.mock.contexts.filter((element) => slides.includes(element as Element));
    expect(slideWrites(writes)).toEqual([]);
    expect(slideWrites(removals)).toEqual([]);
    expect(slideRows(container)).toEqual(before);
    expect(disabledButtons(container)).toEqual({ previous: false, next: true });
    expect(container.querySelector(":scope > [hidden]")).toBeNull();
    await act(async () => root.unmount());
  });

  it("repairs slide attributes the server rendered differently from the hydration render", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = deck(["A", "B", "C"]);
    const container = serverRender(ui);
    const [first, second] = container.querySelectorAll("[aria-roledescription='slide']");
    first!.setAttribute("aria-label", "1 of 9");
    first!.removeAttribute("data-current");
    first!.setAttribute("aria-hidden", "true");
    first!.setAttribute("inert", "");
    second!.setAttribute("data-current", "");
    second!.removeAttribute("aria-hidden");
    second!.removeAttribute("inert");

    const root = await hydrate(container, ui);

    expect(slideRows(container)).toEqual([
      "1 of 3|true|null|false",
      "2 of 3|false|true|true",
      "3 of 3|false|true|true",
    ]);
    await act(async () => root.unmount());
  });

  it("ends with the right labels after hydrating slides inside a Suspense boundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ui = (
      <Carousel aria-label="Deck">
        <CarouselPrevious />
        <CarouselNext />
        <CarouselViewport>
          <Suspense fallback={null}>
            <CarouselSlide>A</CarouselSlide>
            <CarouselSlide>B</CarouselSlide>
          </Suspense>
        </CarouselViewport>
      </Carousel>
    );
    const container = serverRender(ui);
    expect(slideRows(container)).toEqual(["1 of 2|true|null|false", "2 of 2|false|true|true"]);

    const root = await hydrate(container, ui);

    expect(slideRows(container)).toEqual(["1 of 2|true|null|false", "2 of 2|false|true|true"]);
    expect(disabledButtons(container).next).toBe(false);
    await act(async () => root.unmount());
  });
});
