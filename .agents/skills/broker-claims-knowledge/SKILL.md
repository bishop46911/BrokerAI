---
name: broker-claims-knowledge
description: Prepare governed knowledge proposals from insurance policy and claims guidance files for the Broker AI demo. Use when onboarding, updating, versioning, or reviewing claims knowledge. Do not activate documents or make coverage decisions.
---

# Broker Claims Knowledge

Create an auditable knowledge proposal; never insert source material directly into the live corpus.

## Workflow

1. Confirm the document owner/source, version, effective date, and proposal creator. Stop if source or version is unknown.
2. Accept only TXT, Markdown, CSV, or JSON in this MVP. Do not imply that PDF/OCR is supported.
3. Run `scripts/prepare_knowledge.mjs` to normalize and chunk the source. Use an output path outside the source document.
4. Inspect warnings, provenance, duplicates, empty chunks, and generated clause labels.
5. Present the proposal and risks to the user. Import it into Governance Approvals only after the user authorizes that action.
6. A compliance reviewer must approve and an admin must activate it. The creator cannot self-approve.

Use [references/knowledge-contract.md](references/knowledge-contract.md) when checking required metadata or proposal contents.

## Safety invariants

- Preserve source wording in `content`; do not paraphrase quoted knowledge.
- Do not include real customer information, credentials, or payment data.
- Treat superseded and expired material as a blocking risk.
- Never state that a successful validation means the document is legally approved.

## Command

```bash
node .agents/skills/broker-claims-knowledge/scripts/prepare_knowledge.mjs \
  --input <document.txt> --source <owner-or-publication> --version <version> \
  --effective-at <YYYY-MM-DD> --created-by <name> --output <proposal.json>
```
