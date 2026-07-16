import { Avatar, AvatarFallback, AvatarImage } from "@comp0/react";

const portrait =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%230f766e'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%23f4f4f5'/%3E%3Cpath d='M6 40a14 12 0 0 1 28 0z' fill='%23f4f4f5'/%3E%3C/svg%3E";

export function Example() {
  return (
    <div className="flex items-center gap-4">
      <Avatar className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <AvatarImage
          src={portrait}
          alt="Illustrated portrait of Ada Lovelace"
          className="size-full object-cover"
        />
        <AvatarFallback className="text-base font-medium text-zinc-600 sm:text-sm dark:text-zinc-300">
          AL
        </AvatarFallback>
      </Avatar>
      <Avatar className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <AvatarImage src="data:," alt="Ada Kaplan" className="size-full object-cover" />
        <AvatarFallback className="text-base font-medium text-zinc-600 sm:text-sm dark:text-zinc-300">
          AK
        </AvatarFallback>
      </Avatar>
    </div>
  );
}
