export const initialResponse = `<Stack gap="lg">
  <Card id="summary" title="Draft itinerary"><Text>A weekend by the sea.</Text></Card>
  <Form label="Your trip" name="trip" submitLabel="Save trip">
    <TextField id="note" label="Travel note" name="note" placeholder="What should we remember?" />
    <Slider id="seats" label="Travellers" bind="seats" min={1} max={10} />
  </Form>
  <Disclosure id="details" summary="Trip details"><Text>The ferry leaves at nine.</Text></Disclosure>
  <List id="checklist"><Item id="flight">Book the flight</Item></List>
</Stack>`;

export const revisionResponse = `<Update id="summary" title="Ready itinerary" />
<Update id="note" value="The model suggested this note" />
<Update id="seats" value={8} />
<Append to="checklist"><Item id="ferry">Book the ferry</Item></Append>`;

/** The valid update must also be withheld when another operation in the turn is invalid. */
export const invalidResponse = `<Update id="summary" title="This turn must be rejected" />
<Append to="missing"><Item>Do not add this</Item></Append>`;

/** Small delayed chunks give edits a visible streaming stage without requiring a model key. */
export async function* replay(response: string): AsyncGenerator<string> {
  for (let offset = 0; offset < response.length; offset += 80) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    yield response.slice(offset, offset + 80);
  }
}
