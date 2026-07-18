import {
  Label,
  ListBox,
  ListBoxItem,
  MentionField,
  MentionFieldInput,
  MentionFieldPopover,
} from "@comp0/react";

const teammates = [
  { name: "Aisha", role: "Design" },
  { name: "Diego", role: "Engineering" },
  { name: "Mina", role: "Research" },
  { name: "Ren", role: "Support" },
];

function startsWith(textValue: string, query: string) {
  return textValue.toLocaleLowerCase().startsWith(query.toLocaleLowerCase());
}

export function Example() {
  return (
    <MentionField
      as="div"
      className="flex w-full max-w-sm flex-col gap-1.5"
      defaultValue="Could @"
      filter={startsWith}
    >
      <Label className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Message
      </Label>
      <MentionFieldInput
        className="min-h-28 w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
        name="message"
        placeholder="Type @ to mention someone"
      />
      <MentionFieldPopover className="w-56 rounded border-0 bg-white shadow-lg ring-1 ring-zinc-950/10 dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
        <ListBox aria-label="Teammates" className="max-h-52 overflow-y-auto p-1 outline-none">
          {teammates.map((teammate) => (
            <ListBoxItem
              key={teammate.name}
              className="cursor-pointer rounded px-3 py-2 text-zinc-800 select-none data-active:bg-teal-100 data-active:text-teal-950 dark:text-zinc-100 dark:data-active:bg-teal-950 dark:data-active:text-teal-50"
              textValue={teammate.name}
              value={teammate.name}
            >
              <span className="block text-sm font-medium">@{teammate.name}</span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {teammate.role}
              </span>
            </ListBoxItem>
          ))}
        </ListBox>
      </MentionFieldPopover>
    </MentionField>
  );
}
