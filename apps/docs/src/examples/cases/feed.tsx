import { Feed, FeedArticle } from "@comp0/react";

const stories = [
  {
    id: "feed-story-soup",
    title: "Roasted tomato soup",
    teaser: "A weeknight classic, deepened with slow-roasted garlic.",
  },
  {
    id: "feed-story-salad",
    title: "Charred corn salad",
    teaser: "Sweet corn, lime, and a little heat from pickled jalapeño.",
  },
  {
    id: "feed-story-stew",
    title: "Smoky bean stew",
    teaser: "Pantry beans simmered with smoked paprika and greens.",
  },
];

export function Example() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <button
        type="button"
        className="self-start rounded px-3 py-2.5 text-base text-teal-700 hover:bg-teal-50 sm:py-2 sm:text-sm dark:text-teal-300 dark:hover:bg-teal-950"
      >
        Refresh stories
      </button>
      <Feed aria-label="Recipe stories" total={12} className="flex flex-col gap-2">
        {stories.map((story) => (
          <FeedArticle
            key={story.id}
            aria-labelledby={story.id}
            className="rounded border border-zinc-950/10 p-3 outline-teal-600 focus-visible:outline-2 dark:border-white/10 dark:outline-teal-400"
          >
            <h3
              id={story.id}
              className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100"
            >
              {story.title}
            </h3>
            <p className="mt-1 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
              {story.teaser}
            </p>
          </FeedArticle>
        ))}
      </Feed>
      <button
        type="button"
        className="self-start rounded px-3 py-2.5 text-base text-teal-700 hover:bg-teal-50 sm:py-2 sm:text-sm dark:text-teal-300 dark:hover:bg-teal-950"
      >
        Load older stories
      </button>
    </div>
  );
}
