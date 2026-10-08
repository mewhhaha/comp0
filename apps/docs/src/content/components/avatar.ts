import { component, p, prop } from "../define.js";

export default component({
  slug: "avatar",
  title: "Avatar",
  group: "actions",
  summary: "An image that keeps a graceful stand-in while it loads or fails.",
  analogy: "Like a name tag showing your initials until the photo is pinned on.",
  whenToUse: "Use it for profile pictures and other images that may be slow or missing.",
  steps: {
    main: "Wrap Avatar around one AvatarImage and one AvatarFallback.",
    supporting:
      "Give AvatarImage a src and an alt that names the person; put initials or an icon in AvatarFallback.",
    behavior: "Style the settled states through [data-loaded] and [data-error] on Avatar.",
    code: '<Avatar>\n  <AvatarImage src={photoUrl} alt="Ada Kaplan" />\n  <AvatarFallback>AK</AvatarFallback>\n</Avatar>;',
  },
  imports: ["Avatar", "AvatarFallback", "AvatarImage"],
  snippet:
    '<Avatar><AvatarImage src={photoUrl} alt="Ada Kaplan" /><AvatarFallback>AK</AvatarFallback></Avatar>',
  parts: [
    p(
      "Avatar",
      "root",
      "Span that tracks the image status and exposes it as data attributes.",
      true,
      false,
      [
        prop("children", "ReactNode", "One AvatarImage and one AvatarFallback, in either order."),
        prop(
          "as",
          "ElementType",
          "Renders another element in place of the default; Fragment merges the props into its single child.",
        ),
      ],
    ),
    p("AvatarImage", "value", "Native img, hidden until a load succeeds.", true, false, [
      prop("src", "string", "Image source; a data: URI works for inline artwork."),
      prop("alt", "string", 'Names the person or entity; "" only when adjacent text already does.'),
      prop(
        "onLoad / onError",
        "(event: SyntheticEvent) => void",
        "Run before the avatar reacts; preventDefault keeps the status unchanged.",
      ),
    ]),
    p(
      "AvatarFallback",
      "feedback",
      "Stand-in such as initials or an icon, hidden once the image loads.",
      true,
      false,
      [prop("children", "ReactNode", "The initials or icon to show while there is no image.")],
    ),
  ],
  keyboard: [],
  stateHooks: [
    {
      attribute: "[data-loaded]",
      on: "Avatar",
      meaning: "The image loaded; the fallback is hidden.",
    },
    {
      attribute: "[data-error]",
      on: "Avatar",
      meaning: "The image failed to load; the fallback stays visible.",
    },
  ],
  form: "No form behavior; an avatar only displays an image.",
  accessibility: [
    'Give AvatarImage an alt that names the person or entity; use alt="" only when adjacent text already names them.',
    "Keep the fallback recognizable: initials or an icon, not an empty box.",
    "The image stays hidden until it loads, so a broken-image glyph is never announced or shown.",
  ],
  related: ["messages", "visually-hidden"],
});
