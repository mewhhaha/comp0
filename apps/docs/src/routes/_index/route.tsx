import { ComponentDirectory } from "./ComponentDirectory.js";
import { HomeHero } from "./HomeHero.js";
import { KeyboardPreview } from "./KeyboardPreview.js";
import { LearningPath } from "./LearningPath.js";

export function meta() {
  return [
    { title: "comp0 · Headless React, explained slowly" },
    {
      name: "description",
      content:
        "Learn headless React through visual anatomy maps, real examples, and exact keyboard guides.",
    },
  ];
}

export default function IndexRoute() {
  return (
    <div>
      <HomeHero className="px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24" />
      <div className="border-t border-zinc-950/10 dark:border-white/10">
        <LearningPath className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10" />
      </div>
      <KeyboardPreview className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-10" />
      <div className="border-t border-zinc-950/10 dark:border-white/10">
        <ComponentDirectory className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-10" />
      </div>
    </div>
  );
}
