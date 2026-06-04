import { useId } from "react";
import { MenubarMenuContext } from "./menubar-shared.js";
import { type MenubarMenuProps } from "./menubar-shared.js";
export type { MenubarMenuProps } from "./menubar-shared.js";

export function MenubarMenu({ id, children }: MenubarMenuProps) {
  const generatedId = useId();
  const baseId = id || generatedId;

  return (
    <MenubarMenuContext.Provider
      value={{ id: baseId, triggerId: `${baseId}-trigger`, contentId: `${baseId}-menu` }}
    >
      {children}
    </MenubarMenuContext.Provider>
  );
}
