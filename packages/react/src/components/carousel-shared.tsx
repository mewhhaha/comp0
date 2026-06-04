import { createContext, type ButtonHTMLAttributes, type HTMLAttributes } from "react";

export interface CarouselSlideRecord {
  key: string;
  element: HTMLElement | null;
  disabled?: boolean | undefined;
}

export interface CarouselContextValue {
  selectedKey: string;
  rotating: boolean;
  setRotating: (rotating: boolean) => void;
  select: (key: string) => void;
  previous: () => void;
  next: () => void;
  registerSlide: (key: string, element: HTMLElement | null, disabled?: boolean) => void;
  slides: () => CarouselSlideRecord[];
}

export const CarouselContext = createContext<CarouselContextValue | null>(null);

export type CarouselProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue" | "onChange"> & {
  value?: string | undefined;
  defaultValue?: string | undefined;
  onChange?: ((value: string) => void) | undefined;
  autoRotate?: boolean | undefined;
  interval?: number | undefined;
};

export type CarouselViewportProps = HTMLAttributes<HTMLDivElement>;

export type CarouselSlideProps = HTMLAttributes<HTMLDivElement> & {
  id: string;
};

export type CarouselControlProps = ButtonHTMLAttributes<HTMLButtonElement>;

export type CarouselIndicatorGroupProps = HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical" | undefined;
};

export type CarouselIndicatorProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "id"> & {
  id: string;
};

export function sortSlides(slides: CarouselSlideRecord[]) {
  return [...slides].sort((a, b) => {
    if (!a.element || !b.element || a.element === b.element) return 0;
    if (a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING) {
      return 1;
    }
    return -1;
  });
}
