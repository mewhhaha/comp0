import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@comp0/react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <NavigationMenu
      aria-label="Main"
      className="relative w-full max-w-md rounded border border-zinc-950/10 p-1 dark:border-white/10"
    >
      <NavigationMenuList className="flex items-center gap-1">
        <NavigationMenuItem value="products">
          <NavigationMenuTrigger className="group flex items-center gap-1 rounded px-3 py-2.5 text-base text-zinc-800 select-none hover:bg-zinc-100 data-open:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-open:bg-zinc-800">
            Products
            <ChevronDownIcon
              className="size-4 text-zinc-400 transition-transform duration-150 ease-out group-data-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </NavigationMenuTrigger>
          <NavigationMenuContent className="absolute inset-x-1 top-full z-10 mt-1 grid gap-1 rounded border-0 bg-white p-1 opacity-100 shadow-lg ring-1 ring-zinc-950/10 transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
            <NavigationMenuLink
              href="#analytics"
              className="rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Analytics
            </NavigationMenuLink>
            <NavigationMenuLink
              href="#dashboards"
              className="rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Dashboards
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="resources">
          <NavigationMenuTrigger className="group flex items-center gap-1 rounded px-3 py-2.5 text-base text-zinc-800 select-none hover:bg-zinc-100 data-open:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800 dark:data-open:bg-zinc-800">
            Resources
            <ChevronDownIcon
              className="size-4 text-zinc-400 transition-transform duration-150 ease-out group-data-open:rotate-180 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </NavigationMenuTrigger>
          <NavigationMenuContent className="absolute inset-x-1 top-full z-10 mt-1 grid gap-1 rounded border-0 bg-white p-1 opacity-100 shadow-lg ring-1 ring-zinc-950/10 transition-opacity duration-150 ease-out starting:opacity-0 motion-reduce:transition-none dark:bg-zinc-900 dark:shadow-none dark:ring-white/10">
            <NavigationMenuLink
              href="#docs"
              className="rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Documentation
            </NavigationMenuLink>
            <NavigationMenuLink
              href="#guides"
              className="rounded px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              Guides
            </NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem value="pricing">
          <NavigationMenuLink
            href="#pricing"
            className="block rounded px-3 py-2.5 text-base text-zinc-800 select-none hover:bg-zinc-100 sm:py-2 sm:text-sm dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Pricing
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
