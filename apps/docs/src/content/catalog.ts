import type { ComponentDoc, ComponentGroup } from "./types.js";

// Each page lives in ./components/<slug>.ts. These lists are the only other
// place a component is named: they set its group and its position in the nav.
export const groupOrder = {
  actions: [
    "button",
    "toggle-button",
    "link",
    "file-trigger",
    "visually-hidden",
    "keybinding-hint",
    "meter",
    "progress-bar",
    "alert",
    "status",
    "error-summary",
    "separator",
    "toast",
    "toolbar",
    "split-button",
    "drop-zone",
    "avatar",
  ],
  charts: [
    "bar-chart",
    "column-chart",
    "line-chart",
    "area-chart",
    "pie-chart",
    "candlestick-chart",
    "scatter-chart",
    "dumbbell-chart",
    "boxplot-chart",
    "open-to-close-chart",
    "lollipop-chart",
    "stacked-bar-chart",
    "stacked-column-chart",
    "histogram-chart",
    "heatmap-chart",
    "sankey-chart",
    "map-chart",
  ],
  fields: [
    "text-area",
    "character-count",
    "mention-field",
    "code-editor",
    "fieldset",
    "text-field",
    "password-field",
    "search-field",
    "checkbox",
    "radio",
    "switch",
    "number-field",
    "slider",
    "pin-input",
    "range-slider",
    "color-field",
    "date-field",
    "tag-picker",
    "color-swatch-picker",
    "editable",
    "rating",
  ],
  navigation: [
    "accordion",
    "disclosure",
    "tabs",
    "breadcrumbs",
    "list-box",
    "menu",
    "tag-group",
    "resizer",
    "connect",
    "floating-panel",
    "inventory",
    "grid-list",
    "table",
    "tree-grid",
    "skip-link",
    "context-menu",
    "menubar",
    "tree",
    "carousel",
    "feed",
    "messages",
    "pagination",
    "timeline",
    "navigation-menu",
    "steps",
  ],
  pickers: [
    "select",
    "combobox",
    "autocomplete",
    "modal",
    "dialog",
    "alert-dialog",
    "popover",
    "tour",
    "tooltip",
    "calendar",
    "color-picker",
    "date-picker",
    "time-picker",
    "range-calendar",
    "date-range-picker",
    "preview",
    "drawer",
  ],
} satisfies Record<ComponentGroup["id"], string[]>;

const entries = import.meta.glob<ComponentDoc>("./components/*.ts", {
  eager: true,
  import: "default",
});

/** Entry files keyed by the slug in their file name. */
export const componentEntries = new Map(
  Object.entries(entries).map(([path, entry]) => [
    path.replace("./components/", "").replace(/\.ts$/, ""),
    entry,
  ]),
);

function groupComponents(id: ComponentGroup["id"]) {
  return groupOrder[id].map((slug) => {
    const entry = componentEntries.get(slug);
    if (!entry) throw new Error(`Missing component entry for ${slug}`);
    return entry;
  });
}

export const componentGroups = [
  {
    id: "actions",
    title: "Actions",
    description: "Presses, links, uploads, and hidden helper text.",
    components: groupComponents("actions"),
  },
  {
    id: "charts",
    title: "Charts",
    description: "Accessible visual and tabular views of quantitative values.",
    components: groupComponents("charts"),
  },
  {
    id: "fields",
    title: "Fields",
    description: "Inputs and choices that collect values.",
    components: groupComponents("fields"),
  },
  {
    id: "navigation",
    title: "Navigation",
    description: "Disclosure, navigation, and collection patterns.",
    components: groupComponents("navigation"),
  },
  {
    id: "pickers",
    title: "Pickers and overlays",
    description: "Choices and floating layers.",
    components: groupComponents("pickers"),
  },
] satisfies ComponentGroup[];
export const components = componentGroups.flatMap((group) => group.components);
export const componentBySlug = new Map(components.map((item) => [item.slug, item]));
