import type { Result } from "@/shared";

/**
 * Public Data Transfer Object (DTO) for external consumption.
 * Primitive, serializable types only.
 */
export interface ProjectRecordDto {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly createdAtIso: string;
}

export interface RegisterProjectCommand {
  readonly code: string;
  readonly name: string;
}

/**
 * Public service contract exposed by the Example module.
 */
export interface IExampleModuleService {
  registerProject(command: RegisterProjectCommand): Promise<Result<ProjectRecordDto, Error>>;
  getProjectById(id: string): Promise<Result<ProjectRecordDto, Error>>;
  listProjects(): Promise<Result<readonly ProjectRecordDto[], Error>>;
}
