import { Fragment, type ReactNode, type ComponentProps } from "react";
import { warnOnce } from "../internal/dev.js";
import { ChartNavigationProvider } from "../chart/chart-navigation.js";
import { ChartValue } from "../chart/ChartValue.js";
import {
  type MapChartRegionGeometry,
  type MapChartValue,
  useChartKind,
} from "../chart/chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named map and individually named interactive regions. */

export type MapChartRegionState = {
  region: MapChartRegionGeometry;
  value: MapChartValue;
  index: number;
};

export type MapChartRegionProps = Omit<
  ComponentProps<"g">,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  region: MapChartRegionState;
  children: ReactNode;
};

export function MapChartRegion({ region, ref, ...props }: MapChartRegionProps) {
  const context = useChartKind("MapChartRegion", "MapChart", "map");
  const formattedValue = context.formatY(region.value.value);
  return (
    <ChartValue
      {...props}
      ref={ref}
      details={{
        kind: "map",
        index: region.index,
        label: `${context.regionLabel}: ${region.value.label}, ${context.valueLabel}: ${formattedValue}`,
        value: region.value,
        formattedValue,
      }}
      fallbackSlot="map-chart-region"
      data-label={region.value.label}
      data-region-id={region.value.id}
      data-value={region.value.value}
    />
  );
}

const fallbackViewBox = "0 0 100 100";

/** Returns `viewBox` when it holds x, y, and a positive width and height; otherwise a unit square. */
function validViewBox(viewBox: string) {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  const [, , width, height] = parts;
  if (parts.length === 4 && parts.every(Number.isFinite) && width! > 0 && height! > 0) {
    return viewBox;
  }
  warnOnce(
    `MapChartPlot:view-box:${viewBox}`,
    `MapChartPlot viewBox must contain x, y, width, and height with positive dimensions; received "${viewBox}". "${fallbackViewBox}" was used instead.`,
  );
  return fallbackViewBox;
}

function regionProblem(
  region: MapChartRegionGeometry,
  index: number,
  seen: ReadonlySet<string>,
  valuesById: ReadonlyMap<string, MapChartValue>,
) {
  if (!region.id.trim() || !region.d.trim()) {
    return {
      key: `empty:${index}`,
      message: `region at index ${index} must have a non-empty id and path.`,
    };
  }
  if (seen.has(region.id)) {
    return { key: `duplicate:${region.id}`, message: `region id "${region.id}" is duplicated.` };
  }
  if (!Number.isFinite(region.centerX) || !Number.isFinite(region.centerY)) {
    return {
      key: `center:${region.id}`,
      message: `region "${region.id}" must have finite center coordinates; received centerX=${region.centerX}, centerY=${region.centerY}.`,
    };
  }
  if (!valuesById.has(region.id)) {
    return {
      key: `no-value:${region.id}`,
      message: `region "${region.id}" has no matching MapChart value.`,
    };
  }
  return undefined;
}

export type MapChartPlotProps = Omit<
  ComponentProps<"svg">,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  viewBox: string;
  regions: readonly MapChartRegionGeometry[];
  children?: ((region: MapChartRegionState) => ReactNode) | undefined;
};

export function MapChartPlot({ children, regions, ref, viewBox, ...props }: MapChartPlotProps) {
  const context = useChartKind("MapChartPlot", "MapChart", "map");
  const safeViewBox = validViewBox(viewBox);
  const valuesById = new Map(context.values.map((value) => [value.id, value]));
  const regionIds = new Set<string>();
  const regionStates: MapChartRegionState[] = [];
  for (const [index, region] of regions.entries()) {
    const problem = regionProblem(region, index, regionIds, valuesById);
    if (problem) {
      warnOnce(`MapChartPlot:${problem.key}`, `MapChartPlot ${problem.message} It was skipped.`);
      continue;
    }
    regionIds.add(region.id);
    regionStates.push({ region, value: valuesById.get(region.id)!, index: regionStates.length });
  }
  for (const value of context.values) {
    if (!regionIds.has(value.id)) {
      warnOnce(
        `MapChartPlot:no-region:${value.id}`,
        `MapChart value "${value.id}" has no matching MapChartPlot region. It was not drawn.`,
      );
    }
  }
  const getTargetIndex = (currentIndex: number, key: string) => {
    const current = regionStates[currentIndex];
    if (!current || !key.startsWith("Arrow")) return undefined;
    const candidates = regionStates.filter((candidate) => {
      if (key === "ArrowLeft") return candidate.region.centerX < current.region.centerX;
      if (key === "ArrowRight") return candidate.region.centerX > current.region.centerX;
      if (key === "ArrowUp") return candidate.region.centerY < current.region.centerY;
      return candidate.region.centerY > current.region.centerY;
    });
    candidates.sort((first, second) => {
      const firstDistance = Math.hypot(
        first.region.centerX - current.region.centerX,
        first.region.centerY - current.region.centerY,
      );
      const secondDistance = Math.hypot(
        second.region.centerX - current.region.centerX,
        second.region.centerY - current.region.centerY,
      );
      return firstDistance - secondDistance;
    });
    return candidates[0]?.index ?? currentIndex;
  };

  return (
    <svg data-slot="map-chart-plot" {...props} ref={ref} viewBox={safeViewBox} role="group">
      <ChartNavigationProvider
        count={regionStates.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        <g role="presentation" data-slot="map-chart-regions">
          {regionStates.map((region) => {
            if (children)
              return (
                <Fragment key={`${region.value.id}-${region.index}`}>{children(region)}</Fragment>
              );
            return (
              <Fragment key={`${region.value.id}-${region.index}`}>
                <MapChartRegion region={region}>
                  <path d={region.region.d} fill="currentColor" />
                </MapChartRegion>
              </Fragment>
            );
          })}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
