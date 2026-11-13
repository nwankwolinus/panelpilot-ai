// @vitest-environment node
import { describe, it, expect } from "vitest";
import { assertServerContext } from "@/server/infrastructure/server-context";

describe("Server Infrastructure Boundary", () => {
  it("allows execution when window is undefined (server environment)", () => {
    // In node environment, window is undefined
    expect(typeof window).toBe("undefined");
    expect(() => assertServerContext("ValidServerOperation")).not.toThrow();
  });

  it("throws a critical architectural violation error if executed in browser context", () => {
    // Simulate browser window
    try {
      // @ts-expect-error simulating browser window in test
      globalThis.window = {};

      expect(() => assertServerContext("LeakedOperation")).toThrowError(
        /\[CRITICAL ARCHITECTURAL VIOLATION\] LeakedOperation was invoked in a client\/browser environment/
      );
    } finally {
      // Restore undefined
      // @ts-expect-error cleaning simulated window
      delete globalThis.window;
    }
  });
});
