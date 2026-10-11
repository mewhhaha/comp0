/** A recorded model response: knobs bound to names that the host's shader view reads. */
export const shaderExplorer = JSON.stringify({
  type: "Stack",
  children: [
    { type: "Heading", text: "Plasma explorer", level: 2 },
    {
      type: "Text",
      text: "Move the controls and the shader follows right away. Nothing goes back to the model until you pick a next step.",
    },
    {
      type: "Grid",
      columns: 2,
      children: [
        {
          type: "Card",
          title: "Controls",
          children: [
            {
              type: "Slider",
              label: "Speed",
              name: "speed",
              min: 0,
              max: 4,
              step: 0.1,
              value: { $bind: "speed", initial: 1 },
            },
            {
              type: "Slider",
              label: "Scale",
              name: "scale",
              min: 1,
              max: 12,
              step: 0.5,
              value: { $bind: "scale", initial: 4 },
            },
            {
              type: "Slider",
              label: "Hue",
              name: "hue",
              min: 0,
              max: 360,
              value: { $bind: "hue", initial: 200 },
            },
            {
              type: "Output",
              label: "One cycle",
              value: { $expr: "round(6.28 / max(speed, 0.1), 1)" },
              unit: " s",
            },
          ],
        },
        { type: "Card", title: "Preview", children: [{ type: "Slot", name: "shader" }] },
      ],
    },
    {
      type: "Suggestions",
      label: "Next steps",
      items: ["Make it warmer", "Add a ripple", "Explain the shader"],
    },
  ],
});
