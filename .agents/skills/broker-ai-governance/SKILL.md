---
name: broker-ai-governance
description: Review Broker AI knowledge, risk-rule, prompt, or model changes and produce a release-readiness proposal with test, typecheck, build, provenance, and risk evidence. Use for governance or release review; do not deploy, approve, or activate changes.
---

# Broker Ai Governance

Create an evidence-backed release recommendation without taking the approval decision.

## Workflow

1. Confirm the target proposal exists and is still a draft or submitted proposal.
2. Review provenance, validation warnings, evaluation evidence, and unresolved risks.
3. Run `scripts/review_release.mjs`; it executes the project's tests, typecheck, and production build.
4. Use [references/release-gates.md](references/release-gates.md) to classify the result as `go`, `conditional`, or `no-go`.
5. Present failures and residual risks prominently. Import the release proposal only after explicit authorization.

## Boundaries

- Never edit `.env`, credentials, model keys, or deployment settings.
- Never deploy, approve, or activate a proposal.
- A `go` recommendation is evidence for a human reviewer, not an authorization.
- Stop after one failed gate run unless the user requests a fix or retry.

## Command

```bash
node .agents/skills/broker-ai-governance/scripts/review_release.mjs \
  --project . --target <proposal.json> --created-by <name> \
  --output <release-proposal.json>
```
