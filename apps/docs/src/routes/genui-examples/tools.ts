import { handleToolRequest } from "@comp0/genui/rsc";
import { tools } from "./shop-tools.js";

export function action({ request }: { request: Request }) {
  return handleToolRequest(tools, request);
}
