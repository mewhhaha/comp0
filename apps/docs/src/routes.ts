import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/_index/route.tsx"),
  route("learn/:slug", "routes/learn/route.tsx"),
  route("genui/:slug", "routes/genui/route.tsx"),
  route("labs/genui-rsc", "routes/labs/genui-rsc/route.tsx"),
  route("components", "routes/components-index/route.tsx"),
  route("components/:slug", "routes/components/route.tsx"),
] satisfies RouteConfig;
