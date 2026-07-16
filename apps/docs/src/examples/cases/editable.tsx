import { Editable, EditableInput, EditableView } from "@comp0/react";
import { PencilIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <Editable as="div" className="w-full max-w-xs" defaultValue="Untitled document">
      <EditableView className="group flex w-full items-center gap-2 rounded px-3 py-2.5 text-left text-base font-medium text-zinc-900 outline-teal-600 hover:bg-zinc-100 focus-visible:outline-2 data-empty:font-normal data-empty:text-zinc-400 sm:py-2 sm:text-sm dark:text-zinc-100 dark:outline-teal-400 dark:hover:bg-zinc-800">
        {({ value }) => (
          <>
            <span className="truncate">{value || "Untitled document"}</span>
            <PencilIcon
              className="size-4 shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
              aria-hidden="true"
            />
          </>
        )}
      </EditableView>
      <EditableInput
        aria-label="Document title"
        name="title"
        className="w-full rounded border border-zinc-950/10 bg-white px-3 py-2.5 text-base font-medium text-zinc-950 outline-teal-600 focus-visible:outline-2 sm:py-2 sm:text-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-50 dark:outline-teal-400"
      />
    </Editable>
  );
}
