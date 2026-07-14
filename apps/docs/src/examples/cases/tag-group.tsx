import { useState } from "react";
import { Button, Label, Tag, TagGroup, TagList } from "@comp0/react";
import { XMarkIcon } from "@heroicons/react/16/solid";

export function Example() {
  const [tags, setTags] = useState(["news", "sports", "arts", "travel"]);
  const [selected, setSelected] = useState<string[]>(["news"]);
  const remove = (value: string) => {
    setTags((current) => current.filter((entry) => entry !== value));
    setSelected((current) => current.filter((entry) => entry !== value));
  };

  return (
    <TagGroup value={selected} onChange={setSelected} onRemove={remove}>
      <Label>Topics</Label>
      <TagList className="flex max-w-sm flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag}
            value={tag}
            className="group cursor-pointer rounded-full bg-zinc-100 outline-teal-600 focus-visible:outline-2 data-selected:bg-teal-100 dark:bg-zinc-800 dark:outline-teal-400 dark:data-selected:bg-teal-950 [&>[role=gridcell]]:flex [&>[role=gridcell]]:items-center [&>[role=gridcell]]:gap-1.5 [&>[role=gridcell]]:px-3 [&>[role=gridcell]]:py-1.5"
          >
            <span className="text-base capitalize sm:text-sm">{tag}</span>
            <Button
              aria-label={`Remove ${tag}`}
              className="rounded-full p-0.5 text-zinc-500 hover:bg-zinc-950/10 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-100"
              onClick={() => remove(tag)}
            >
              <XMarkIcon className="size-3.5" aria-hidden="true" />
            </Button>
          </Tag>
        ))}
      </TagList>
    </TagGroup>
  );
}
