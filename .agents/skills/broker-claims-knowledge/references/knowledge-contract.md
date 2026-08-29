# Knowledge proposal contract

Required provenance: non-empty `source`, `version`, `effectiveAt`, and `createdBy`.

The generated proposal has `kind: "knowledge"` and contains:

- `payload.documents[]`: `name`, `type`, `version`, `effectiveAt`, and verbatim `chunks`.
- Each chunk: stable `id`, `clause`, sequential `page`, and non-empty `content` up to 800 characters.
- `evidence.tests[]`: deterministic checks for metadata, content, duplicates, and supported format.
- `evidence.risks[]`: issues requiring a human decision. Any failed test blocks submission.

Importing is not approval. Approval is not activation.
