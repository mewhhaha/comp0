"use client";

import type { ComponentType } from "react";

const modules = import.meta.glob<{ Example: ComponentType }>("./cases/*.tsx", { eager: true });

const slugOf = (path: string) => path.replace("./cases/", "").replace(".tsx", "");

export const exampleRegistry: Record<string, ComponentType> = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => [slugOf(path), module.Example]),
);

export function getExample(slug: string): ComponentType | undefined {
  return exampleRegistry[slug];
}
