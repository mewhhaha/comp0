import { component, p, prop } from "../define.js";

export default component({
  slug: "breadcrumbs",
  title: "Breadcrumbs",
  group: "navigation",
  summary: "A trail of links showing where this page sits.",
  analogy: "Like crumbs showing the path back through a forest.",
  whenToUse: "Use it when pages live inside a clear hierarchy.",
  steps: {
    main: "Start Breadcrumbs around the trail.",
    supporting: "Add BreadcrumbLink for each place people can return to.",
    behavior: "Mark the current page as current instead of making it a misleading link.",
    code: '<Breadcrumbs>\n  <BreadcrumbLink href="/">Home</BreadcrumbLink>\n</Breadcrumbs>;',
  },
  imports: ["BreadcrumbLink", "Breadcrumbs"],
  snippet: '<Breadcrumbs>\n  <BreadcrumbLink href="/">Home</BreadcrumbLink>\n</Breadcrumbs>;',
  parts: [
    p("Breadcrumbs", "root", "Navigation landmark and list.", true, false, [
      prop("aria-label", "string", 'Names the landmark; defaults to "Breadcrumbs".'),
    ]),
    p("BreadcrumbLink", "item", "Native anchor in the trail.", true, false, [
      prop("href", "string", "Destination for this trail stop."),
      prop("current", "boolean", 'Marks the page you are on with aria-current="page".'),
      prop("as", "ElementType", "Renders a router link instead of the native anchor."),
    ]),
  ],
  keyboard: [{ keys: ["Enter"], action: "Follows the focused breadcrumb." }],
  stateHooks: [
    { attribute: "[data-current]", on: "BreadcrumbLink", meaning: "This is the current page." },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Use a navigation label when your page needs one.",
    "Make the current page clear without a misleading link.",
    "Keep trail labels concise.",
  ],
  related: ["link", "tabs"],
});
