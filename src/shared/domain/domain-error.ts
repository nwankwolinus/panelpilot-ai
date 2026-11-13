/**
 * Base class for all domain errors across business modules.
 * Domain errors represent expected, model-level invalid states.
 */

export abstract class DomainError extends Error {
  public abstract readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
