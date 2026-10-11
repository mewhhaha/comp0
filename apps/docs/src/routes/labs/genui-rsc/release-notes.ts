/** A recorded model response: tabs whose panels stream in, and a form whose action calls a tool. */
export const releaseNotes = JSON.stringify({
  type: "Stack",
  children: [
    { type: "Heading", text: "What changed in 2.0", level: 2 },
    {
      type: "Tabs",
      label: "Release notes",
      tabs: [
        {
          label: "Highlights",
          children: [
            {
              type: "List",
              items: [
                "Layout streams from the server with no JavaScript.",
                "Controls drive your own views live.",
                "Tools run on your server, called straight from the interface.",
              ],
            },
          ],
        },
        {
          label: "Breaking changes",
          children: [
            {
              type: "Text",
              text: "Props are Standard Schemas now, and a key ending in a question mark is optional.",
            },
          ],
        },
        {
          label: "Get updates",
          children: [
            {
              type: "Form",
              name: "updates",
              title: "Get release updates",
              submitLabel: "Subscribe",
              action: [{ call: "subscribe", into: "subscription" }],
              children: [
                {
                  type: "TextField",
                  label: "Email",
                  name: "email",
                  inputType: "email",
                  required: true,
                },
              ],
            },
            { type: "Text", text: { $expr: "subscription" }, tone: "success" },
          ],
        },
      ],
    },
  ],
});
