import { component, p, prop } from "../define.js";

export default component({
  slug: "navigation-menu",
  title: "Navigation Menu",
  group: "navigation",
  summary: "A site nav where some links unfold into small panels of more links.",
  analogy:
    "Like a store directory: most signs point straight somewhere, a few unfold into a small map.",
  whenToUse:
    "Use it for site-wide navigation with grouped destinations; use Menubar for application commands.",
  steps: {
    main: "Start NavigationMenu with NavigationMenuList around the items.",
    supporting:
      "Give each NavigationMenuItem a value, then pair a NavigationMenuTrigger with its NavigationMenuPanel of links.",
    behavior:
      "Use NavigationMenuLink for every destination and mark the page you are on with current.",
    code: '<NavigationMenu aria-label="Main">\n  <NavigationMenuList>\n    <NavigationMenuItem value="products">\n      <NavigationMenuTrigger>Products</NavigationMenuTrigger>\n      <NavigationMenuPanel>\n        <NavigationMenuLink href="/analytics">Analytics</NavigationMenuLink>\n      </NavigationMenuPanel>\n    </NavigationMenuItem>\n  </NavigationMenuList>\n</NavigationMenu>;',
  },
  imports: [
    "NavigationMenu",
    "NavigationMenuPanel",
    "NavigationMenuItem",
    "NavigationMenuLink",
    "NavigationMenuList",
    "NavigationMenuTrigger",
  ],
  snippet:
    '<NavigationMenu aria-label="Main">\n  <NavigationMenuList>\n    <NavigationMenuItem value="products">\n      <NavigationMenuTrigger>Products</NavigationMenuTrigger>\n      <NavigationMenuPanel>\n        <NavigationMenuLink href="/analytics">Analytics</NavigationMenuLink>\n      </NavigationMenuPanel>\n    </NavigationMenuItem>\n  </NavigationMenuList>\n</NavigationMenu>;',
  parts: [
    p(
      "NavigationMenu",
      "root",
      "Navigation landmark that keeps a single panel open at a time.",
      true,
      false,
      [
        prop("aria-label", "string", "Names the landmark when the page has more than one nav."),
        prop(
          "value / defaultValue",
          "string",
          'Controlled or initial open item; "" means every panel is closed.',
        ),
        prop("onChange", "(value: string) => void", "Receives the next open item value."),
      ],
    ),
    p("NavigationMenuList", "root", "Native list of navigation items.", true, false),
    p("NavigationMenuItem", "item", "List item pairing one trigger with its panel.", true, false, [
      prop("value", "string", "Identity that pairs the trigger with its panel."),
    ]),
    p(
      "NavigationMenuTrigger",
      "trigger",
      "Native button that toggles its item's panel; hovering opens it after a short intent delay.",
      true,
      false,
      [
        prop(
          "as",
          "ElementType | Fragment",
          "Fragment merges the trigger onto your own element child.",
        ),
      ],
    ),
    p(
      "NavigationMenuPanel",
      "region",
      "Inline panel of links; it stays in the page flow so CSS positions it.",
      true,
      false,
    ),
    p(
      "NavigationMenuLink",
      "item",
      "Native anchor to a destination; activating it closes the open panel.",
      true,
      false,
      [
        prop("href", "string", "Destination URL."),
        prop("current", "boolean", 'Marks the page you are on with aria-current="page".'),
        prop("as", "ElementType", "Renders a router link instead of the native anchor."),
      ],
    ),
  ],
  keyboard: [
    { keys: ["Tab"], action: "Moves through triggers and links in document order." },
    { keys: ["Enter"], action: "Toggles the focused trigger's panel." },
    { keys: ["Space"], action: "Toggles the focused trigger's panel." },
    { keys: ["Escape"], action: "Closes the open panel and returns focus to its trigger." },
    {
      keys: ["ArrowDown", "ArrowRight"],
      action:
        "Moves to the next top-level stop, or from an expanded trigger to its panel's first link.",
      scope: "top-level row",
    },
    {
      keys: ["ArrowDown", "ArrowRight"],
      action: "Moves to the next link in the panel.",
      scope: "panel link",
    },
    {
      keys: ["ArrowUp", "ArrowLeft"],
      action: "Moves to the previous stop or link; movement never wraps.",
    },
    { keys: ["Home"], action: "Moves to the first stop or the panel's first link." },
    { keys: ["End"], action: "Moves to the last stop or the panel's last link." },
  ],
  stateHooks: [
    {
      attribute: "[data-open]",
      on: "NavigationMenuItem, NavigationMenuTrigger, NavigationMenuPanel",
      meaning: "This item's panel is open.",
    },
    { attribute: "[data-open]", on: "NavigationMenu", meaning: "Some panel is open." },
    {
      attribute: "[aria-current]",
      on: "NavigationMenuLink",
      meaning: "This link is the current page.",
    },
    {
      attribute: "[data-current]",
      on: "NavigationMenuLink",
      meaning: "Presence hook mirroring aria-current for styling.",
    },
  ],
  form: "No native form behavior.",
  accessibility: [
    "Give the nav an aria-label when the page has more than one navigation landmark.",
    'Triggers are disclosure buttons, not role="menu" items; Tab moves through triggers and links in document order, and arrow keys, Home, and End move focus without opening panels.',
    "Horizontal arrow movement follows visual direction and mirrors in RTL.",
    "Mark the page you are on with current instead of relying on styling alone.",
    "Panels stay in the page flow; keep each one right after its trigger so reading order matches the visual order.",
  ],
  related: ["menubar", "disclosure", "breadcrumbs", "link"],
});
