"use client";

import { lazy, type ComponentType } from "react";

const modules = import.meta.glob<{ Example: ComponentType }>("./cases/*.tsx");

const slugOf = (path: string) => path.replace("./cases/", "").replace(".tsx", "");

export const exampleRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(modules).map(([path, load]) => [
    slugOf(path),
    lazy(async () => ({ default: (await load()).Example })),
  ]),
);

export async function getExample(slug: string): Promise<ComponentType | undefined> {
  return (await modules[`./cases/${slug}.tsx`]?.())?.Example;
}
