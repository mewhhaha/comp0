import { type JsonValue } from "../../src/json/parse.js";

/** A researched answer: cited paragraphs, a table of figures, a code snippet to copy, and replies. */
export const citedAnswer: JsonValue = {
  type: "Stack",
  children: [
    { type: "Heading", text: "Why is the sky blue?", level: 2 },
    {
      type: "CitedText",
      text: "Sunlight is scattered by air molecules, and short blue wavelengths scatter far more than long red ones [1]. The effect is named Rayleigh scattering after the physicist who described it [2].\n\nAt sunset the light crosses more air, so the blue is scattered out of the beam and the sky turns red [1][3]. Violet scatters even more but the sun emits less of it [3].",
      sources: [
        {
          title: "Why the sky is blue",
          href: "https://example.com/sky",
          note: "Physics Today, 2019",
        },
        {
          title: "On the transmission of light by the atmosphere",
          href: "https://example.com/rayleigh",
          note: "Lord Rayleigh, 1871",
        },
        { title: "Atmospheric optics handbook", note: "Chapter 4" },
      ],
    },
    {
      type: "Table",
      caption: "Scattering by color",
      columns: ["Color", "Wavelength (nm)", "Relative scattering"],
      rows: [
        ["Violet", 400, 9.4],
        ["Blue", 470, 5.6],
        ["Green", 530, 3.3],
        ["Red", 650, 1],
      ],
    },
    { type: "Text", text: "To reproduce the figures in code, install the helper:" },
    { type: "Text", text: "npm install sky-optics" },
    { type: "CopyButton", label: "Copy install command", value: "npm install sky-optics" },
    {
      type: "Suggestions",
      label: "Follow-up questions",
      items: ["Why are sunsets red?", "Why is the ocean blue?", "Show the math"],
    },
  ],
};
