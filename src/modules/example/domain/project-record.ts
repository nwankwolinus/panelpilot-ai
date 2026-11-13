import type { ProjectCode } from "./project-code";

export interface ProjectRecordProps {
  readonly id: string;
  readonly code: ProjectCode;
  readonly name: string;
  readonly createdAt: Date;
}

/**
 * Domain entity representing an active project registration record.
 */
export class ProjectRecord {
  private constructor(private readonly props: ProjectRecordProps) {}

  public static create(props: ProjectRecordProps): ProjectRecord {
    return new ProjectRecord(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get code(): ProjectCode {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }
}
