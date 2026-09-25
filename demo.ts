import { canTransitionRun, canRecordResult, runProgress, latestResultByRunCase, type ResultRow } from './src/execution.ts';
const cases = [
  { id: 'demo-login', title: 'Sign in with valid credentials' },
  { id: 'demo-reset', title: 'Request a password reset' },
  { id: 'demo-search', title: 'Search with no matches' },
];
const results: ResultRow[] = [
  { runCaseId: 'demo-login', sequence: 1, status: 'failed' },
  { runCaseId: 'demo-reset', sequence: 1, status: 'needs_review' },
  { runCaseId: 'demo-login', sequence: 2, status: 'passed' },
];
const progress = runProgress(cases.map(c => c.id), results);
const latest = latestResultByRunCase(results);
console.log('# QA Platform — synthetic execution demo\n');
console.log(`DRAFT → ACTIVE allowed: ${canTransitionRun('DRAFT', 'ACTIVE')}`);
console.log(`Recording results in CLOSED allowed: ${canRecordResult('CLOSED')}\n`);
console.log('| Test case | Latest result |');
console.log('| --- | --- |');
for (const c of cases) console.log(`| ${c.title} | ${latest.get(c.id)?.status ?? 'untested'} |`);
console.log(`\n${progress.executed}/${progress.total} cases have a recorded non-untested result. This is not a pass rate.`);
console.log('The failed login result remains in history; a later retest becomes the current result.');
console.log('No database, external account, network request, or real customer data is used.');
