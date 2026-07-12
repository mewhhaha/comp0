import { useState } from "react";
import { Link } from "@comp0/react";

export function Example() {
  const [followed, setFollowed] = useState(false);

  return (
    <p className="text-base text-zinc-700 sm:text-sm dark:text-zinc-300">
      <Link
        href="#link-example"
        className="text-teal-700 underline underline-offset-4 dark:text-teal-300"
        onClick={(event) => {
          event.preventDefault();
          setFollowed(true);
        }}
      >
        {followed ? "Thanks for following" : "Read the guide"}
      </Link>
    </p>
  );
}
