import { defineTool } from "@comp0/genui/rsc";
import { type } from "arktype";

/** The lab's host API: what the model's interface may call, with a schema for each input. */
const subscribeInput = type({ email: "string.email" }).describe("Who to tell about releases.");

export const labTools = {
  subscribe: defineTool({
    description: "Signs an email address up for release updates and confirms in one sentence.",
    input: subscribeInput,
    run: async ({ email }) => `Subscribed ${email} to release updates.`,
  }),
};
