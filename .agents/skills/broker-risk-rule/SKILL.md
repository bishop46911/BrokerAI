---
name: broker-risk-rule
description: Draft and test declarative intermediary risk-rule proposals for the Broker AI demo. Use when translating compliance policy into a metric, operator, threshold, score, and explanation. Do not write arbitrary executable rules or activate proposals.
---

# Broker Risk Rule

Convert a documented compliance concern into a reviewable declarative rule proposal.

## Workflow

1. Identify the policy rationale and confirm the metric is in the approved whitelist.
2. Choose only `>`, `>=`, `<`, `<=`, or `==`; use a numeric threshold and 1–40 points.
3. Run `scripts/draft_rule.mjs`. It creates hit, miss, and exact-threshold cases and records whether each behaves as intended.
4. Review false-positive risk, population impact, and explanation wording with the user.
5. Import only after authorization. Compliance approves; admin activates.

Read [references/rule-contract.md](references/rule-contract.md) for allowed metrics, units, and operator behavior.

## Safety invariants

- A rule flags a pattern for review; it never determines fraud.
- Do not use protected characteristics, free-form JavaScript, SQL, or model-generated predicates.
- Reject rules without a named rationale, boundary tests, or a clear evidence string.

## Command

```bash
node .agents/skills/broker-risk-rule/scripts/draft_rule.mjs \
  --name <name> --metric <metric> --operator '>=' --threshold <number> \
  --points <1-40> --rationale <text> --created-by <name> --output <proposal.json>
```
