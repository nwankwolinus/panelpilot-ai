import { DomainError } from "@/shared";

export class InvalidProjectCodeError extends DomainError {
  public readonly code = "EXAMPLE_INVALID_PROJECT_CODE";

  constructor(providedCode: string) {
    super(
      `Project code '${providedCode}' is invalid. It must follow the format 'PRJ-XXXX' where XXXX is 3-6 uppercase alphanumeric characters.`
    );
  }
}

export class ProjectNotFoundError extends DomainError {
  public readonly code = "EXAMPLE_PROJECT_NOT_FOUND";

  constructor(id: string) {
    super(`Project with ID '${id}' was not found.`);
  }
}
