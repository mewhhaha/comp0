import { handleToolRequest } from "@comp0/genui/rsc";
import { labTools } from "./lab-tools.js";

/** The lab's tool endpoint: POST `{ name, args }`, answered by `runTool`. */
export async function action({ request }: { request: Request }) {
  return handleToolRequest(labTools, request);
}
