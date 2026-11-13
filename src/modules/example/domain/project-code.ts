import { ValueObject } from "@/shared";
import { InvalidProjectCodeError } from "./errors";

interface ProjectCodeProps {
  value: string;
}

const PROJECT_CODE_REGEX = /^PRJ-[A-Z0-9]{3,6}$/;

/**
 * Value Object representing a validated project identifier code.
 * Immutable and self-validating.
 */
export class ProjectCode extends ValueObject<ProjectCodeProps> {
  private constructor(props: ProjectCodeProps) {
    super(props);
  }

  public static create(rawCode: string): ProjectCode {
    const trimmed = rawCode.trim().toUpperCase();
    if (!PROJECT_CODE_REGEX.test(trimmed)) {
      throw new InvalidProjectCodeError(rawCode);
    }
    return new ProjectCode({ value: trimmed });
  }

  public get value(): string {
    return this.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}
