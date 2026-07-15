import {
  ListBox,
  Tag,
  TagList,
  TagPicker,
  TagPickerInput,
  TagPickerOption,
  TextField,
} from "@comp0/react";

const frameworks = ["React", "Vue", "Svelte", "Solid"];

export function Example() {
  return (
    <TagPicker name="framework" defaultValue={["React"]} className="grid w-full max-w-sm gap-3">
      {({ remove, value }) => (
        <>
          <TagList aria-label="Selected frameworks" className="flex flex-wrap gap-2">
            {value.map((framework) => (
              <Tag
                key={framework}
                value={framework}
                className="flex items-center gap-1 rounded-full bg-teal-100 py-1 pl-3 pr-1 text-sm text-teal-950 data-focused:outline-2 data-focused:outline-teal-600 dark:bg-teal-950 dark:text-teal-50 dark:data-focused:outline-teal-400"
              >
                {framework}
                <button
                  type="button"
                  aria-label={`Remove ${framework}`}
                  className="grid size-5 place-items-center rounded-full text-teal-800 hover:bg-teal-200 focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-teal-100 dark:hover:bg-teal-900 dark:focus-visible:outline-teal-400"
                  onClick={() => remove(framework)}
                >
                  ×
                </button>
              </Tag>
            ))}
          </TagList>
          <TextField>
            <TagPickerInput
              aria-label="Add a framework"
              placeholder="Find a framework"
              className="w-full rounded border border-zinc-950/15 bg-transparent px-3 py-2 text-sm outline-teal-600 focus-visible:outline-2 dark:border-white/15 dark:outline-teal-400"
            />
          </TextField>
          <ListBox
            aria-label="Frameworks"
            className="rounded border border-zinc-950/10 p-1 dark:border-white/10"
          >
            {frameworks.map((framework) => (
              <TagPickerOption
                key={framework}
                value={framework}
                className="block cursor-pointer rounded px-3 py-2 text-sm data-active:bg-teal-50 data-focused:outline-2 data-focused:outline-teal-600 dark:data-active:bg-teal-950 dark:data-focused:outline-teal-400"
              >
                {framework}
              </TagPickerOption>
            ))}
          </ListBox>
        </>
      )}
    </TagPicker>
  );
}
