import { component, p, prop } from "../define.js";

export default component({
  slug: "busy-region",
  title: "BusyRegion",
  group: "navigation",
  summary:
    "Marks content that is still arriving, such as a streamed answer, so comp0 parts inside stay quiet and keep focus where it is.",
  analogy:
    "Like a wet-paint sign: look, but wait for the sign to come down before judging the job.",
  whenToUse:
    "Use it around progressively rendered content, such as model-generated answers. Messages already acts as a busy region for its conversation.",
  steps: {
    main: "Wrap the streamed content in BusyRegion and set busy while it is still arriving.",
    supporting:
      "Render whatever has arrived so far; charts, tables, tabs, and other comp0 parts accept partial data without remounting.",
    behavior:
      "Set busy to false when the content is complete. Warnings about invalid data are reported once at that moment, and nothing inside moves focus until then.",
    code: "<BusyRegion busy={streaming}>\n  <p>{answerSoFar}</p>\n</BusyRegion>;",
  },
  imports: ["BusyRegion", "Button", "Status"],
  snippet:
    "<BusyRegion busy={streaming}><p>Answer so far…</p></BusyRegion><Status>{announcement}</Status>",
  parts: [
    p(
      "BusyRegion",
      "root",
      "A wrapper that sets aria-busy and tells comp0 parts inside that their data may be incomplete.",
      true,
      false,
      [
        prop(
          "busy",
          "boolean",
          "Marks the content as still being assembled. Sets aria-busy and data-busy; regions nest, so a part is busy while any ancestor region is.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-busy]",
      on: "BusyRegion",
      meaning: "The region, or an ancestor region, is still receiving content.",
    },
  ],
  form: "BusyRegion does not create form values. Inputs inside keep their values while the content grows.",
  accessibility: [
    "aria-busy tells assistive technology to wait for the finished content, so BusyRegion adds no live region of its own and never announces completion by itself.",
    "To announce completion once, keep a short Status outside the region (as in the example) or make the region itself a log or status. Do not do both, or the answer is announced twice.",
    "While busy, no comp0 part moves focus: overlays do not take initial focus, Tour and Toast do not claim focus, and arrow-key handling still works only in response to the user.",
    "Incomplete data is not invalid data: warnings about malformed values wait until busy turns off, and the fallback rendering is the same either way.",
    "Do not disable the control that started the response while it streams; disabling a focused button drops focus. Ignore the click instead.",
  ],
  related: ["messages", "status", "feed"],
});
