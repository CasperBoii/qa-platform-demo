# Scope and review notes

## Selected from the original work

`src/execution.ts` is adapted from the platform's pure execution-domain module. The imported vocabulary is reduced to the statuses and run states needed by this example. Internal document references and implementation history are removed; two validation messages are translated into English.

The behavior of the extracted functions is retained. The English regression suite and CLI are portfolio-specific demonstrations. The demo data describes a fictional sign-in flow and is not an exported run.

## Boundaries

Inputs to the pure functions are assumed to have been validated by an application boundary. Run-case IDs are unique; result sequences are unique within a run case; timestamps are valid; case/revision identifiers are stable opaque IDs. These helpers are not an HTTP validation or authorization layer.

`latestPerCase` expects its caller to filter run scope and run state first. `isHealthRunState` supplies the demonstrated state rule. No UI, database, authentication, evidence storage, background worker, GitLab adapter, or MCP endpoint is included.

## Why these rules matter

1. Append-only results separate history from the latest displayed outcome.
2. Sequence ordering avoids trusting a clock for retests within the same run case.
3. Cross-run comparison uses only each run case's latest sequence before comparing time.
4. A stable ID resolves timestamp ties without depending on input order.
5. “Executed” means a recorded result other than `untested`; it is not “passed.”

## Data handling

Only explicitly selected source logic and newly created synthetic fixtures are included. No production configuration, internal domains, credentials, screenshots, customer data, database exports, transcripts, or original Git history are part of this repository.

## Visual illustration

`visual/index.html` is a standalone UI illustration made for this portfolio. It uses fictional cases and browser memory, with no backend or connection to the original application. The screenshots in `docs/images/` are captured from that file. The visual interactions communicate the selected domain rules; the TypeScript module remains the reviewed code extract.
