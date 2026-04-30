import { type RefProp } from "../shared.js";
export function SliderOutput(
  props: React.OutputHTMLAttributes<HTMLOutputElement> & RefProp<HTMLOutputElement>,
) {
  const { ref } = props;
  return <output {...props} ref={ref} data-slot="slider-output" />;
}
