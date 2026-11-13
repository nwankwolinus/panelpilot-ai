import { ok, fail, type Result, type IClock, SystemClock } from "@/shared";
import { ProjectCode } from "../domain/project-code";
import { ProjectRecord } from "../domain/project-record";
import { ProjectNotFoundError } from "../domain/errors";
import type { IExampleModuleService, ProjectRecordDto, RegisterProjectCommand } from "../contracts";

/**
 * Internal application service implementation.
 * Encapsulates domain logic and mapping.
 */
export class ExampleModuleService implements IExampleModuleService {
  private readonly store: Map<string, ProjectRecord> = new Map();
  private readonly clock: IClock;

  constructor(clock: IClock = new SystemClock()) {
    this.clock = clock;
  }

  public async registerProject(
    command: RegisterProjectCommand
  ): Promise<Result<ProjectRecordDto, Error>> {
    try {
      const validatedCode = ProjectCode.create(command.code);
      const id = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = this.clock.now();

      const record = ProjectRecord.create({
        id,
        code: validatedCode,
        name: command.name.trim(),
        createdAt: now,
      });

      this.store.set(id, record);
      return ok(this.toDto(record));
    } catch (error) {
      return fail(error instanceof Error ? error : new Error(String(error)));
    }
  }

  public async getProjectById(id: string): Promise<Result<ProjectRecordDto, Error>> {
    const record = this.store.get(id);
    if (!record) {
      return fail(new ProjectNotFoundError(id));
    }
    return ok(this.toDto(record));
  }

  public async listProjects(): Promise<Result<readonly ProjectRecordDto[], Error>> {
    const list = Array.from(this.store.values()).map((r) => this.toDto(r));
    return ok(list);
  }

  private toDto(record: ProjectRecord): ProjectRecordDto {
    return {
      id: record.id,
      code: record.code.value,
      name: record.name,
      createdAtIso: record.createdAt.toISOString(),
    };
  }
}
