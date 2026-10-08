/** The arrow-key directions supported by a roving-focus collection. */
export type RovingFocusOrientation = "horizontal" | "vertical" | "both";

/** The identity and enabled state needed for roving focus navigation. */
export type RovingFocusItem = {
  key: string;
  disabled?: boolean | undefined;
};

function isForwardKey(key: string, orientation: RovingFocusOrientation, dir: "ltr" | "rtl") {
  if (orientation !== "vertical" && key === "ArrowRight") return dir === "ltr";
  if (orientation !== "vertical" && key === "ArrowLeft") return dir === "rtl";
  if (orientation !== "horizontal" && key === "ArrowDown") return true;
  return false;
}

function isBackwardKey(key: string, orientation: RovingFocusOrientation, dir: "ltr" | "rtl") {
  if (orientation !== "vertical" && key === "ArrowLeft") return dir === "ltr";
  if (orientation !== "vertical" && key === "ArrowRight") return dir === "rtl";
  if (orientation !== "horizontal" && key === "ArrowUp") return true;
  return false;
}

/** Resolves the next enabled item for an APG-style roving-focus key press. */
export function getRovingFocusTarget(
  items: readonly RovingFocusItem[],
  currentKey: string | undefined,
  key: string,
  options: {
    orientation?: RovingFocusOrientation | undefined;
    dir?: "ltr" | "rtl" | undefined;
    loop?: boolean | undefined;
  } = {},
) {
  const orientation = options.orientation ?? "both";
  const dir = options.dir ?? "ltr";
  const enabledItems = items.filter((item) => !item.disabled);
  if (!enabledItems.length) return undefined;

  if (key === "Home") return enabledItems[0]?.key;
  if (key === "End") return enabledItems.at(-1)?.key;

  let direction = 0;
  if (isForwardKey(key, orientation, dir)) direction = 1;
  else if (isBackwardKey(key, orientation, dir)) direction = -1;
  if (direction === 0) return undefined;

  const currentIndex = enabledItems.findIndex((item) => item.key === currentKey);
  if (currentIndex === -1) {
    return direction > 0 ? enabledItems[0]?.key : enabledItems.at(-1)?.key;
  }
  const nextIndex = currentIndex + direction;

  if (nextIndex >= 0 && nextIndex < enabledItems.length) return enabledItems[nextIndex]?.key;
  if (!options.loop) return enabledItems[currentIndex]?.key;
  return direction > 0 ? enabledItems[0]?.key : enabledItems.at(-1)?.key;
}
