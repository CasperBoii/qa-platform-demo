// The execution vocabulary selected from the original application's contracts.
export const QA_RESULT_STATUSES = ["passed", "failed", "needs_review", "waiting", "blocked", "untested"] as const;
export type QaResultStatus = (typeof QA_RESULT_STATUSES)[number];
export const QA_RUN_STATES = ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"] as const;
export type QaRunState = (typeof QA_RUN_STATES)[number];
