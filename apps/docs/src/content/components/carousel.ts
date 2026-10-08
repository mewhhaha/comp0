import { component, p, prop } from "../define.js";

export default component({
  slug: "carousel",
  title: "Carousel",
  group: "navigation",
  summary: "A labelled strip of slides shown one at a time with previous and next controls.",
  analogy:
    "Like a rotating shop window: one display at a time, and you can turn the crank yourself.",
  whenToUse:
    "Use it to feature a few highlights in limited space; use Tabs when people pick sections by name.",
  steps: {
    main: "Wrap everything in Carousel with an aria-label, and put the slides in CarouselViewport.",
    supporting:
      "Add CarouselPrevious and CarouselNext, plus CarouselAutoplayToggle when autoplay is set.",
    behavior:
      "Pass autoplay in milliseconds only with the toggle present; rotation pauses on hover or focus and the toggle stops it for good.",
    code: '<Carousel aria-label="Featured recipes" autoplay={5000}>\n  <CarouselAutoplayToggle />\n  <CarouselPrevious />\n  <CarouselNext />\n  <CarouselViewport>\n    <CarouselSlide>Soup</CarouselSlide>\n  </CarouselViewport>\n</Carousel>;',
  },
  imports: [
    "Carousel",
    "CarouselAutoplayToggle",
    "CarouselNext",
    "CarouselPrevious",
    "CarouselSlide",
    "CarouselViewport",
  ],
  snippet:
    '<Carousel aria-label="Featured recipes" loop autoplay={5000}><CarouselAutoplayToggle>⏯</CarouselAutoplayToggle><CarouselPrevious>‹</CarouselPrevious><CarouselNext>›</CarouselNext><CarouselViewport><CarouselSlide>Roasted tomato soup</CarouselSlide><CarouselSlide>Charred corn salad</CarouselSlide></CarouselViewport></Carousel>',
  parts: [
    p(
      "Carousel",
      "root",
      "Section with the carousel roledescription; owns the slide index and the autoplay pause bookkeeping.",
      true,
      false,
      [
        prop("aria-label", "string", "Names the carousel for assistive technology; required."),
        prop("value / defaultValue", "number", "Controlled or initial slide index."),
        prop("onChange", "(value: number) => void", "Receives the next slide index."),
        prop("loop", "boolean", "Previous on the first slide and Next on the last wrap around."),
        prop(
          "autoplay",
          "number",
          "Milliseconds between automatic advances; rotation pauses on hover or focus and stops via the toggle.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
    p(
      "CarouselViewport",
      "region",
      "Wraps the slides; exposes --comp0-carousel-index for transform tracks and flips aria-live between off (rotating) and polite (paused or stopped).",
      true,
      false,
      [prop("style", "CSSProperties", "Merged under the exposed --comp0-carousel-index variable.")],
    ),
    p(
      "CarouselSlide",
      "item",
      "One slide, announced as a group with the slide roledescription.",
      true,
      false,
      [
        prop(
          "aria-label",
          "string",
          'Names the slide after its content; defaults to its computed "N of M" position.',
        ),
      ],
    ),
    p(
      "CarouselPrevious",
      "trigger",
      "Native button that shows the previous slide; disabled on the first slide unless loop.",
      true,
      true,
      [prop("aria-label", "string", 'Accessible name; defaults to "Previous slide".')],
    ),
    p(
      "CarouselNext",
      "trigger",
      "Native button that shows the next slide; disabled on the last slide unless loop.",
      true,
      true,
      [prop("aria-label", "string", 'Accessible name; defaults to "Next slide".')],
    ),
    p(
      "CarouselAutoplayToggle",
      "trigger",
      "Native button that stops and restarts auto-rotation; renders nothing without autoplay.",
      true,
      true,
      [
        prop(
          "aria-label",
          "string",
          'Defaults to "Pause carousel" while rotating and "Play carousel" once stopped.',
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves through the rotation, previous, and next controls." },
    { keys: ["Enter"], action: "Presses the focused carousel control." },
    { keys: ["Space"], action: "Presses the focused carousel control." },
  ],
  stateHooks: [
    { attribute: "[data-current]", on: "CarouselSlide", meaning: "This slide is showing." },
    { attribute: "[data-rotating]", on: "Carousel", meaning: "Auto-rotation is advancing." },
    {
      attribute: "[data-stopped]",
      on: "Carousel, CarouselAutoplayToggle",
      meaning: "The toggle stopped auto-rotation.",
    },
    {
      attribute: ":disabled",
      on: "CarouselPrevious, CarouselNext",
      meaning: "The bound was reached without loop.",
    },
  ],
  form: "A carousel does not create form values.",
  accessibility: [
    "Give the carousel an aria-label naming the content, such as Featured recipes.",
    "Keep CarouselAutoplayToggle first in the tab order whenever autoplay is set; hover and focus pauses are temporary, the toggle is the guaranteed stop (WCAG 2.2.2).",
    "Slide changes announce politely only while rotation is paused or stopped; name slides after their content with aria-label when N of M is too vague.",
  ],
  related: ["tabs"],
});
