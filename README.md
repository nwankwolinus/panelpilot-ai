# PanelPilot AI

## Project Overview

PanelPilot AI is an engineering-led platform for automating the end-to-end workflow in low-voltage (LV) electrical panel enquiries, deterministic engineering, component selection, vendor pricing, commercial calculations, and quotation generation. The system is designed as a TypeScript modular monolith ensuring engineering accountability, traceability, revision control, and reproducibility.

## Architecture Overview

The codebase is organized as a modular monolith with strict separation of responsibilities:

- **`src/app/`**: Next.js App Router for page composition, layouts, and routing.
- **`src/components/`**: Reusable, stateless UI presentation components.
- **`src/modules/`**: Autonomous business capability modules with internal `domain/`, `application/`, and public `contracts/`. Modules are accessed strictly through their public `index.ts` entry points.
- **`src/shared/`**: Cross-cutting domain and application primitives (`Result<T, E>`, `DomainError`, `ValueObject`, `IClock`).
- **`src/server/`**: Server-only infrastructure protected with `import "server-only"` and runtime guards.

Detailed conventions are documented in [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md).

## Prerequisites

- **Node.js**: v20+ LTS (Node.js 22+ or v24 recommended)
- **npm**: v10+

> **TLS / Environment Note**: If working behind an SSL-inspecting proxy or antivirus scanner (e.g. Norton Web/Mail Shield), enable OS CA store loading via `NODE_OPTIONS="--use-system-ca"` instead of disabling TLS verification.

## Installation Instructions

Install project dependencies using npm:

```bash
npm install
```

## Environment Setup

Create a local environment configuration file from the provided template:

```bash
cp .env.example .env.local
```

## Development Command

Start the local development server:

```bash
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

## Test Command

Run the automated test suite (including architectural boundary verification):

```bash
npm test
```

To run tests in watch mode during development:

```bash
npm run test:watch
```

To run architectural boundary checks independently:

```bash
npm run check:architecture
```

## Quality and Build Commands

Create an optimized production build:

```bash
npm run build
```

Run independent quality checks:

```bash
npm run type-check       # TypeScript compilation check (tsc --noEmit)
npm run lint             # ESLint code analysis
npm run format:check     # Prettier code formatting verification
```
