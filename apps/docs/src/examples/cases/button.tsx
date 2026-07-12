import { useState } from "react";
import { Button } from "@comp0/react";

export function Example() {
  const [saved, setSaved] = useState(false);

  return (
    <Button
      className="rounded bg-teal-700 px-3 py-2.5 text-base text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 sm:py-2 sm:text-sm dark:bg-teal-400 dark:text-zinc-950"
      onClick={() => setSaved(true)}
    >
      {saved ? "Saved" : "Save changes"}
    </Button>
  );
}
