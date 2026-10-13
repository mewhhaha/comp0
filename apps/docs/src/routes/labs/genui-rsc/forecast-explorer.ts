/** A city selection refreshes one server component. */
export const forecastExplorer = `<Stack>
  <Heading level={2}>Seven-day forecast</Heading>
  <Text>Pick a city. The chart refreshes directly from the server, without another turn.</Text>
  <Select label="City" bind="city">
    <Option value="Oslo">Oslo</Option>
    <Option value="Lisbon">Lisbon</Option>
    <Option value="Tokyo">Tokyo</Option>
    <Option value="Nairobi">Nairobi</Option>
  </Select>
  <Forecast city={city} />
</Stack>`;
