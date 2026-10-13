/** Recorded JSX responses; replayed directly without a format adapter. */
export const dashboard = `<Stack>
  <Heading level={2}>Weekly product pulse</Heading>
  <Grid columns={3}>
    <Card title="Uptime"><Meter label="Availability this week" value={99.9} min={95} max={100} /></Card>
    <Card title="Support backlog"><ProgressBar label="Tickets cleared" value={72} /></Card>
    <Card title="Satisfaction"><Meter label="Net promoter score" value={46} min={0} max={100} /></Card>
  </Grid>
  <LineChart title="Daily active users" data={[{"x":1,"y":1180},{"x":2,"y":1240},{"x":3,"y":1275},{"x":4,"y":1310},{"x":5,"y":1290},{"x":6,"y":940},{"x":7,"y":1020}]} description="Usage dipped on the weekend and recovered by Sunday evening." xLabel="Day of the week" yLabel="Active users" />
  <BarChart title="Tickets by area" data={[{"label":"Billing","value":14},{"label":"Sign-in","value":9},{"label":"Exports","value":6},{"label":"Other","value":4}]} description="Billing causes the most tickets, so start there." categoryLabel="Area" valueLabel="Tickets" />
</Stack>`;

export const explainer = `<Stack>
  <Text>OAuth lets an app act for you without ever seeing your password.</Text>
  <List ordered={true}>
    <Item>The app sends you to the provider to sign in.</Item>
    <Item>You approve exactly what the app may do.</Item>
    <Item>The provider hands the app a short-lived token.</Item>
    <Item>The app calls the API with that token.</Item>
  </List>
  <Accordion>
    <Section value="scope" title="What is a scope?"><Text>A scope names one permission, such as reading your calendar.</Text></Section>
    <Section value="revoke" title="What if I change my mind?"><Text>Revoke the app in the provider settings and its token stops working.</Text></Section>
  </Accordion>
  <Link href="https://oauth.net/2/">Read the OAuth 2.0 overview</Link>
</Stack>`;
