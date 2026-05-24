import * as fs from "node:fs";
import ts from "typescript";

export interface DiscoveredSpecTest {
  name: string;
  fullName: string;
}

export function discoverSpecTests(specFilePath: string): DiscoveredSpecTest[] {
  let sourceText: string;

  try {
    sourceText = fs.readFileSync(specFilePath, "utf8");
  } catch {
    return [];
  }

  return discoverSpecTestsFromSource(sourceText, specFilePath);
}

export function discoverSpecTestsFromSource(sourceText: string, fileName = "spec.ts"): DiscoveredSpecTest[] {
  const source = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true);
  const tests: DiscoveredSpecTest[] = [];
  const describeStack: string[] = [];

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      const callee = getCalleeName(node.expression);

      if (callee === "describe") {
        const suiteName = readStringArg(node.arguments[0]);
        if (suiteName) {
          describeStack.push(suiteName);
          visitDescribeBody(node);
          describeStack.pop();
          return;
        }
      }

      if (callee === "it" || callee === "test") {
        const testName = readStringArg(node.arguments[0]);
        if (testName) {
          tests.push({
            name: testName,
            fullName: [...describeStack, testName].join(" "),
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  function visitDescribeBody(call: ts.CallExpression): void {
    for (const arg of call.arguments) {
      if (ts.isFunctionLike(arg) && arg.body) {
        ts.forEachChild(arg.body, visit);
      }
    }
  }

  visit(source);
  return tests;
}

function getCalleeName(expression: ts.Expression): string | undefined {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }

  if (ts.isPropertyAccessExpression(expression)) {
    return getCalleeName(expression.expression);
  }

  return undefined;
}

function readStringArg(expression: ts.Expression | undefined): string | undefined {
  if (!expression) {
    return undefined;
  }

  if (ts.isStringLiteralLike(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    const value = expression.text.trim();
    return value || undefined;
  }

  return undefined;
}
