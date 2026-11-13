import type { Result } from "../domain/result";

/**
 * Universal interface for application use cases / command handlers.
 */
export interface UseCase<TInput, TOutput, TError = Error> {
  execute(input: TInput): Promise<Result<TOutput, TError>> | Result<TOutput, TError>;
}
