import { redirect } from "react-router";
import { pages } from "../../docs-data.js";

export function clientLoader() {
  return redirect(`/components/${pages[0]!.slug}`);
}

export default function ComponentsIndexRoute() {
  return null;
}
