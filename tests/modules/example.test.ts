import { describe, it, expect } from "vitest";
import { createExampleModuleService, type IExampleModuleService } from "@/modules/example";
import { isOk, isFail } from "@/shared";

describe("Example Module (Architecture Skeleton)", () => {
  it("registers a project through the public module service with valid code", async () => {
    const service: IExampleModuleService = createExampleModuleService();

    const result = await service.registerProject({
      code: "PRJ-ENG01",
      name: "Main Distribution Switchboard",
    });

    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      expect(result.data.code).toBe("PRJ-ENG01");
      expect(result.data.name).toBe("Main Distribution Switchboard");
      expect(result.data.id).toMatch(/^rec_/);
      expect(result.data.createdAtIso).toBeDefined();
    }
  });

  it("fails registration with InvalidProjectCodeError when code format is violated", async () => {
    const service = createExampleModuleService();

    const result = await service.registerProject({
      code: "invalid-code",
      name: "Motor Control Center",
    });

    expect(isFail(result)).toBe(true);
    if (isFail(result)) {
      expect(result.error.message).toContain("Project code 'invalid-code' is invalid");
    }
  });

  it("retrieves a previously registered project by its ID", async () => {
    const service = createExampleModuleService();

    const createResult = await service.registerProject({
      code: "PRJ-SUB02",
      name: "Sub-Distribution Board",
    });
    expect(isOk(createResult)).toBe(true);
    if (!isOk(createResult)) return;

    const queryResult = await service.getProjectById(createResult.data.id);
    expect(isOk(queryResult)).toBe(true);
    if (isOk(queryResult)) {
      expect(queryResult.data.id).toBe(createResult.data.id);
      expect(queryResult.data.code).toBe("PRJ-SUB02");
    }
  });

  it("returns a failure Result when querying a non-existent project", async () => {
    const service = createExampleModuleService();

    const queryResult = await service.getProjectById("non-existent-id");
    expect(isFail(queryResult)).toBe(true);
    if (isFail(queryResult)) {
      expect(queryResult.error.message).toContain(
        "Project with ID 'non-existent-id' was not found"
      );
    }
  });
});
