import { useState } from "react";
import { DropZone, FileTrigger } from "@comp0/react";
import { ArrowUpTrayIcon } from "@heroicons/react/20/solid";

export function Example() {
  const [files, setFiles] = useState<string[]>([]);
  const updateFiles = (selected: File[]) => setFiles(selected.map((file) => file.name));

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <DropZone
        accept="image/png,image/jpeg"
        onDrop={updateFiles}
        className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-zinc-950/20 p-6 text-center transition-colors data-accept:border-teal-600 data-accept:bg-teal-50 data-reject:border-red-600 data-reject:bg-red-50 dark:border-white/20 dark:data-accept:border-teal-400 dark:data-accept:bg-teal-950/40 dark:data-reject:border-red-400 dark:data-reject:bg-red-950/40"
      >
        <ArrowUpTrayIcon className="size-6 text-zinc-500" aria-hidden="true" />
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Drop PNG or JPEG images here</p>
        <FileTrigger
          accept="image/png,image/jpeg"
          multiple
          className="cursor-pointer rounded bg-zinc-900 px-3 py-2 text-sm text-white has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-600 dark:bg-zinc-100 dark:text-zinc-950 dark:has-focus-visible:outline-teal-400"
          onChange={(event) => updateFiles([...(event.currentTarget.files ?? [])])}
        >
          Choose images
        </FileTrigger>
      </DropZone>
      <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
        {files.length ? files.join(", ") : "No images selected"}
      </p>
    </div>
  );
}
