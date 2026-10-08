// Project conventions from AGENTS.md as oxlint JS plugin rules, so they run in
// `pnpm lint` and the editor instead of as regex scans in a test file.

type Node = {
  type: string;
  parent?: Node;
  loc: { start: { line: number }; end: { line: number } };
  // ESTree node fields vary by node type; rules narrow on `type` before reading them.
  // oxlint-disable-next-line typescript/no-explicit-any
  [key: string]: any;
};

type Comment = { loc: { start: { line: number }; end: { line: number } } };

type Context = {
  filename: string;
  report(descriptor: { node: Node; message: string }): void;
  sourceCode: { getCommentsBefore(node: Node): Comment[]; getAllComments(): Comment[] };
};

type Rule = { create(context: Context): Record<string, (node: Node) => void> };

const pascalCase = /^[A-Z][A-Za-z0-9]*$/;

function exportedComponent(statement: Node) {
  if (statement.type !== "ExportNamedDeclaration") return undefined;
  const declaration = statement.declaration;
  if (declaration?.type !== "FunctionDeclaration") return undefined;
  const name: string | undefined = declaration.id?.name;
  if (!name || !pascalCase.test(name)) return undefined;
  return { name, declaration };
}

function exportedTypeAliasName(statement: Node | undefined) {
  if (statement?.type !== "ExportNamedDeclaration") return undefined;
  if (statement.declaration?.type !== "TSTypeAliasDeclaration") return undefined;
  return statement.declaration.id.name as string;
}

function referencedTypeName(annotation: Node | undefined) {
  const type = annotation?.typeAnnotation;
  if (type?.type !== "TSTypeReference") return undefined;
  if (type.typeName.type !== "Identifier") return undefined;
  return type.typeName.name as string;
}

const propsAboveComponent: Rule = {
  create(context) {
    return {
      Program(program) {
        const body: Node[] = program.body;
        body.forEach((statement, index) => {
          const component = exportedComponent(statement);
          if (!component) return;
          const [props] = component.declaration.params as Node[];
          if (!props) return;
          const propsName = `${component.name}Props`;
          if (exportedTypeAliasName(body[index - 1]) !== propsName) {
            context.report({
              node: statement,
              message: `Declare \`export type ${propsName}\` directly above ${component.name}.`,
            });
          }
          if (referencedTypeName(props.typeAnnotation) !== propsName) {
            context.report({
              node: props,
              message: `${component.name} must take \`${propsName}\` as its whole props type; fold ref and other props into it.`,
            });
          }
        });
      },
    };
  },
};

const classNameVariable =
  /^class(?:Name|Names|es)?$|[a-z0-9](?:ClassName|ClassNames|Classes|Class)$/;

const classHelpers = new Set(["cn", "clsx", "cx", "classNames", "twMerge"]);

function buildsClassString(node: Node | undefined | null): boolean {
  if (!node) return false;
  if (node.type === "Literal") return typeof node.value === "string";
  if (node.type === "TemplateLiteral") return true;
  if (node.type === "ConditionalExpression") {
    return buildsClassString(node.consequent) || buildsClassString(node.alternate);
  }
  if (node.type === "LogicalExpression" || node.type === "BinaryExpression") {
    return buildsClassString(node.left) || buildsClassString(node.right);
  }
  if (node.type === "CallExpression") {
    const name = calleeName(node);
    return Boolean(name && (classHelpers.has(name) || name === "join"));
  }
  return false;
}

const inlineClassNames: Rule = {
  create(context) {
    return {
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier" || !classNameVariable.test(node.id.name)) return;
        if (!buildsClassString(node.init)) return;
        context.report({
          node,
          message: "Keep class names inline in the `className` expression instead of a variable.",
        });
      },
    };
  },
};

const compactTernaries: Rule = {
  create(context) {
    return {
      ConditionalExpression(node) {
        if (node.loc.end.line - node.loc.start.line < 3) return;
        context.report({
          node,
          message: "Ternaries may span at most three lines; use `let` and `if` statements instead.",
        });
      },
    };
  },
};

const memoHooks = new Set(["useMemo", "useCallback"]);

function calleeName(node: Node) {
  const callee = node.callee;
  if (callee.type === "Identifier") return callee.name as string;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    return callee.property.name as string;
  }
  return undefined;
}

function enclosingStatement(node: Node) {
  let current = node;
  while (current.parent && !/^(?:Program|BlockStatement|StaticBlock)$/.test(current.parent.type)) {
    current = current.parent;
  }
  return current;
}

const memoNeedsReason: Rule = {
  create(context) {
    return {
      CallExpression(node) {
        const name = calleeName(node);
        if (!name || !memoHooks.has(name)) return;
        const statement = enclosingStatement(node);
        const explained =
          context.sourceCode.getCommentsBefore(statement).length > 0 ||
          context.sourceCode
            .getAllComments()
            .some((comment) => comment.loc.end.line === node.loc.start.line - 1);
        if (explained) return;
        context.report({
          node,
          message: `The React Compiler memoizes by default; explain in a comment directly above why ${name} is required.`,
        });
      },
    };
  },
};

function isBooleanLike(node: Node | undefined): boolean {
  if (!node) return false;
  if (node.type === "Literal") {
    return typeof node.value === "boolean" || node.value === "true" || node.value === "false";
  }
  if (node.type === "ConditionalExpression") {
    return isBooleanLike(node.consequent) && isBooleanLike(node.alternate);
  }
  if (node.type === "CallExpression") return calleeName(node) === "String";
  return false;
}

const presenceDataAttributes: Rule = {
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || !node.name.name.startsWith("data-")) return;
        const value = node.value;
        const expression = value?.type === "JSXExpressionContainer" ? value.expression : value;
        if (!isBooleanLike(expression)) return;
        context.report({
          node,
          message: `Use presence semantics for ${node.name.name}: \`dataAttr(condition)\` or \`condition || undefined\`.`,
        });
      },
    };
  },
};

const syntheticEvents = new Set(["fireClick", "fireKeyDown"]);

// Tests drive components with real input (userEvent through the provider), so
// the synthetic dispatch helpers from test/render stay out of test files. An
// `oxlint-disable-next-line comp0/no-synthetic-events -- reason` documents the
// rare case that genuinely needs one.
const noSyntheticEvents: Rule = {
  create(context) {
    if (!/\.test\.[cm]?[jt]sx?$/.test(context.filename)) return {};
    const localNames = new Map<string, string>();
    return {
      ImportDeclaration(node) {
        if (!/(?:^|\/)test\/render(?:\.[jt]sx?)?$/.test(String(node.source.value))) return;
        for (const specifier of node.specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;
          const name = specifier.imported.name ?? specifier.imported.value;
          if (syntheticEvents.has(name)) localNames.set(specifier.local.name, name);
        }
      },
      CallExpression(node) {
        if (node.callee.type !== "Identifier") return;
        const name = localNames.get(node.callee.name);
        if (!name) return;
        context.report({
          node,
          message: `Drive the component with userEvent instead of ${name}; if a synthetic event is the only way, add \`oxlint-disable-next-line comp0/no-synthetic-events -- <reason>\`.`,
        });
      },
    };
  },
};

export default {
  meta: { name: "comp0" },
  rules: {
    "compact-ternaries": compactTernaries,
    "inline-class-names": inlineClassNames,
    "memo-needs-reason": memoNeedsReason,
    "no-synthetic-events": noSyntheticEvents,
    "presence-data-attributes": presenceDataAttributes,
    "props-above-component": propsAboveComponent,
  },
};
