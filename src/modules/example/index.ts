/**
 * Example Module Public Entry Point.
 *
 * Architectural Rules:
 * 1. Outside code may ONLY import from this entry point (@/modules/example).
 * 2. Deep imports (e.g. @/modules/example/domain/...) are strictly prohibited.
 * 3. Only public contracts, DTOs, and the authorized service factory/instance are exposed.
 * 4. Internal domain models and repository mechanisms remain private to this module.
 */

import { ExampleModuleService } from "./application/example-service";
import type { IExampleModuleService } from "./contracts";

// Export public contracts and DTO types
export type { IExampleModuleService, ProjectRecordDto, RegisterProjectCommand } from "./contracts";

// Export service factory and default instance
export function createExampleModuleService(): IExampleModuleService {
  return new ExampleModuleService();
}

export const exampleModuleService: IExampleModuleService = new ExampleModuleService();
