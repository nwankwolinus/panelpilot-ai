# PanelPilot AI

## Project Overview

PanelPilot AI is an engineering-led platform for automating the end-to-end workflow in low-voltage (LV) electrical panel enquiries, deterministic engineering, component selection, vendor pricing, commercial calculations, and quotation generation. The architecture is designed as a TypeScript modular monolith ensuring engineering accountability, traceability, revision control, and reproducibility.

## Prerequisites

- **Node.js**: v20+ LTS (Node.js 22+ recommended)
- **npm**: v10+

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

Run the automated test suite:

```bash
npm test
```

To run tests in watch mode during development:

```bash
npm run test:watch
```

## Build Command

Create an optimized production build and verify type checking:

```bash
npm run build
```

To run type checking and linting independently:

```bash
npm run type-check
npm run lint
```
