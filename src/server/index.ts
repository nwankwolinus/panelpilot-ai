import "server-only";

/**
 * Server infrastructure root entry point.
 * Protected by Next.js 'server-only' package at compile-time and runtime assertion.
 *
 * Rules:
 * - May NOT be imported by client components ("use client") or presentation components (src/components).
 * - Houses technical infrastructure, server-only configuration, and future external provider adapters.
 */

export * from "./infrastructure/server-context";
