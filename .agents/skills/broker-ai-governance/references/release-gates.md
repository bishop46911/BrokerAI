# Release gates

Return `no-go` when any build gate fails, the target package is invalid, a required evaluation failed, or provenance is missing.

Return `conditional` when all automated gates pass but warnings, unresolved risks, or a missing optional evaluation remain.

Return `go` only when all automated gates pass, required proposal tests pass, provenance exists, and no unresolved risk remains. `go` is still subject to compliance approval and admin activation.

Required recorded gates:

- `npm test`
- `npm run typecheck`
- `npm run build`
- target proposal schema and evidence checks
