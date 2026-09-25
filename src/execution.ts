// Adapted execution-domain extract. See docs/scope.md for provenance and boundaries.
import { QA_RESULT_STATUSES, type QaResultStatus, type QaRunState } from "./types.ts";

const RUN_TRANSITIONS: Readonly<Record<QaRunState, ReadonlyArray<QaRunState>>> = {
  DRAFT: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["CLOSED", "CANCELLED"],
  CLOSED: ["ACTIVE"],
  CANCELLED: [],
};

export function canTransitionRun(from: QaRunState, to: QaRunState): boolean {
  return RUN_TRANSITIONS[from].includes(to);
}

export const canRecordResult = (state: QaRunState): boolean => state === "ACTIVE";

export interface ResultRow {
  readonly runCaseId: string;
  readonly sequence: number;
  readonly status: QaResultStatus;
}

export function latestResultByRunCase(results: ReadonlyArray<ResultRow>): Map<string, ResultRow> {
  const latest = new Map<string, ResultRow>();
  for (const row of results) {
    const seen = latest.get(row.runCaseId);
    if (!seen || row.sequence > seen.sequence) latest.set(row.runCaseId, row);
  }
  return latest;
}

export interface RunProgress {
  readonly total: number;
  readonly executed: number;
  readonly byStatus: Readonly<Record<QaResultStatus, number>>;
}

// Missing results remain untested. Only supplied run-case IDs contribute to totals.
export function runProgress(runCaseIds: ReadonlyArray<string>, results: ReadonlyArray<ResultRow>): RunProgress {
  const latest = latestResultByRunCase(results);
  const byStatus = Object.fromEntries(QA_RESULT_STATUSES.map((s) => [s, 0])) as Record<QaResultStatus, number>;
  let executed = 0;
  for (const id of runCaseIds) {
    const hit = latest.get(id);
    if (!hit || hit.status === "untested") {
      byStatus.untested += 1;
      continue;
    }
    byStatus[hit.status] += 1;
    executed += 1;
  }
  return { total: runCaseIds.length, executed, byStatus };
}

export interface SelectionEntry {
  readonly caseId: string;
  readonly revisionId: string;
}

export function canonicalSelection(entries: ReadonlyArray<SelectionEntry>): string {
  const sorted = [...entries].sort((a, b) => (a.caseId < b.caseId ? -1 : a.caseId > b.caseId ? 1 : 0));
  return sorted.map((e) => `${e.caseId}:${e.revisionId}`).join("\n");
}

export function validateSelection(caseIds: ReadonlyArray<string>): { ok: true } | { ok: false; message: string } {
  if (!caseIds.length) return { ok: false, message: "Select at least one test case." };
  if (new Set(caseIds).size !== caseIds.length) return { ok: false, message: "Duplicate test cases are not allowed." };
  return { ok: true };
}

export type ExecutionScope = { readonly kind: "latest" } | { readonly kind: "run"; readonly runId: string };

export const HEALTH_RUN_STATES: ReadonlyArray<QaRunState> = ["ACTIVE", "CLOSED"];
export const isHealthRunState = (state: QaRunState): boolean => HEALTH_RUN_STATES.includes(state);

export type CaseExecutionStatus = QaResultStatus | "not_in_run";

export interface CaseResultRow extends ResultRow {
  readonly caseId: string;
  readonly runId: string;
  readonly resultId: string;
  readonly createdAt: Date;
}

// Filter run state/scope before calling. Sequence wins within a run case; time wins across runs.
export function latestPerCase(rows: ReadonlyArray<CaseResultRow>): Map<string, CaseResultRow> {
  const perRunCase = new Map<string, CaseResultRow>();
  for (const row of rows) {
    const seen = perRunCase.get(row.runCaseId);
    if (!seen || row.sequence > seen.sequence) perRunCase.set(row.runCaseId, row);
  }
  const perCase = new Map<string, CaseResultRow>();
  for (const row of perRunCase.values()) {
    const seen = perCase.get(row.caseId);
    if (!seen || compareLatest(row, seen) > 0) perCase.set(row.caseId, row);
  }
  return perCase;
}

export function compareLatest(a: Pick<CaseResultRow, "createdAt" | "resultId">, b: Pick<CaseResultRow, "createdAt" | "resultId">): number {
  const dt = a.createdAt.getTime() - b.createdAt.getTime();
  if (dt !== 0) return dt;
  return a.resultId < b.resultId ? -1 : a.resultId > b.resultId ? 1 : 0;
}
