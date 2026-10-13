import { serverComponent } from "@comp0/genui/rsc";
import { forecastDescription, forecastProps } from "./contract.js";
import { ForecastChart } from "./ForecastChart.js";
import { ShaderCanvas } from "./ShaderCanvas.js";

const cities: Record<string, number> = { Oslo: 9, Lisbon: 21, Tokyo: 18, Nairobi: 24 };
export const Forecast = serverComponent("Forecast", {
  description: forecastDescription,
  props: forecastProps,
  async render({ city }) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const base = cities[city] ?? 15;
    const data = Array.from({ length: 7 }, (_, day) => ({
      x: day + 1,
      y: Math.round((base + 4 * Math.sin(day + city.length)) * 10) / 10,
    }));
    return <ForecastChart data={data} />;
  },
});
export const labComponents = { Forecast, Shader: ShaderCanvas };
