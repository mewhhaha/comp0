import { BreadcrumbLink, Breadcrumbs } from "@comp0/react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <Breadcrumbs className="flex flex-wrap gap-2 text-base text-zinc-600 sm:text-sm dark:text-zinc-400">
      <BreadcrumbLink
        href="#home"
        className="underline"
        onClick={(event) => event.preventDefault()}
      >
        Home
      </BreadcrumbLink>
      <ChevronRightIcon
        className="size-4 self-center text-zinc-400 dark:text-zinc-500"
        aria-hidden="true"
      />
      <BreadcrumbLink
        href="#docs"
        className="underline"
        onClick={(event) => event.preventDefault()}
      >
        Docs
      </BreadcrumbLink>
      <ChevronRightIcon
        className="size-4 self-center text-zinc-400 dark:text-zinc-500"
        aria-hidden="true"
      />
      <span aria-current="page">Components</span>
    </Breadcrumbs>
  );
}
