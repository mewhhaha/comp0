import { BreadcrumbLink, Breadcrumbs } from "@comp0/react";

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
      <span aria-hidden="true">/</span>
      <BreadcrumbLink
        href="#docs"
        className="underline"
        onClick={(event) => event.preventDefault()}
      >
        Docs
      </BreadcrumbLink>
      <span aria-hidden="true">/</span>
      <span aria-current="page">Components</span>
    </Breadcrumbs>
  );
}
