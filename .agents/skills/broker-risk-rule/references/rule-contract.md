# Declarative risk-rule contract

Allowed metrics and units:

| Metric | Unit |
| --- | --- |
| `replacements30d` | count |
| `productConcentration` | ratio 0–1 |
| `commissionRatio` | ratio 0–1 |
| `refundRatio` | ratio 0–1 |
| `sharedAccountCount` | count |
| `complaints30d` | count |
| `afterHoursRatio` | ratio 0–1 |

Allowed operators are `>`, `>=`, `<`, `<=`, and `==`. Points must be an integer from 1 through 40. Ratio thresholds must be between 0 and 1; count thresholds must be non-negative integers.

Each proposal includes three tests: a value expected to hit, a value expected not to hit, and the exact threshold. The exact-threshold expectation follows the selected operator.
