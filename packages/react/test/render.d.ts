import { type ReactElement } from "react";
export declare function render(element: ReactElement): {
  container: HTMLDivElement;
  rerender(next: ReactElement): void;
  unmount(): void;
};
export declare function cleanupRoots(): void;
export declare function fireClick(element: Element): void;
export declare function fireKeyDown(element: Element, key: string): void;
export declare function firePointerEnter(element: Element): void;
export declare function firePointerLeave(element: Element): void;
//# sourceMappingURL=render.d.ts.map
