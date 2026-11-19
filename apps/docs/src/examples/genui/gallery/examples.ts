export type RecordedTurn = { prompt: string; reply: string; source: string };

export type GalleryExample = RecordedTurn & {
  slug: string;
  title: string;
  group: "In the studio" | "In the field" | "Behind the scenes";
  tryIt: string;
  mechanism: string;
  followUp?: RecordedTurn;
  format?: "json";
};

function json(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export const examples: readonly GalleryExample[] = [
  {
    slug: "print-proof",
    reply:
      "Here’s the sleeve with vermilion over black. Move the second plate a few millimetres to see where the rings slip out of register.",
    mechanism:
      "The host registers PrintProof as a client component. GenUI passes it the ink and plate offset as validated props whenever either control changes.",
    title: "Two-ink print proof",
    group: "In the studio",
    prompt: "Show me how a two-colour record sleeve changes when the second plate slips.",
    tryIt:
      "Choose the second ink and slide its plate sideways. Watch the rings separate on the printed proof.",
    source: `<Stack gap="lg">
  <PrintProof ink={ink} offset={offset} />
  <Select label="Second ink" bind="ink">
    <Option value="Vermilion">Vermilion</Option>
    <Option value="Cobalt">Cobalt</Option>
    <Option value="Fern">Fern</Option>
  </Select>
  <Slider label="Plate offset (mm)" bind="offset" min={0} max={8} />
</Stack>`,
  },
  {
    slug: "listening-room",
    reply:
      "Four rows with a centre aisle give you 16 chairs. Try closing the aisle or adding a row to see the new floor plan.",
    mechanism:
      "The seating diagram and the built-in Output both read the same two state values. One draws the arrangement, the other calculates its capacity.",
    title: "Listening room layout",
    group: "In the studio",
    prompt:
      "We have a six-seat-wide room for a listening party. How many chairs fit if we leave an aisle?",
    tryIt:
      "Change the row count or reserve a centre aisle. The floor plan and the chair count update together.",
    source: `<Stack>
  <SeatingPlan rows={rows} aisle={aisle} />
  <Slider label="Rows" bind="rows" min={2} max={8} />
  <Switch label="Leave a two-chair centre aisle" bind="aisle" />
  <Output label="Chairs to set out" value={rows * (aisle ? 4 : 6)} />
</Stack>`,
  },
  {
    slug: "soundcheck",
    reply:
      "The first take lost 14 dB between the front and back rows. After the adjustment the gap was 3 dB. You can switch between the readings below.",
    mechanism:
      "Each Tab and its TabPanel share an item value. The active panel contains a BarChart whose rows are also available as a data table.",
    title: "Soundcheck notebook",
    group: "In the studio",
    prompt:
      "The vocal disappears at the back. Front, desk, and back measured 82, 76, and 68 dB on the first take, then 79, 78, and 76 dB after adjustment. Let me compare the two takes.",
    tryIt: "Switch between the two takes to compare the measured vocal level at three positions.",
    source: `<Tabs defaultValue="first">
  <TabList label="Soundcheck take">
    <Tab value="first">First take</Tab>
    <Tab value="second">After adjustment</Tab>
  </TabList>
  <TabPanel value="first">
    <BarChart title="First take: vocal level" categoryLabel="Position" valueLabel="Level" unit=" dB"
      data={[{"label":"Front","value":82},{"label":"Desk","value":76},{"label":"Back","value":68}]} />
    <Text>The back row measured 14 dB below the front.</Text>
  </TabPanel>
  <TabPanel value="second">
    <BarChart title="Second take: vocal level" categoryLabel="Position" valueLabel="Level" unit=" dB"
      data={[{"label":"Front","value":79},{"label":"Desk","value":78},{"label":"Back","value":76}]} />
    <Text>The spread fell to 3 dB. Keep this speaker angle for doors.</Text>
  </TabPanel>
</Tabs>`,
  },
  {
    slug: "encore",
    reply: "Here’s the opening set. There’s room for a stage note while the band picks an encore.",
    mechanism:
      "The follow-up updates the card by ID and appends a song to the list. Both views share a root, so the original text field stays mounted.",
    title: "The encore revision",
    group: "In the studio",
    prompt: "Draft a short set list. I’ll add the encore after the band decides.",
    tryIt:
      "Write a stage note, then apply the band’s follow-up. The revised set list keeps your note.",
    source: `<Card id="set" title="Opening set">
  <List id="songs" ordered={true}>
    <Item>Side Street · 3:40</Item>
    <Item>Window Seat · 4:10</Item>
    <Item>Paper Moon · 3:30</Item>
  </List>
  <TextField label="Stage note" placeholder="Where should the spare guitar go?" />
</Card>`,
    followUp: {
      prompt: "The band picked Borrowed Light. Add it as the encore.",
      reply: "Borrowed Light now closes the set. I’ve kept your stage note in place.",
      source: `<Update id="set" title="Opening set + encore" />
<Append to="songs"><Item>Borrowed Light · 2:50 (encore)</Item></Append>`,
    },
  },
  {
    slug: "night-train",
    reply:
      "The last Harbour train leaves for East Quay at 23:12 in this sample timetable. Choose another line to check its last three trains.",
    mechanism:
      "Departures is a registered server component. Selecting a line changes its prop and asks the server to render that component with the new timetable.",
    title: "Last train board",
    group: "In the field",
    prompt: "Put the last three departures on a board I can switch between lines.",
    tryIt:
      "Choose a line. Only its departures refresh from the server. Times come from a fictional station timetable.",
    source: `<Stack gap="lg">
  <Select label="Rail line" bind="line">
    <Option value="Harbour">Harbour</Option>
    <Option value="Forest">Forest</Option>
    <Option value="Quarry">Quarry</Option>
  </Select>
  <Departures line={line} />
</Stack>`,
  },
  {
    slug: "backpack",
    reply:
      "With the camera kit packed, your bag weighs 5.6 kg. Try the other extras to see what fits in the remaining 1.4 kg.",
    mechanism:
      "Each checkbox writes a boolean to the shared state. The meter and remaining allowance read those values in arithmetic expressions.",
    title: "One-bag packing list",
    group: "In the field",
    prompt: "My bag and essentials weigh 4.2 kg. Which extras fit under a 7 kg allowance?",
    tryIt:
      "Tick the gear you want to carry. The allowance meter and remaining weight follow your choices.",
    source: `<Stack>
  <Checkbox label="Camera kit · 1.4 kg" bind="camera" />
  <Checkbox label="Field recorder · 0.6 kg" bind="recorder" />
  <Checkbox label="Tripod · 1.2 kg" bind="tripod" />
  <Meter label="Packed weight (kg)" min={0} max={7.4} high={7} optimum={4.2} value={4.2 + (camera ? 1.4 : 0) + (recorder ? 0.6 : 0) + (tripod ? 1.2 : 0)} />
  <Text>{abs(round(2.8 - (camera ? 1.4 : 0) - (recorder ? 0.6 : 0) - (tripod ? 1.2 : 0), 1))} {camera && recorder && tripod ? "kg over the 7 kg allowance." : "kg remaining of the 7 kg allowance."}</Text>
</Stack>`,
  },
  {
    slug: "pour-over",
    reply:
      "For 20 g of coffee at 1:16, use 320 g of water. I’ve put the running scale reading beside each pour so you can change the recipe as you go.",
    mechanism:
      "The sliders write numbers to shared state. Expressions in the output and individual list items calculate all three pours locally.",
    title: "Pour-over recipe",
    group: "In the field",
    prompt: "Scale my coffee recipe to the beans I have, and split the water into three pours.",
    tryIt:
      "Weigh out the beans and choose a water-to-coffee ratio. The recipe gives cumulative scale readings for each pour.",
    source: `<Stack gap="lg">
  <Slider label="Coffee (g)" bind="beans" min={10} max={40} />
  <Slider label="Water per gram of coffee" bind="ratio" min={14} max={18} />
  <Output label="Total water" value={beans * ratio} unit=" g" />
  <List ordered={true}>
    <Item>Bloom to {beans * 3} g and wait 30 seconds.</Item>
    <Item>Pour slowly to {round(beans * ratio * 0.6)} g on the scale.</Item>
    <Item>Finish at {beans * ratio} g and let the filter drain.</Item>
  </List>
</Stack>`,
  },
  {
    slug: "field-notes",
    reply:
      "The two cards record counts at different times and places. Here’s a short report with each count linked to its observer’s note.",
    mechanism:
      "CitedText connects numbered markers in the report to its source records. CopyButton places the supplied plain-text summary on the clipboard.",
    title: "Bird blind field notes",
    group: "In the field",
    prompt:
      "My first card says “East spit, 06:20, 18 terns resting together.” The second says “Harbour posts, 08:10, six terns on separate posts.” Turn them into a short report I can check and copy.",
    tryIt: "Inspect the citations for the morning count, then copy the report for the logbook.",
    source: `<Stack>
  <CitedText text="At first light, 18 terns rested on the east spit.[1] A separate count at 08:10 found six on the harbour posts.[2]"
    sources={[{"title":"East spit · 06:20","note":"Observer card A: 18 terns resting together."},{"title":"Harbour posts · 08:10","note":"Observer card B: six terns counted on separate posts."}]} />
  <CopyButton label="Copy observation report" value="East spit, 06:20: 18 resting terns. Harbour posts, 08:10: six terns on posts." />
</Stack>`,
  },
  {
    slug: "museum-label",
    reply:
      "I’ve put the recorder’s provenance on the label and the disputed pencil mark in a separate conservator’s note.",
    mechanism:
      "The host defines two named holes, each with its own allowed components and child limit. One model response fills both panels.",
    title: "Museum object label",
    group: "Behind the scenes",
    prompt:
      "Fill the two panels beside our field recorder with an object label and a conservator’s note.",
    tryIt:
      "Watch the object label arrive, then open the conservator’s note. A single recorded stream fills two panels in the museum’s layout.",
    source: `<label><Heading level={3}>Pocket field recorder</Heading><Text>Loan 024 · Sound archive</Text><Text>A palm-sized tape recorder carried on the ferry to document its last winter crossing.</Text></label>
<notes><Disclosure summary="Inspect the handwritten tape log"><Text>The pencil mark at 00:18 reads “ramp down”. A second hand crossed it out and wrote “mooring ring”. Both entries remain on the sleeve.</Text></Disclosure></notes>`,
  },
  {
    slug: "repair-desk",
    reply: "Look up one job at a time. Try R-104 for the cassette deck or R-117 for the turntable.",
    mechanism:
      "Submitting the form calls repairStatus with the ticket field. The host validates the argument, then GenUI stores the returned text under result.",
    title: "Repair ticket lookup",
    group: "Behind the scenes",
    prompt: "Give the repair counter a way to look up a job without exposing the whole job book.",
    tryIt:
      "Look up ticket R-104 or R-117 in the sample job book. Try an unknown ticket to see the response.",
    source: `<Stack>
  <Form name="repair" label="Find a repair" submitLabel="Look up ticket" action={[{"call":"repairStatus","into":"result"}]}>
    <TextField label="Ticket number" name="ticket" required={true} placeholder="R-104" />
  </Form>
  <Text>{result}</Text>
</Stack>`,
  },
  {
    slug: "record-crates",
    reply:
      "The ambient crate has two titles on the shelf. Flip to Dub or Disco to see the pressings and copy counts in that crate.",
    mechanism:
      "The JSON Query reads the bound crate name and stores the inventory response under records. The table binds its rows to that same name.",
    title: "Record shop crates",
    group: "Behind the scenes",
    prompt:
      "Let me flip between the shop’s sample crates and see which pressings are on the shelf.",
    tryIt:
      "Choose another crate. A JSON Query asks the inventory tool for its rows and updates the table.",
    format: "json",
    source: json({
      type: "Stack",
      children: [
        {
          type: "Select",
          name: "crate",
          label: "Record crate",
          options: ["Ambient", "Dub", "Disco"],
          value: { $bind: "crate", initial: "Ambient" },
        },
        {
          type: "Query",
          tool: "crateInventory",
          args: { crate: { $bind: "crate" } },
          into: "records",
        },
        {
          type: "Table",
          caption: "Pressings on the shelf",
          columns: ["Record", "Format", "Copies"],
          rows: { $bind: "records" },
        },
      ],
    }),
  },
  {
    slug: "screening-ballot",
    reply:
      "Here’s a ballot for the three shorts. Pick a film and add a line for the programme, then send it to see what the host receives.",
    mechanism:
      "The browser renderer calls onAction with a readable message and the form values. The receipt displays the payload from that callback.",
    title: "Midnight screening ballot",
    group: "Behind the scenes",
    prompt: "Help the audience pick our midnight short film and tell me what the host receives.",
    tryIt:
      "Choose a film and send the ballot. The preview shows the message and field values delivered to the host.",
    format: "json",
    source: json({
      type: "Form",
      name: "screening",
      title: "Screening ballot",
      submitLabel: "Send ballot",
      children: [
        {
          type: "RadioGroup",
          name: "film",
          label: "Short film",
          options: ["After the Ferry", "Relay Station", "Paper City"],
          value: "Relay Station",
        },
        {
          type: "TextField",
          name: "reason",
          label: "Why this film?",
          placeholder: "One line for the programme",
        },
      ],
    }),
  },
];
