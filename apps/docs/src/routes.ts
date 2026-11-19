import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/_index/route.tsx"),
  route("learn/:slug", "routes/learn/route.tsx"),
  route("genui/examples/tools", "routes/genui-examples/tools.ts"),
  route("genui/examples/night-train/departures", "routes/genui-examples/departures.ts"),
  route("genui/examples/:example/reply", "routes/genui-examples/reply.ts"),
  route("genui/examples/:example", "routes/genui-examples/route.tsx"),
  route("genui/:slug", "routes/genui/route.tsx"),
  route("labs/genui-rsc", "routes/labs/genui-rsc/route.tsx"),
  route("labs/genui-rsc/tools", "routes/labs/genui-rsc/tools.ts"),
  route("labs/genui-rsc/components", "routes/labs/genui-rsc/components.ts"),
  route("labs/genui-rsc/compose", "routes/labs/genui-rsc/compose.tsx"),
  route("labs/genui-rsc/ask", "routes/labs/genui-rsc/ask.tsx"),
  route("labs/genui-edits", "routes/labs/genui-edits/route.tsx"),
  route("labs/genui-edits/turn", "routes/labs/genui-edits/turn.tsx"),
  route("components", "routes/components-index/route.tsx"),
  route("components/:slug", "routes/components/route.tsx"),
] satisfies RouteConfig;
