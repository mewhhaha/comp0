import { useSyncExternalStore } from "react";
import { childPointer, maxJsonDepth, type JsonValue, type PartialParse } from "../json/parse.js";
import { GenUI, type GenUIProps } from "../render/GenUI.js";
import { type McpAppBridge } from "./bridge.js";

/** The arguments of the tool call the app was opened for, read as a GenUI response. */
export type McpAppResponse = {
  /**
   * What to give GenUI's `response`: the tool's arguments, which are the response itself when the
   * tool takes a response tree. Until they are final they come as a `PartialParse` that marks
   * the part the model may still be writing as open.
   */
  response: PartialParse | Readonly<Record<string, unknown>> | undefined;
  /** The arguments are still arriving: the host has not sent them complete or cancelled. */
  streaming: boolean;
  /** The host cancelled the tool call. `response` keeps whatever arrived before. */
  cancelled: boolean;
};

/**
 * Arguments that may still grow, as a parse whose open paths GenUI respects. The host closes the
 * cut document itself, so only the last member at each level, all the way down, can still be
 * growing; everything before it is finished. URLs, binding names, and expressions on that path
 * then wait for the rest, as they do when GenUI parses streamed text itself.
 */
function partialResponse(args: Readonly<Record<string, unknown>>): PartialParse {
  const open = new Set<string>();
  let path = "";
  let value: unknown = args;
  // Bounded like the parser, since a structured clone may even be cyclic.
  for (let depth = 0; depth <= maxJsonDepth; depth += 1) {
    open.add(path);
    if (typeof value !== "object" || value === null) break;
    let last: string | number | undefined;
    if (Array.isArray(value)) last = value.length > 0 ? value.length - 1 : undefined;
    else last = Object.keys(value).at(-1);
    if (last === undefined) break;
    path = childPointer(path, last);
    value = (value as Record<string | number, unknown>)[last];
  }
  return { value: args as JsonValue, complete: false, open, issues: [] };
}

/** Reads the tool arguments the host streams into the app, re-rendering as more arrive. */
export function useMcpAppResponse(bridge: McpAppBridge): McpAppResponse {
  const input = useSyncExternalStore(bridge.onToolInput, bridge.getToolInput, bridge.getToolInput);
  let response: McpAppResponse["response"] = input.arguments;
  if (input.arguments !== undefined && !input.final) response = partialResponse(input.arguments);
  return { response, streaming: !input.final && !input.cancelled, cancelled: input.cancelled };
}

export type McpAppGenUIProps = Omit<GenUIProps, "response" | "streaming"> & {
  /** The connection to the host, from `createMcpAppBridge`. */
  bridge: McpAppBridge;
};

/**
 * Renders the response a model writes as the arguments of the tool call the app was opened for.
 * Tools the response calls go to the MCP server through the host, actions become the person's
 * next message, and every edit replaces the model's context with the stored values. Any prop
 * passed here replaces the bridge's default for it.
 */
export function McpAppGenUI({ bridge, ...props }: McpAppGenUIProps) {
  const { response, streaming, cancelled } = useMcpAppResponse(bridge);
  // A cancelled call never finished, so its half-written interface is withdrawn rather than left
  // to act on arguments the model did not complete.
  const shown = cancelled ? undefined : response;
  return (
    <GenUI
      response={shown}
      streaming={streaming}
      call={bridge.call}
      onAction={(action) => void bridge.sendMessage(action.message)}
      onStateChange={(state) => void bridge.updateModelContext({ structuredContent: state })}
      {...props}
    />
  );
}
