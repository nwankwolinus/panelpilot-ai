/**
 * Server context guard.
 * Validates that execution occurs strictly within a server-side Node.js environment.
 */
export function assertServerContext(caller: string = "ServerOperation"): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `[CRITICAL ARCHITECTURAL VIOLATION] ${caller} was invoked in a client/browser environment. Server infrastructure must remain strictly server-side.`
    );
  }
}
