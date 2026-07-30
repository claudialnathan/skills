export class UiPreshipError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.ruleId = options.ruleId ?? "UP006";
    this.remediation = options.remediation ?? "Correct the reported problem and rerun.";
    this.details = options.details ?? {};
  }
}

export class UsageError extends UiPreshipError {}
export class AssessmentError extends UiPreshipError {}
