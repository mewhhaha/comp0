import { useState } from "react";
import { Rating, RatingItem } from "@comp0/react";

export function Example() {
  const [stars, setStars] = useState(3);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-base font-medium text-zinc-900 sm:text-sm dark:text-zinc-100">
        Rate your stay
      </span>
      <Rating className="flex w-fit" name="stay" value={stars} onChange={setStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <RatingItem
            key={star}
            value={star}
            inputProps={{ "aria-label": `${star} of 5 stars` }}
            className="cursor-pointer rounded px-0.5 text-2xl text-zinc-300 ring-teal-600 transition-colors duration-100 ease-out data-active:text-amber-500 data-focus-visible:ring-2 motion-reduce:transition-none sm:text-xl dark:text-zinc-700 dark:ring-teal-400 dark:data-active:text-amber-400"
          >
            <span aria-hidden="true">★</span>
          </RatingItem>
        ))}
      </Rating>
      <p className="text-base text-zinc-600 sm:text-sm dark:text-zinc-400">{stars} of 5 stars</p>
    </div>
  );
}
