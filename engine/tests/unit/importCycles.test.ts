/*
 * No two engine modules import each other, directly or through other modules.
 * A circle of imports makes the order in which modules load matter, and the
 * bundler that builds Cade warns for each one. Type-only imports do not count:
 * they are gone at run time.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ENGINE_ROOT = resolve(__dirname, "../../src");

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

/* `import type …`, `export type …`, and a list where each name is `type X`. */
function isTypeOnly(statement: ts.ImportDeclaration | ts.ExportDeclaration): boolean {
  if (ts.isExportDeclaration(statement)) {
    if (statement.isTypeOnly) return true;
    const names = statement.exportClause;
    return Boolean(
      names &&
      ts.isNamedExports(names) &&
      names.elements.length > 0 &&
      names.elements.every((element) => element.isTypeOnly),
    );
  }
  const clause = statement.importClause;
  if (!clause) return false;
  if (clause.isTypeOnly) return true;
  const names = clause.namedBindings;
  return Boolean(
    !clause.name &&
    names &&
    ts.isNamedImports(names) &&
    names.elements.length > 0 &&
    names.elements.every((element) => element.isTypeOnly),
  );
}

/* "./x.js" names the source file x.ts; a folder names its index.ts. */
function sourceFileOf(importer: string, specifier: string): string | undefined {
  const target = resolve(dirname(importer), specifier);
  const asFile = target.endsWith(".js") ? `${target.slice(0, -3)}.ts` : `${target}.ts`;
  if (existsSync(asFile)) return asFile;
  const asIndex = join(target, "index.ts");
  return existsSync(asIndex) ? asIndex : undefined;
}

function runtimeImports(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest);
  return source.statements.flatMap((statement) => {
    if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) return [];
    const specifier = statement.moduleSpecifier;
    if (!specifier || !ts.isStringLiteral(specifier)) return [];
    if (!specifier.text.startsWith(".") || isTypeOnly(statement)) return [];
    const target = sourceFileOf(file, specifier.text);
    return target ? [target] : [];
  });
}

/* Tarjan's algorithm: the groups of modules where each one reaches each other one. */
function importCircles(graph: Map<string, string[]>): string[][] {
  const order = new Map<string, number>();
  const lowest = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const circles: string[][] = [];

  function visit(node: string): void {
    order.set(node, order.size);
    lowest.set(node, order.get(node)!);
    stack.push(node);
    onStack.add(node);
    for (const next of graph.get(node) ?? []) {
      if (!order.has(next)) {
        visit(next);
        lowest.set(node, Math.min(lowest.get(node)!, lowest.get(next)!));
      } else if (onStack.has(next)) {
        lowest.set(node, Math.min(lowest.get(node)!, order.get(next)!));
      }
    }
    if (lowest.get(node) !== order.get(node)) return;
    const group: string[] = [];
    let member: string;
    do {
      member = stack.pop()!;
      onStack.delete(member);
      group.push(member);
    } while (member !== node);
    const importsItself = (graph.get(node) ?? []).includes(node);
    if (group.length > 1 || importsItself) circles.push(group.sort());
  }

  for (const node of graph.keys()) if (!order.has(node)) visit(node);
  return circles;
}

describe("engine import circles", () => {
  const files = walk(ENGINE_ROOT);
  const graph = new Map(files.map((file) => [file, runtimeImports(file)]));

  it("finds engine modules to check", () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it("has no module that imports itself through other modules", () => {
    const circles = importCircles(graph).map((group) =>
      group.map((file) => relative(ENGINE_ROOT, file)),
    );
    expect(circles).toEqual([]);
  });
});
