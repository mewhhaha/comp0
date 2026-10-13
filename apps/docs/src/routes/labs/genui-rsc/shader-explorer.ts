/** Sliders share typed values with a host component. */
export const shaderExplorer = `<Stack>
  <Heading level={2}>Plasma explorer</Heading>
  <Text>Move the controls and the shader follows right away. Nothing goes back to the model until you pick a next step.</Text>
  <Grid columns={2}>
    <Card title="Controls">
      <Slider label="Speed" bind="speed" min={0} max={4} step={0.1} />
      <Slider label="Scale" bind="scale" min={1} max={12} step={0.5} />
      <Slider label="Hue" bind="hue" min={0} max={360} />
      <Output label="One cycle" value={round(6.28 / max(speed, 0.1), 1)} unit=" s" />
    </Card>
    <Card title="Preview"><Shader /></Card>
  </Grid>
  <Suggestions label="Next steps" items={["Make it warmer","Add a ripple","Explain the shader"]} />
</Stack>`;
