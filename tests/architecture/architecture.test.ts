import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  scanDirectory,
  extractImports,
  validateArchitectureRules,
  detectCircularDependencies,
  type ImportStatement,
} from "./architecture-scanner";

const ROOT_DIR = path.resolve(__dirname, "../../");
const SRC_DIR = path.join(ROOT_DIR, "src");

function loadSrcCodebase() {
  const filePaths = scanDirectory(SRC_DIR, ROOT_DIR);
  const fileImports = new Map<string, ImportStatement[]>();
  const fileContents = new Map<string, string>();

  for (const relativePath of filePaths) {
    const fullPath = path.join(ROOT_DIR, relativePath);
    const content = fs.readFileSync(fullPath, "utf-8");
    fileContents.set(relativePath, content);
    fileImports.set(relativePath, extractImports(content, relativePath));
  }

  return { filePaths, fileImports, fileContents };
}

function resolveModulePath(fromFile: string, importPath: string): string | null {
  if (importPath.startsWith("@/")) {
    const target = "src/" + importPath.substring(2);
    // Approximate resolution to ts/tsx or index
    const candidates = [
      target,
      `${target}.ts`,
      `${target}.tsx`,
      `${target}/index.ts`,
      `${target}/index.tsx`,
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(ROOT_DIR, c))) {
        return c;
      }
    }
    return target;
  }

  if (importPath.startsWith(".")) {
    const fromDir = path.dirname(path.join(ROOT_DIR, fromFile));
    const resolvedFull = path.resolve(fromDir, importPath);
    const relative = path.relative(ROOT_DIR, resolvedFull).replace(/\\/g, "/");
    const candidates = [
      relative,
      `${relative}.ts`,
      `${relative}.tsx`,
      `${relative}/index.ts`,
      `${relative}/index.tsx`,
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(ROOT_DIR, c))) {
        return c;
      }
    }
    return relative;
  }

  return null;
}

describe("Architectural Boundary Rules Enforcement", () => {
  const { fileImports, fileContents } = loadSrcCodebase();

  it("enforces that all source files comply with architectural boundary rules", () => {
    const violations = validateArchitectureRules(fileImports, fileContents);

    if (violations.length > 0) {
      const formatted = violations
        .map((v) => `[${v.rule}] ${v.file}:${v.line} -> ${v.message}`)
        .join("\n");
      expect.fail(`Architectural violations detected:\n${formatted}`);
    }

    expect(violations).toHaveLength(0);
  });

  it("enforces that no circular dependencies exist across the src codebase", () => {
    const cycles = detectCircularDependencies(fileImports, resolveModulePath);

    if (cycles.length > 0) {
      const formatted = cycles.map((c) => c.join(" -> ")).join("\n");
      expect.fail(`Circular dependencies detected:\n${formatted}`);
    }

    expect(cycles).toHaveLength(0);
  });
});

describe("Architectural Rule Violation Detection (Negative Test Cases)", () => {
  it("detects deep imports into a module from outside that module", () => {
    const fakeImports = new Map<string, ImportStatement[]>([
      [
        "src/app/page.tsx",
        [
          {
            file: "src/app/page.tsx",
            importedPath: "@/modules/example/domain/project-record",
            line: 4,
          },
        ],
      ],
    ]);
    const fakeContents = new Map<string, string>([["src/app/page.tsx", ""]]);

    const violations = validateArchitectureRules(fakeImports, fakeContents);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("MODULE_PUBLIC_ENTRY_ONLY");
    expect(violations[0].message).toContain("Deep import into module 'example'");
  });

  it("detects shared primitives importing business modules", () => {
    const fakeImports = new Map<string, ImportStatement[]>([
      [
        "src/shared/domain/result.ts",
        [
          {
            file: "src/shared/domain/result.ts",
            importedPath: "@/modules/example",
            line: 1,
          },
        ],
      ],
    ]);
    const fakeContents = new Map<string, string>([["src/shared/domain/result.ts", ""]]);

    const violations = validateArchitectureRules(fakeImports, fakeContents);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("SHARED_PRIMITIVES_PURITY");
  });

  it("detects client or presentation components importing server-only code", () => {
    const fakeImports = new Map<string, ImportStatement[]>([
      [
        "src/components/status-badge.tsx",
        [
          {
            file: "src/components/status-badge.tsx",
            importedPath: "@/server",
            line: 2,
          },
        ],
      ],
    ]);
    const fakeContents = new Map<string, string>([
      ["src/components/status-badge.tsx", '"use client";'],
    ]);

    const violations = validateArchitectureRules(fakeImports, fakeContents);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("SERVER_ONLY_LEAKAGE");
  });

  it("detects domain layer depending on application or server layers", () => {
    const fakeImports = new Map<string, ImportStatement[]>([
      [
        "src/modules/example/domain/project-code.ts",
        [
          {
            file: "src/modules/example/domain/project-code.ts",
            importedPath: "@/server",
            line: 1,
          },
        ],
      ],
    ]);
    const fakeContents = new Map<string, string>([
      ["src/modules/example/domain/project-code.ts", ""],
    ]);

    const violations = validateArchitectureRules(fakeImports, fakeContents);
    expect(violations).toHaveLength(1);
    expect(violations[0].rule).toBe("DOMAIN_ISOLATION");
  });

  it("detects circular dependency cycles", () => {
    const fakeImports = new Map<string, ImportStatement[]>([
      ["src/fileA.ts", [{ file: "src/fileA.ts", importedPath: "@/fileB", line: 1 }]],
      ["src/fileB.ts", [{ file: "src/fileB.ts", importedPath: "@/fileA", line: 1 }]],
    ]);

    const fakeResolver = (_from: string, imp: string) => {
      if (imp === "@/fileB") return "src/fileB.ts";
      if (imp === "@/fileA") return "src/fileA.ts";
      return null;
    };

    const cycles = detectCircularDependencies(fakeImports, fakeResolver);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0]).toContain("src/fileA.ts");
    expect(cycles[0]).toContain("src/fileB.ts");
  });
});

