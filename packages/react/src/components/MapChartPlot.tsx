import { Fragment, type ReactNode, type SVGAttributes } from "react";
import { dataSlot, type RefProp } from "../shared.js";
import { ChartNavigationProvider, ChartValue } from "./chart-interaction.js";
import {
  type MapChartRegionGeometry,
  type MapChartValue,
  useChartContext,
} from "./chart-shared.js";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- The SVG groups a named map and individually named interactive regions. */

export type MapChartRegionState = {
  region: MapChartRegionGeometry;
  value: MapChartValue;
  index: number;
};

export type MapChartPlotProps = Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "aria-label" | "role" | "viewBox"
> & {
  "aria-label": string;
  viewBox: string;
  regions: readonly MapChartRegionGeometry[];
  children?: ((region: MapChartRegionState) => ReactNode) | undefined;
};

export type MapChartRegionProps = Omit<
  SVGAttributes<SVGGElement>,
  "aria-label" | "children" | "role" | "tabIndex"
> & {
  region: MapChartRegionState;
  children: ReactNode;
};

export function MapChartRegion({
  region,
  ref,
  ...props
}: MapChartRegionProps & RefProp<SVGGElement>) {
  const context = useChartContext("MapChartRegion", "MapChart");
  if (context.kind !== "map") throw new Error("MapChartRegion must be rendered inside MapChart.");
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

export function MapChartPlot({
  children,
  regions,
  ref,
  viewBox,
  ...props
}: MapChartPlotProps & RefProp<SVGSVGElement>) {
  const context = useChartContext("MapChartPlot", "MapChart");
  if (context.kind !== "map") throw new Error("MapChartPlot must be rendered inside MapChart.");
  const viewBoxParts = viewBox.trim().split(/\s+/).map(Number);
  if (
    viewBoxParts.length !== 4 ||
    viewBoxParts.some((part) => !Number.isFinite(part)) ||
    viewBoxParts[2]! <= 0 ||
    viewBoxParts[3]! <= 0
  ) {
    throw new Error(
      `MapChartPlot viewBox must contain x, y, width, and height with positive dimensions; received "${viewBox}".`,
    );
  }
  const valuesById = new Map(context.values.map((value) => [value.id, value]));
  const regionIds = new Set<string>();
  const regionStates = regions.map((region, index): MapChartRegionState => {
    if (!region.id.trim() || !region.d.trim()) {
      throw new Error(`MapChartPlot region at index ${index} must have a non-empty id and path.`);
    }
    if (regionIds.has(region.id)) {
      throw new Error(`MapChartPlot region id "${region.id}" is duplicated.`);
    }
    if (!Number.isFinite(region.centerX) || !Number.isFinite(region.centerY)) {
      throw new Error(
        `MapChartPlot region "${region.id}" must have finite center coordinates; received centerX=${region.centerX}, centerY=${region.centerY}.`,
      );
    }
    const value = valuesById.get(region.id);
    if (!value) {
      throw new Error(`MapChartPlot region "${region.id}" has no matching MapChart value.`);
    }
    regionIds.add(region.id);
    return { region, value, index };
  });
  for (const value of context.values) {
    if (!regionIds.has(value.id)) {
      throw new Error(`MapChart value "${value.id}" has no matching MapChartPlot region.`);
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
    <svg
      {...props}
      ref={ref}
      viewBox={viewBox}
      role="group"
      data-slot={dataSlot(props, "map-chart-plot")}
    >
      <ChartNavigationProvider
        count={regionStates.length}
        getTargetIndex={getTargetIndex}
        orientation="both"
      >
        <g role="presentation" data-slot="map-chart-regions">
          {regionStates.map((region) => (
            <Fragment key={`${region.value.id}-${region.index}`}>
              {children ? (
                children(region)
              ) : (
                <MapChartRegion region={region}>
                  <path d={region.region.d} fill="currentColor" />
                </MapChartRegion>
              )}
            </Fragment>
          ))}
        </g>
      </ChartNavigationProvider>
    </svg>
  );
}
