/**
 * Clock abstraction for reproducible time-based domain and application logic.
 */
export interface IClock {
  now(): Date;
  isoString(): string;
}

export class SystemClock implements IClock {
  public now(): Date {
    return new Date();
  }

  public isoString(): string {
    return new Date().toISOString();
  }
}
