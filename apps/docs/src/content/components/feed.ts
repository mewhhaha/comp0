import { component, p, prop } from "../define.js";

export default component({
  slug: "feed",
  title: "Feed",
  group: "navigation",
  summary: "An infinite-scroll list of articles that keyboard users can page through and escape.",
  analogy:
    "Like a stack of morning papers: flip to the next story, or put the pile down at any time.",
  whenToUse:
    "Use it for scroll-loaded content such as news or activity streams; use GridList for a selectable collection.",
  steps: {
    main: "Wrap the stream in Feed with an aria-label.",
    supporting: "Render one FeedArticle per story with aria-labelledby pointing at its title.",
    behavior:
      "Set busy while loading more, and total when you know how many articles exist beyond the rendered ones.",
    code: '<Feed aria-label="Recipe stories" busy={loading}>\n  <FeedArticle aria-labelledby="story-1">\n    <h3 id="story-1">Roasted tomato soup</h3>\n  </FeedArticle>\n</Feed>;',
  },
  imports: ["Feed", "FeedArticle"],
  snippet:
    '<Feed aria-label="Recipe stories" total={12}><FeedArticle aria-labelledby="story-1"><h3 id="story-1">Roasted tomato soup</h3></FeedArticle><FeedArticle aria-labelledby="story-2"><h3 id="story-2">Charred corn salad</h3></FeedArticle></Feed>',
  parts: [
    p(
      "Feed",
      "root",
      "The scroll-loaded article list; PageDown and PageUp walk it and Ctrl+Home / Ctrl+End escape it.",
      true,
      false,
      [
        prop("aria-label", "string", "Names the feed for assistive technology; required."),
        prop("busy", "boolean", "Marks the feed as loading more articles via aria-busy."),
        prop(
          "total",
          "number",
          "Total article count when known beyond the rendered ones; feeds aria-setsize, which otherwise reports the rendered count.",
        ),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
    p(
      "FeedArticle",
      "item",
      "Native article that can receive focus; announces its position and set size automatically.",
      true,
      false,
      [
        prop(
          "aria-labelledby",
          "string",
          "Point it at the article's title element so screen readers hear what it is about.",
        ),
      ],
    ),
  ],
  keyboard: [
    { keys: ["PageDown"], action: "Moves focus to the next article." },
    { keys: ["PageUp"], action: "Moves focus to the previous article." },
    {
      keys: ["Ctrl", "End"],
      action: "Moves focus to the first focusable element after the feed.",
    },
    {
      keys: ["Ctrl", "Home"],
      action: "Moves focus to the first focusable element before the feed.",
    },
    { keys: ["Tab"], action: "Moves into an article, then through its links and controls." },
  ],
  stateHooks: [
    { attribute: "[data-busy]", on: "Feed", meaning: "More articles are loading." },
    {
      attribute: ":focus-visible",
      on: "FeedArticle",
      meaning: "The article has keyboard focus.",
    },
  ],
  form: "A feed does not create form values.",
  accessibility: [
    "Give the feed an aria-label naming the stream, such as Recipe stories.",
    "Label every article via aria-labelledby on FeedArticle so PageDown announces where it landed.",
    "Keep something focusable before and after the feed; Ctrl+Home and Ctrl+End are how keyboard users escape an endless scroll.",
  ],
  related: ["grid-list", "messages"],
});
