/** Compound parts stream as children; form actions remain host tools. */
export const releaseNotes = `<Stack>
  <Heading level={2}>What changed in 2.0</Heading>
  <Tabs defaultValue="highlights">
    <TabList label="Release notes">
      <Tab value="highlights">Highlights</Tab>
      <Tab value="breaking">Breaking changes</Tab>
      <Tab value="updates">Get updates</Tab>
    </TabList>
    <TabPanel value="highlights">
      <List>
        <Item>Layout streams from the server with no JavaScript.</Item>
        <Item>Controls drive your own views live.</Item>
        <Item>Data components refresh directly from your server.</Item>
      </List>
    </TabPanel>
    <TabPanel value="breaking"><Text>Interfaces are restricted JSX, with typed host state and children-driven composition.</Text></TabPanel>
    <TabPanel value="updates">
      <Form name="updates" label="Get release updates" submitLabel="Subscribe" action={[{"call":"subscribe","into":"subscription"}]}>
        <TextField label="Email" bind="email" inputType="email" required={true} />
      </Form>
      <Text tone="success">{subscription}</Text>
    </TabPanel>
  </Tabs>
</Stack>`;
