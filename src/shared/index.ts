/**
 * Shared primitives and abstractions.
 *
 * Rules:
 * - May NOT import from business modules (src/modules).
 * - May NOT import from server infrastructure (src/server).
 * - Must contain only cross-cutting domain and application primitives.
 */

export * from "./domain/result";
export * from "./domain/domain-error";
export * from "./domain/value-object";
export * from "./application/use-case";
export * from "./application/clock";
