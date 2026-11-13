import fs from "fs";
import path from "path";

export interface ImportStatement {
  readonly file: string;
  readonly importedPath: string;
  readonly line: number;
}

export interface RuleViolation {
  readonly rule: string;
  readonly file: string;
  readonly importedPath: string;
  readonly line: number;
  readonly message: string;
}

/**
 * Extracts import/export statements from TypeScript source text.
 */
export function extractImports(sourceText: string, filePath: string): ImportStatement[] {
  const imports: ImportStatement[] = [];
  const lines = sourceText.split(/\r?\n/);

  // Match import ... from '...' and export ... from '...' and dynamic import('...')
  const importRegex = /(?:import|export)\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  lines.forEach((line, index) => {
    // Skip full-line comments
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) {
      return;
    }

    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(line)) !== null) {
      imports.push({
        file: filePath,
        importedPath: match[1],
        line: index + 1,
      });
    }

    while ((match = dynamicImportRegex.exec(line)) !== null) {
      imports.push({
        file: filePath,
        importedPath: match[1],
        line: index + 1,
      });
    }
  });

  return imports;
}

/**
 * Recursively scans directory for TypeScript files.
 */
export function scanDirectory(dir: string, baseDir: string = dir): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === "build" ||
        entry.name === "docs" ||
        entry.name === ".agents"
      ) {
        continue;
      }
      results.push(...scanDirectory(fullPath, baseDir));
    } else if (
      entry.isFile() &&
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".d.ts")
    ) {
      results.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
    }
  }
  return results;
}

/**
 * Validates architectural rules across a set of file imports.
 */
export function validateArchitectureRules(
  fileImports: Map<string, ImportStatement[]>,
  fileContents: Map<string, string>
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  for (const [file, imports] of fileImports.entries()) {
    const content = fileContents.get(file) ?? "";
    // Matches directive at start of line: "use client" or 'use client'
    const isClientComponent = /^\s*["']use client["']/m.test(content);
    const isPresentationComponent = file.startsWith("src/components/");
    const isShared = file.startsWith("src/shared/");
    const isDomain = file.includes("/domain/");
    const currentModuleMatch = file.match(/^src\/modules\/([^/]+)/);
    const currentModuleName = currentModuleMatch ? currentModuleMatch[1] : null;

    for (const imp of imports) {
      const impPath = imp.importedPath;

      // Rule 1: No deep module imports from outside that module
      // Allowed: @/modules/<name> or @/modules/<name>/index
      // Disallowed: @/modules/<name>/domain/..., @/modules/<name>/application/..., etc.
      const moduleDeepImportMatch = impPath.match(/^@\/modules\/([^/]+)\/(.+)$/);
      if (moduleDeepImportMatch) {
        const targetModule = moduleDeepImportMatch[1];
        const subPath = moduleDeepImportMatch[2];
        if (targetModule !== currentModuleName && subPath !== "index") {
          violations.push({
            rule: "MODULE_PUBLIC_ENTRY_ONLY",
            file,
            importedPath: impPath,
            line: imp.line,
            message: `Deep import into module '${targetModule}' via '${impPath}' is prohibited. Only public entry point '@/${targetModule}' is allowed.`,
          });
        }
      } else if (impPath.startsWith(".") && impPath.includes("/modules/")) {
        // Relative deep imports across modules (e.g., ../../other-module/domain/...)
        const relativeModuleMatch = impPath.match(/\/modules\/([^/]+)\/(.+)$/);
        if (relativeModuleMatch) {
          const targetModule = relativeModuleMatch[1];
          const subPath = relativeModuleMatch[2];
          if (targetModule !== currentModuleName && subPath !== "index" && subPath !== "") {
            violations.push({
              rule: "MODULE_PUBLIC_ENTRY_ONLY",
              file,
              importedPath: impPath,
              line: imp.line,
              message: `Cross-module internal import into '${targetModule}' via relative path '${impPath}' is prohibited.`,
            });
          }
        }
      }

      // Rule 2: Shared cannot import from business modules, server, or presentation components
      if (isShared) {
        if (
          impPath.startsWith("@/modules") ||
          impPath.startsWith("@/server") ||
          impPath.startsWith("@/components") ||
          impPath.startsWith("@/app") ||
          impPath.includes("/modules/") ||
          impPath.includes("/server/")
        ) {
          violations.push({
            rule: "SHARED_PRIMITIVES_PURITY",
            file,
            importedPath: impPath,
            line: imp.line,
            message: `Shared primitives must not depend on modules, server infrastructure, or UI components. Found import: '${impPath}'.`,
          });
        }
      }

      // Rule 3: Domain code cannot depend on application, server, components, or presentation
      if (isDomain) {
        if (
          impPath.includes("/application") ||
          impPath.includes("/infrastructure") ||
          impPath.startsWith("@/server") ||
          impPath.startsWith("@/components") ||
          impPath.startsWith("@/app")
        ) {
          violations.push({
            rule: "DOMAIN_ISOLATION",
            file,
            importedPath: impPath,
            line: imp.line,
            message: `Domain layer in '${file}' must not depend on application, server, or UI layers. Found import: '${impPath}'.`,
          });
        }
      }

      // Rule 4: Server-only protection — client code or presentation components cannot import server-only code
      if (isClientComponent || isPresentationComponent) {
        if (
          impPath === "server-only" ||
          impPath.startsWith("@/server") ||
          impPath.includes("/server/")
        ) {
          violations.push({
            rule: "SERVER_ONLY_LEAKAGE",
            file,
            importedPath: impPath,
            line: imp.line,
            message: `Client or presentation component '${file}' must not import server-only infrastructure '${impPath}'.`,
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Checks for circular dependencies in the codebase.
 */
export function detectCircularDependencies(
  fileImports: Map<string, ImportStatement[]>,
  resolvePath: (fromFile: string, importPath: string) => string | null
): string[][] {
  const graph = new Map<string, Set<string>>();

  // Build directed dependency graph
  for (const [file, imports] of fileImports.entries()) {
    if (!graph.has(file)) {
      graph.set(file, new Set());
    }
    for (const imp of imports) {
      const resolved = resolvePath(file, imp.importedPath);
      if (resolved && resolved !== file) {
        graph.get(file)!.add(resolved);
      }
    }
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const currentPath: string[] = [];

  function dfs(node: string) {
    visited.add(node);
    recursionStack.add(node);
    currentPath.push(node);

    const neighbors = graph.get(node) ?? new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (recursionStack.has(neighbor)) {
        const cycleStartIndex = currentPath.indexOf(neighbor);
        cycles.push([...currentPath.slice(cycleStartIndex), neighbor]);
      }
    }

    currentPath.pop();
    recursionStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}
