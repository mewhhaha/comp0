import {
  Carousel,
  CarouselAutoplayToggle,
  CarouselNext,
  CarouselPrevious,
  CarouselSlide,
  CarouselViewport,
} from "@comp0/react";
import { ChevronLeftIcon, ChevronRightIcon, PlayPauseIcon } from "@heroicons/react/16/solid";

export function Example() {
  return (
    <Carousel
      aria-label="Featured recipes"
      loop
      autoplay={5000}
      className="w-full max-w-sm rounded border border-zinc-950/10 p-3 dark:border-white/10"
    >
      <div className="mb-2 flex items-center gap-1">
        <CarouselAutoplayToggle className="rounded px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 data-stopped:text-teal-700 sm:py-2 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:data-stopped:text-teal-300">
          <PlayPauseIcon className="size-4" aria-hidden="true" />
        </CarouselAutoplayToggle>
        <CarouselPrevious className="ml-auto rounded px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 sm:py-2 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <ChevronLeftIcon className="size-4" aria-hidden="true" />
        </CarouselPrevious>
        <CarouselNext className="rounded px-3 py-2.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40 sm:py-2 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        </CarouselNext>
      </div>
      <CarouselViewport className="overflow-hidden rounded">
        <div
          className="flex transition-transform duration-300"
          style={{ transform: "translateX(calc(var(--comp0-carousel-index) * -100%))" }}
        >
          <CarouselSlide className="flex h-32 w-full shrink-0 items-center justify-center bg-teal-50 text-base font-medium text-teal-900 sm:text-sm dark:bg-teal-950 dark:text-teal-100">
            Roasted tomato soup
          </CarouselSlide>
          <CarouselSlide className="flex h-32 w-full shrink-0 items-center justify-center bg-zinc-100 text-base font-medium text-zinc-900 sm:text-sm dark:bg-zinc-800 dark:text-zinc-100">
            Charred corn salad
          </CarouselSlide>
          <CarouselSlide className="flex h-32 w-full shrink-0 items-center justify-center bg-teal-100 text-base font-medium text-teal-950 sm:text-sm dark:bg-teal-900 dark:text-teal-50">
            Smoky bean stew
          </CarouselSlide>
        </div>
      </CarouselViewport>
    </Carousel>
  );
}
