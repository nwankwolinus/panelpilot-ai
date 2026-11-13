# PanelPilot AI — Modular Monolith Architecture

## 1. Architectural Overview

PanelPilot AI is engineered as a **TypeScript modular monolith** following Domain-Driven Design (DDD) principles and server-authoritative execution. The system guarantees engineering traceability, reproducible calculations, immutable approved artifacts, and explicit module boundaries without microservice complexity.

```text
src/
├── app/                  # Route handlers, layouts, page composition (Next.js App Router)
├── components/           # Reusable presentation components (stateless, pure UI)
├── modules/              # Authoritative business capability modules
│   └── example/          # Reference implementation of module boundaries
│       ├── domain/       # Pure domain models, entities, value objects, domain errors
│       ├── application/  # Service use-cases, business orchestration
│       ├── contracts/    # Public interfaces, DTOs, commands, events
│       └── index.ts      # Strictly controlled public module entry point
├── server/               # Server-only infrastructure, adapters, technical services
│   ├── infrastructure/   # Context assertion, environment guards, runtime adapters
│   └── index.ts          # Server-only root entry point (protected by 'server-only')
└── shared/               # Cross-cutting primitives and domain abstractions
    ├── domain/           # Result<T, E>, DomainError, ValueObject<T>
    ├── application/      # UseCase<TInput, TOutput>, IClock, SystemClock
    └── index.ts          # Public entry point for shared primitives
```

---

## 2. Directory Responsibilities

| Directory | Purpose | Boundary Constraints |
|---|---|---|
| `src/app/` | Page composition, layout hierarchy, routing | Calls modules via public entry points; no business logic in route handlers |
| `src/components/` | Reusable UI presentation elements | Pure UI only; no business calculations; no server-only imports |
| `src/modules/` | Independently owned business capabilities | Self-contained domain & application layers; consumers access via `index.ts` only |
| `src/shared/` | Cross-module abstractions & primitives | Zero dependencies on business modules, server infrastructure, or UI components |
| `src/server/` | Technical infrastructure & server adapters | Protected with `import "server-only"`; never imported into client components |

---

## 3. Dependency Direction Rules

1. **Domain Isolation**: Code in `src/modules/*/domain/` must be pure TypeScript. It may only depend on `src/shared/domain/`. It must never import application services, server infrastructure, React components, or database adapters.
2. **Public Entry Points Only**: All cross-module and app-to-module communication must use `@/modules/<module-name>`. Deep imports into internal folders (e.g. `@/modules/<name>/domain/...` or `@/modules/<name>/application/...`) are strictly prohibited and enforced by automated tests.
3. **Cross-Module Communication**: Modules must interact solely through explicitly published contracts (`contracts/index.ts`) and exposed service interfaces. Direct internal coupling between modules is forbidden.
4. **Shared Primitives Purity**: `src/shared/` must never import from `src/modules/`, `src/server/`, `src/components/`, or `src/app/`.
5. **Server-Only Protection**: Any component marked `"use client"` or located in `src/components/` must never import from `src/server/` or the `server-only` package.
6. **No Circular Dependencies**: All dependencies must form a Directed Acyclic Graph (DAG). Circular references between files or modules are strictly prohibited.
7. **No Evaluated Code**: Formula execution via `eval()`, `new Function()`, or dynamic runtime script execution is strictly forbidden. Engineering calculations must use registered, versioned rules.

---

## 4. Rules for Adding Future Business Modules

When creating a future business module (e.g. `enquiry`, `engineering`, `bom`, `pricing`, `commercial`, `quotation`):

1. **Create the standard structure**:
   ```text
   src/modules/<module-name>/
   ├── domain/       # Entities, Value Objects, Domain Errors, Domain Events
   ├── application/  # Use Case handlers, application services, repository ports
   ├── contracts/    # Public DTOs, Commands, Queries, Service Interfaces
   └── index.ts      # Public module entry point (exports contracts and service factories)
   ```
2. **Define explicit contracts**: Expose serializable DTOs and command interfaces in `contracts/`. Do not leak domain entities or ORM models outside the module.
3. **Enforce boundary in `index.ts`**: Re-export only the public contracts and service factory/entry point. Keep internal implementation classes private.
4. **Use `Result<T, E>`**: Domain and application operations should return `Result<T, E>` from `@/shared` rather than throwing unexpected exceptions.
5. **Run architectural checks**: Verify compliance with `npm run check:architecture`.

---

## 5. Architectural Automated Enforcement

Architectural rules are statically enforced via automated test suites in `tests/architecture/`:

- **Rule `MODULE_PUBLIC_ENTRY_ONLY`**: Rejects deep subpath imports into modules.
- **Rule `SHARED_PRIMITIVES_PURITY`**: Rejects shared code importing business modules or server code.
- **Rule `DOMAIN_ISOLATION`**: Rejects domain code importing application, server, or UI layers.
- **Rule `SERVER_ONLY_LEAKAGE`**: Rejects client or presentation components importing server-only infrastructure.
- **Rule `NO_CIRCULAR_DEPENDENCIES`**: Detects and fails on circular dependency cycles.
- **Negative Test Suite**: Synthetic violations run to prove the enforcement engine catches invalid architectures.

Run checks locally:
```bash
npm run check:architecture
# or full test suite
npm test
```
