import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";
import plugin from "./oxlint-comp0.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: "tsx" } } });
const { rules } = plugin;

tester.run("props-above-component", rules["props-above-component"] as never, {
  valid: [
    'export type TabProps = ComponentProps<"button">;\nexport function Tab({ ref, ...props }: TabProps) { return <button {...props} ref={ref} />; }',
    "export function Empty() { return null; }",
    "export function useThing(options: Options) { return options; }",
  ],
  invalid: [
    {
      code: 'import type { TabProps } from "./shared";\nexport function Tab(props: TabProps) { return null; }',
      errors: [{ message: /directly above Tab/ }],
    },
    {
      code: 'export type TabProps = ComponentProps<"button">;\nexport function Tab(props: TabProps & RefProp<HTMLButtonElement>) { return null; }',
      errors: [{ message: /whole props type/ }],
    },
    {
      code: "export type TabProps = {};\nconst other = 1;\nexport function Tab(props: TabProps) { return null; }",
      errors: [{ message: /directly above Tab/ }],
    },
  ],
});

tester.run("inline-class-names", rules["inline-class-names"] as never, {
  valid: [
    'const label = "Save";',
    "const classify = (value: string) => value;",
    "const extractedClassNames = sources.flatMap(scan);",
  ],
  invalid: [
    { code: 'const triggerClassName = "rounded px-2";', errors: 1 },
    { code: 'let className = active ? "a" : "b";', errors: 1 },
    { code: "const buttonClasses = cn(base, extra);", errors: 1 },
  ],
});

tester.run("compact-ternaries", rules["compact-ternaries"] as never, {
  valid: ["const value = open ? 1 : 2;", "const value = open\n  ? first\n  : second;"],
  invalid: [{ code: "const value = open\n  ? (\n    first\n  )\n  : second;", errors: 1 }],
});

tester.run("memo-needs-reason", rules["memo-needs-reason"] as never, {
  valid: [
    "function A() {\n  // Context consumers compare this identity.\n  const value = useMemo(() => ({}), []);\n}",
    "function A() {\n  const handlers = {\n    // Effect dependency must stay stable.\n    onChange: useCallback(() => {}, []),\n  };\n}",
  ],
  invalid: [
    { code: "function A() {\n  const value = useMemo(() => ({}), []);\n}", errors: 1 },
    { code: "function A() {\n  const handle = React.useCallback(() => {}, []);\n}", errors: 1 },
  ],
});

tester.run("presence-data-attributes", rules["presence-data-attributes"] as never, {
  valid: [
    "<div data-open={dataAttr(open)} />",
    "<div data-open={open || undefined} />",
    '<div data-value="small" />',
    "<div data-count={count} />",
  ],
  invalid: [
    { code: "<div data-open={true} />", errors: 1 },
    { code: '<div data-open="false" />', errors: 1 },
    { code: '<div data-open={open ? "true" : "false"} />', errors: 1 },
    { code: "<div data-open={String(open)} />", errors: 1 },
  ],
});