// ---------------------------------------------------------------------------
// S0.2 Security Verification — Server-Only Boundary Negative Tests
// ---------------------------------------------------------------------------
// These tests prove the scanner rejects every prohibited server-only import
// pattern, including: aliased sub-paths, relative paths, the bare package
// name, and presentation components that lack the "use client" directive.
// ---------------------------------------------------------------------------

describe("Server-Only Boundary Enforcement (Negative Tests)", () => {
  // Helper: build a minimal fake codebase entry and run the rule engine.
  function detectServerLeakage(file: string, content: string, importedPath: string) {
    const fakeImports = new Map<string, ImportStatement[]>([
      [file, [{ file, importedPath, line: 1 }]],
    ]);
    const fakeContents = new Map<string, string>([[file, content]]);
    return validateArchitectureRules(fakeImports, fakeContents).filter(
      (v) => v.rule === "SERVER_ONLY_LEAKAGE"
    );
  }

  // ── 1. Client component — aliased root import ────────────────────────────
  it("detects 'use client' app route importing @/server (aliased root)", () => {
    const v = detectServerLeakage("src/app/some-client-page.tsx", '"use client";', "@/server");
    expect(v).toHaveLength(1);
    expect(v[0].file).toBe("src/app/some-client-page.tsx");
    expect(v[0].importedPath).toBe("@/server");
  });

  // ── 2. Client component — aliased sub-path import ───────────────────────
  it("detects 'use client' component importing @/server/infrastructure/server-context", () => {
    const v = detectServerLeakage(
      "src/app/some-client-page.tsx",
      '"use client";',
      "@/server/infrastructure/server-context"
    );
    expect(v).toHaveLength(1);
    expect(v[0].importedPath).toBe("@/server/infrastructure/server-context");
  });

  // ── 3. Client component — relative path to server index ──────────────────
  it("detects 'use client' component importing ../../server/index via relative path", () => {
    const v = detectServerLeakage(
      "src/app/some-client-page.tsx",
      '"use client";',
      "../../server/index"
    );
    expect(v).toHaveLength(1);
    expect(v[0].importedPath).toBe("../../server/index");
  });

  // ── 4. Client component — relative deep sub-path ─────────────────────────
  it("detects 'use client' component importing ../../server/infrastructure/server-context via relative path", () => {
    const v = detectServerLeakage(
      "src/components/some-client-widget.tsx",
      '"use client";',
      "../../server/infrastructure/server-context"
    );
    expect(v).toHaveLength(1);
    expect(v[0].importedPath).toBe("../../server/infrastructure/server-context");
  });

  // ── 5. Client component — bare 'server-only' package import ─────────────
  it("detects 'use client' component importing the 'server-only' package directly", () => {
    const v = detectServerLeakage(
      "src/components/some-client-widget.tsx",
      '"use client";',
      "server-only"
    );
    expect(v).toHaveLength(1);
    expect(v[0].importedPath).toBe("server-only");
  });

  // ── 6. Presentation component (no directive) — aliased server import ─────
  // A presentation component in src/components/ is always prohibited from
  // importing server infrastructure, even if it carries no "use client"
  // directive. isPresentationComponent = true is sufficient.
  it("detects presentation component (no 'use client') importing @/server", () => {
    const v = detectServerLeakage(
      "src/components/plain-component.tsx",
      "// no directive",
      "@/server"
    );
    expect(v).toHaveLength(1);
    expect(v[0].file).toBe("src/components/plain-component.tsx");
  });

  // ── 7. Presentation component (no directive) — deep aliased sub-path ─────
  it("detects presentation component importing @/server/infrastructure/server-context", () => {
    const v = detectServerLeakage(
      "src/components/plain-component.tsx",
      "// no directive",
      "@/server/infrastructure/server-context"
    );
    expect(v).toHaveLength(1);
    expect(v[0].importedPath).toBe("@/server/infrastructure/server-context");
  });

  // ── 8. Presentation component (no directive) — relative server path ──────
  it("detects presentation component importing server via relative path", () => {
    const v = detectServerLeakage(
      "src/components/plain-component.tsx",
      "// no directive",
      "../../server/index"
    );
    expect(v).toHaveLength(1);
    expect(v[0].importedPath).toBe("../../server/index");
  });

  // ── 9. Allowed: server component in app/ (no directive) may import server ─
  // Server components (no "use client") in src/app/ are permitted to use
  // server infrastructure. The scanner must NOT flag this as a violation.
  it("does NOT flag a server component in src/app/ importing @/server", () => {
    const v = detectServerLeakage(
      "src/app/server-page.tsx",
      "// no use client directive — this is a React Server Component",
      "@/server"
    );
    // Not a client component, not a presentation component → no violation
    expect(v).toHaveLength(0);
  });

  // ── 10. Allowed: module application layer may import server ───────────────
  it("does NOT flag a module application service importing @/server", () => {
    const v = detectServerLeakage(
      "src/modules/enquiry/application/enquiry-service.ts",
      "// no directive",
      "@/server"
    );
    expect(v).toHaveLength(0);
  });
});
