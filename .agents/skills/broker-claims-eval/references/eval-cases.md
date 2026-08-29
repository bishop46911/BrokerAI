# Claims evaluation cases

Input is a JSON array. Each case requires `id`, `question`, and `expectRefusal`.

Optional fields:

- `context`: case facts sent with the question.
- `expectedClause`: substring expected in at least one returned citation clause.
- `expectedEscalation`: whether `escalationReason` must be present.

Example:

```json
[
  {
    "id": "waiting-accident",
    "question": "意外住院是否受等待期限制？",
    "context": "保单已生效两周",
    "expectRefusal": false,
    "expectedClause": "等待期"
  },
  {
    "id": "unsupported-pet",
    "question": "宠物牙科清洁是否受保？",
    "expectRefusal": true
  }
]
```

Refusal means zero citations, low confidence, and a non-empty escalation reason. Citation precision means every returned quote is non-empty and linked to a chunk id; the server remains responsible for exact source validation.
