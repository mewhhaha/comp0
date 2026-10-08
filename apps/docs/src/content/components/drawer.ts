import { component, p, prop } from "../define.js";

export default component({
  slug: "drawer",
  title: "Drawer",
  group: "pickers",
  summary: "An edge-anchored modal panel that slides in and can be swiped away.",
  analogy: "Like a sliding tray that pulls out from the side of a cabinet and pushes back shut.",
  whenToUse:
    "Use it for secondary tasks such as settings, filters, or a cart that belong beside the page rather than over its center.",
  steps: {
    main: "Start Drawer with DrawerTrigger and pick the side the panel anchors to.",
    supporting:
      "Put a labelled DrawerContent after the trigger and anchor its styles with the data-side attribute.",
    behavior:
      "Keep an explicit close action inside; dragging the panel toward its edge or pressing Escape also dismisses it.",
    code: '<Drawer side="right">\n  <DrawerTrigger>Open settings</DrawerTrigger>\n  <DrawerContent aria-labelledby="settings-title">\n    <h2 id="settings-title">Settings</h2>\n  </DrawerContent>\n</Drawer>;',
  },
  imports: ["Drawer", "DrawerContent", "DrawerTrigger"],
  snippet:
    '<Drawer side="right">\n  <DrawerTrigger>Open settings</DrawerTrigger>\n  <DrawerContent aria-labelledby="settings-title">\n    <h2 id="settings-title">Settings</h2>\n  </DrawerContent>\n</Drawer>;',
  parts: [
    p(
      "Drawer",
      "root",
      "Wrapper-free provider for the drawer's open state and anchored side.",
      false,
      false,
      [
        prop(
          "as",
          "ElementType",
          "Renders a wrapper element that carries the root's data attributes and DOM props; without it the root renders no DOM.",
        ),
        prop(
          "id",
          "string",
          "Base for the generated trigger and content ids; also the wrapper id when as is set.",
        ),
        prop("open / defaultOpen", "boolean", "Controlled or initial open state."),
        prop("onOpenChange", "(open: boolean) => void", "Receives the next open state."),
        prop(
          "side",
          '"left" | "right" | "top" | "bottom"',
          'Edge the panel anchors to; defaults to "right".',
        ),
      ],
    ),
    p("DrawerTrigger", "trigger", "Button that opens the drawer.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges the trigger onto your own element child.",
      ),
    ]),
    p(
      "DrawerContent",
      "content",
      "Native modal panel anchored to one edge; dragging it toward that edge dismisses it.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop("aria-labelledby", "string", "Points to the drawer's visible heading."),
        prop("portal", "boolean", "Renders into document.body; on by default."),
        prop(
          "closedby",
          '"any" | "closerequest" | "none"',
          "Native dismissal policy; any adds light dismiss where supported.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Escape"], action: "Closes and restores trigger focus." },
    { keys: ["Tab"], action: "Cycles inside the modal panel." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "DrawerTrigger, DrawerContent",
      meaning: "The drawer is open.",
    },
    {
      attribute: "[data-side]",
      on: "DrawerContent",
      meaning: "The anchored edge, for positioning and slide transitions.",
    },
    {
      attribute: "[data-dragging]",
      on: "DrawerContent",
      meaning: "A dismiss drag is following the pointer.",
    },
  ],
  form: "Forms inside DrawerContent submit normally; method=dialog closes the drawer without navigation.",
  accessibility: [
    "Connect DrawerContent to a visible heading with aria-labelledby.",
    "The swipe gesture is purely additive; keep an explicit close action for keyboard and assistive users.",
    "Focus stays inside the modal panel while it is open and returns to the trigger on close.",
  ],
  related: ["modal", "dialog", "alert-dialog"],
});
