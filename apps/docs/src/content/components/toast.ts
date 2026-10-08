import { component, p, prop } from "../define.js";

export default component({
  slug: "toast",
  title: "Toast",
  group: "actions",
  summary: "A short status message that appears, announces itself, and leaves on its own.",
  analogy: "Like a waiter briefly telling you the kitchen got your order.",
  whenToUse:
    "Use it to confirm background results such as saves; keep anything needing a decision in a dialog.",
  steps: {
    main: "Wrap the app in ToastProvider and call notify from useToast where results happen.",
    supporting: "Add one ToastRegion whose render prop returns a Toast with a ToastClose inside.",
    behavior: 'Use kind "alert" plus timeout null for urgent messages people must not miss.',
    code: "<ToastRegion>\n  {(toast) => (\n    <Toast toast={toast}>\n      {toast.content}\n      <ToastClose />\n    </Toast>\n  )}\n</ToastRegion>;",
  },
  imports: ["Button", "Toast", "ToastClose", "ToastProvider", "ToastRegion", "useToast"],
  snippet:
    "<ToastProvider><SaveButton /><ToastRegion>{(toast) => <Toast toast={toast}>{toast.content}<ToastClose /></Toast>}</ToastRegion></ToastProvider>",
  parts: [
    p("ToastProvider", "root", "Owns the notification queue; it owns no DOM.", false, false, [
      prop(
        "children",
        "ReactNode",
        "App content plus one ToastRegion; call useToast anywhere inside.",
      ),
    ]),
    p(
      "useToast",
      "value",
      "Hook returning notify and dismiss; throws outside ToastProvider.",
      false,
      false,
      [
        prop(
          "notify(content, options?)",
          '(content: ReactNode, options?: { kind?: "status" | "alert"; timeout?: number | null }) => string',
          "Queues a toast and returns its id; kind defaults to status, timeout to 6000 ms, and null keeps it until dismissed.",
        ),
        prop("dismiss(id)", "(id: string) => void", "Removes a queued toast by id."),
      ],
    ),
    p(
      "ToastRegion",
      "content",
      "Labelled live region shown in the top layer only while toasts exist; hover or focus pauses auto-dismiss timers.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop(
          "children",
          "(toast: ToastRecord) => ReactNode",
          "Render prop that returns one Toast per queued record.",
        ),
        prop(
          "aria-label",
          "string",
          'Region name for assistive technology; defaults to "Notifications".',
        ),
        prop("forceMount", "boolean", "Keep the region rendered while the queue is empty."),
      ],
    ),
    p(
      "Toast",
      "content",
      "One notification; role=status for polite kinds and role=alert for urgent ones.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop("toast", "ToastRecord", "The queued record this item renders."),
        prop("children", "ReactNode", "Custom layout; defaults to the record's content."),
      ],
    ),
    p(
      "ToastClose",
      "trigger",
      "Native button pre-wired to dismiss its surrounding toast.",
      true,
      true,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Element or component rendered in place of the default; Fragment merges the part onto your own element child.",
        ),
        prop("aria-label", "string", 'Accessible name; defaults to "Dismiss notification".'),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Reaches the dismiss button and other controls inside each toast." },
    {
      keys: ["Escape"],
      action:
        "Intentionally not a global shortcut; dismissal stays on the buttons inside the region.",
    },
  ],
  stateHooks: [
    { attribute: "[data-kind=alert]", on: "Toast", meaning: "The toast is urgent." },
    { attribute: "[data-kind=status]", on: "Toast", meaning: "The toast is polite." },
    {
      attribute: ":popover-open",
      on: "ToastRegion",
      meaning: "The region is shown in the top layer.",
    },
  ],
  form: "Toasts do not create native form values.",
  accessibility: [
    "Keep messages short and self-contained; role=status announces politely and role=alert interrupts, so reserve alert for urgent problems.",
    "Auto-dismiss timers pause while the region is hovered or contains focus, and sticky toasts (timeout null) stay for anything people must act on.",
    "The toast renders its live-region role and content in the same commit, which browsers announce for items appended one at a time; keep updates as new toasts instead of mutating an existing one.",
  ],
  related: ["tooltip", "popover"],
});
