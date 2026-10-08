import { component, p, prop } from "../define.js";

export default component({
  slug: "floating-panel",
  title: "Floating Panel",
  group: "navigation",
  summary:
    "A persistent non-modal inspector that can move, resize, overlap, and coexist with peer panels.",
  analogy:
    "Like a movable tool palette beside a canvas: it stays available without taking over the workspace.",
  whenToUse:
    "Use it for inspectors, layers, properties, and other secondary tools people need while continuing to work in the application.",
  steps: {
    main: "Wrap related panels in FloatingPanelGroup, then give each FloatingPanel its own trigger and labelled surface.",
    supporting:
      "Build the draggable surface header from FloatingPanelTitle, FloatingPanelDragHandle, and FloatingPanelClose; add FloatingPanelResizeHandle at the resize corner.",
    behavior:
      "Use position and size when geometry must persist. Render FloatingPanelGroup as an element for workspace-local coordinates, or leave it wrapper-free for viewport coordinates. Tab enters each panel normally; F6 is an optional shortcut between open panels and the application.",
    code: '<FloatingPanelGroup as="div">\n  <FloatingPanel>\n    <FloatingPanelTrigger>Layers</FloatingPanelTrigger>\n    <FloatingPanelSurface>\n      <FloatingPanelHeader>\n        <FloatingPanelDragHandle />\n        <FloatingPanelTitle>Layers</FloatingPanelTitle>\n        <FloatingPanelClose />\n      </FloatingPanelHeader>\n      <FloatingPanelResizeHandle />\n    </FloatingPanelSurface>\n  </FloatingPanel>\n</FloatingPanelGroup>;',
  },
  imports: [
    "FloatingPanel",
    "FloatingPanelClose",
    "FloatingPanelDragHandle",
    "FloatingPanelGroup",
    "FloatingPanelHeader",
    "FloatingPanelResizeHandle",
    "FloatingPanelSurface",
    "FloatingPanelTitle",
    "FloatingPanelTrigger",
  ],
  snippet:
    '<FloatingPanelGroup as="div"><FloatingPanel><FloatingPanelTrigger>Layers</FloatingPanelTrigger><FloatingPanelSurface><FloatingPanelHeader><FloatingPanelDragHandle /><FloatingPanelTitle>Layers</FloatingPanelTitle><FloatingPanelClose /></FloatingPanelHeader><FloatingPanelResizeHandle /></FloatingPanelSurface></FloatingPanel></FloatingPanelGroup>',
  parts: [
    p(
      "FloatingPanelGroup",
      "root",
      "Focus and stacking coordinator that optionally renders the panel boundary.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Renders a positioned local boundary; omit it to keep the group wrapper-free and viewport-based.",
        ),
      ],
    ),
    p(
      "FloatingPanel",
      "root",
      "Wrapper-free owner for one panel's open state and geometry.",
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
        prop("open", "boolean", "Controlled open state."),
        prop("defaultOpen", "boolean", "Initial uncontrolled open state."),
        prop("onToggle", "(open: boolean) => void", "Receives the next open state."),
        prop(
          "position",
          "FloatingPanelPosition | null",
          "Controlled viewport coordinates, or local coordinates when the group renders an element.",
        ),
        prop(
          "defaultPosition",
          "FloatingPanelPosition | null",
          "Initial coordinates; null begins anchored to the trigger.",
        ),
        prop(
          "onPositionChange",
          "(position: FloatingPanelPosition) => void",
          "Receives coordinates produced by moving the panel.",
        ),
        prop("size", "FloatingPanelSize | null", "Controlled width and height in pixels."),
        prop("defaultSize", "FloatingPanelSize | null", "Initial uncontrolled width and height."),
        prop(
          "onSizeChange",
          "(size: FloatingPanelSize) => void",
          "Receives geometry produced by resizing the panel.",
        ),
      ],
    ),
    p("FloatingPanelTrigger", "trigger", "Button that opens or closes its panel.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Fragment merges trigger behavior onto one child element.",
      ),
    ]),
    p(
      "FloatingPanelSurface",
      "content",
      "Non-modal dialog that is fixed to the viewport or positioned within its group boundary.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop("aria-label", "string", "Names the panel when FloatingPanelTitle is omitted."),
        prop("placement", "PopoverPlacement", "Initial side and alignment beside the trigger."),
        prop("offset", "number", "Initial pixel gap from the trigger; defaults to 8."),
        prop(
          "portal",
          "boolean",
          "Renders viewport panels into document.body; locally contained panels remain inside their group element.",
        ),
      ],
    ),
    p(
      "FloatingPanelHeader",
      "region",
      "Pointer-draggable header whose interactive descendants keep their native gestures.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
      ],
    ),
    p(
      "FloatingPanelDragHandle",
      "trigger",
      "Native button that moves the panel by pointer or an activated arrow-key interaction.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
      ],
    ),
    p("FloatingPanelTitle", "label", "Native h2 that labels the dialog surface.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
    ]),
    p("FloatingPanelClose", "trigger", "Native button that closes this panel.", true, false, [
      prop(
        "as",
        "ElementType | Fragment",
        "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
      ),
    ]),
    p(
      "FloatingPanelResizeHandle",
      "trigger",
      "Native button that changes size by pointer or an activated arrow-key interaction.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
      ],
    ),
  ],
  keyboard: [
    {
      keys: ["F6"],
      action: "Moves from the application through each open panel, then back to the application.",
    },
    {
      keys: ["Shift", "F6"],
      action: "Cycles through the same regions in reverse.",
    },
    {
      keys: ["Enter", "Space"],
      action: "Starts or commits a keyboard move or resize.",
      scope: "on a move or resize handle",
    },
    {
      keys: ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"],
      action: "Moves the panel by 16 pixels while keyboard moving is active.",
      scope: "on FloatingPanelDragHandle",
    },
    {
      keys: ["ArrowLeft", "ArrowRight"],
      action: "Decreases or increases panel width by 16 pixels while resizing is active.",
      scope: "on FloatingPanelResizeHandle",
    },
    {
      keys: ["ArrowUp", "ArrowDown"],
      action: "Decreases or increases panel height by 16 pixels while resizing is active.",
      scope: "on FloatingPanelResizeHandle",
    },
    {
      keys: ["Escape"],
      action: "Cancels an active move or resize; otherwise closes the focused panel.",
    },
    {
      keys: ["Tab"],
      action: "Follows the normal document order through panel and application controls.",
    },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "FloatingPanelTrigger",
      meaning: "Its panel is open.",
    },
    {
      attribute: "[data-open]",
      on: "FloatingPanelSurface",
      meaning: "The panel is open.",
    },
    {
      attribute: "[data-active]",
      on: "FloatingPanelSurface",
      meaning: "The panel is topmost in its group.",
    },
    {
      attribute: "[data-moving]",
      on: "FloatingPanelSurface",
      meaning: "A keyboard or pointer move is active.",
    },
    {
      attribute: "[data-moving]",
      on: "FloatingPanelHeader",
      meaning: "A keyboard or pointer move is active.",
    },
    {
      attribute: "[data-moving]",
      on: "FloatingPanelDragHandle",
      meaning: "A keyboard or pointer move is active.",
    },
    {
      attribute: "[data-resizing]",
      on: "FloatingPanelSurface",
      meaning: "A keyboard or pointer resize is active.",
    },
    {
      attribute: "[data-resizing]",
      on: "FloatingPanelResizeHandle",
      meaning: "A keyboard or pointer resize is active.",
    },
  ],
  form: "No native form behavior; form controls inside a panel keep their own behavior.",
  accessibility: [
    "Give every FloatingPanelSurface a visible FloatingPanelTitle or an explicit aria-label. The surface is a non-modal dialog and must not use aria-modal.",
    "Keep the surface and its controls in ordinary Tab order inside and outside panels. F6 and Shift+F6 are optional region-level shortcuts, never the only way to reach a panel.",
    "Make drag and resize handles visibly discoverable and large enough to operate. Enter or Space activates one, arrows adjust it, and Enter or Space commits the change.",
    "Let pointer users drag the header, but keep its buttons and form controls interactive. Add data-floating-panel-no-drag to any other header descendant that must own its pointer gesture.",
    "Do not put essential workflow content only inside a floating panel that can be closed or moved off the main reading path.",
    "Closing restores focus to that panel's trigger. Escape closes only the panel containing focus, not every panel in the group.",
  ],
  related: ["popover", "resizer", "inventory", "connect"],
  moreExamples: [
    {
      id: "annotations",
      title: "Anchored comment thread",
      description:
        "Attach a movable, non-modal discussion to highlighted document content, with a chronological message log, reply composer, resolve state, and focusable numbered pin.",
    },
  ],
});
