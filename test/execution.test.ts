import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QA_RUN_STATES } from '../src/types.ts';
import { canTransitionRun, canRecordResult, runProgress, latestPerCase, canonicalSelection, validateSelection, isHealthRunState, type CaseResultRow } from '../src/execution.ts';

test('run transitions match the full state matrix, including permanent cancellation', () => {
  const allowed = new Set(['DRAFT>ACTIVE','DRAFT>CANCELLED','ACTIVE>CLOSED','ACTIVE>CANCELLED','CLOSED>ACTIVE']);
  for (const from of QA_RUN_STATES) for (const to of QA_RUN_STATES)
    assert.equal(canTransitionRun(from,to), allowed.has(`${from}>${to}`), `${from}>${to}`);
});
test('only active runs accept results', () => {
  for (const state of QA_RUN_STATES) assert.equal(canRecordResult(state), state === 'ACTIVE');
});
test('a retest supersedes the earlier result without double-counting the case', () => {
  const history = [
    {runCaseId:'a',sequence:2,status:'passed' as const},
    {runCaseId:'a',sequence:1,status:'failed' as const},
  ];
  const before = structuredClone(history);
  const p = runProgress(['a','b'],history);
  assert.equal(p.total,2); assert.equal(p.executed,1);
  assert.equal(p.byStatus.passed,1); assert.equal(p.byStatus.failed,0); assert.equal(p.byStatus.untested,1);
  assert.deepEqual(history,before);
  assert.equal(Object.values(p.byStatus).reduce((a,b)=>a+b,0),p.total);
});
test('results outside the selected run do not inflate its totals', () => {
  const p = runProgress(['a'],[{runCaseId:'outside',sequence:1,status:'passed'}]);
  assert.equal(p.executed,0); assert.equal(p.byStatus.untested,1);
});
test('empty runs and explicitly untested results do not imply execution', () => {
  assert.equal(runProgress([],[]).total,0);
  assert.equal(runProgress(['a'],[{runCaseId:'a',sequence:1,status:'untested'}]).executed,0);
});
test('selection rejects empty and duplicate cases', () => {
  assert.equal(validateSelection([]).ok,false);
  assert.equal(validateSelection(['a','a']).ok,false);
  assert.equal(validateSelection(['a','b']).ok,true);
});
test('selection identity is independent of order and sensitive to revision', () => {
  const a=[{caseId:'b',revisionId:'r1'},{caseId:'a',revisionId:'r1'}];
  assert.equal(canonicalSelection(a),canonicalSelection([...a].reverse()));
  assert.notEqual(canonicalSelection(a),canonicalSelection([{caseId:'b',revisionId:'r2'},{caseId:'a',revisionId:'r1'}]));
});
const row=(patch:Partial<CaseResultRow>):CaseResultRow=>({caseId:'c',runCaseId:'rc1',runId:'run1',resultId:'r1',sequence:1,status:'failed',createdAt:new Date('2026-01-02T00:00:00Z'),...patch});
test('sequence wins within a run case even when the clock moves backward', () => {
  const latest=latestPerCase([row({}),row({sequence:2,status:'passed',createdAt:new Date('2026-01-01T00:00:00Z')})]);
  assert.equal(latest.get('c')?.status,'passed');
});
test('cross-run comparison uses only the latest sequence from each run case', () => {
  const rows=[row({}),row({sequence:2,status:'passed',createdAt:new Date('2026-01-01T00:00:00Z')}),row({runCaseId:'rc2',runId:'run2',status:'blocked',createdAt:new Date('2026-01-01T12:00:00Z')})];
  assert.equal(latestPerCase(rows).get('c')?.status,'blocked');
});
test('equal timestamps are resolved consistently by result ID', () => {
  const a=row({resultId:'r-a'}),b=row({runCaseId:'rc2',runId:'run2',resultId:'r-b',status:'passed'});
  assert.equal(latestPerCase([a,b]).get('c')?.resultId,'r-b');
  assert.equal(latestPerCase([b,a]).get('c')?.resultId,'r-b');
});
test('health metrics exclude draft and cancelled runs', () => {
  for (const state of QA_RUN_STATES) assert.equal(isHealthRunState(state),state==='ACTIVE'||state==='CLOSED');
});
