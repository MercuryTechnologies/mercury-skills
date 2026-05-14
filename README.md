# Mercury Skills Directory

Agent skills that drive the Mercury CLI. Each skill is a self-contained `SKILL.md` following the [Agent Skills](https://github.com/agentskills/agentskills) format ([spec](https://agentskills.io/specification)).

Some skills are designed to pair with the close-process slash commands in [`MercuryTechnologies/mercury-finance`](https://github.com/MercuryTechnologies/mercury-finance). They produce the Mercury side of a workpaper (cash reconciliation, journal-entry source data) so the matching finance command can do the NetSuite / Numeric half. Such skills carry a banner pointing back to the source command.

## Structure

```
skills/
  mercury-shared/SKILL.md                       # Auth, security, pagination, date handling
  mercury-analyze-spend/SKILL.md                # Categorized spend report
  mercury-detect-anomaly/SKILL.md               # Baseline + anomaly scoring
  mercury-receipt-upload/SKILL.md               # Match a receipt image to a transaction and attach it
  mercury-autocategorize-transactions/SKILL.md  # Suggest categories for uncategorized transactions
  mercury-journal-entry-prep/SKILL.md           # Source Data + Calculation + Journal Entry block for accounts-payable accrual / cash-reclassification entries
  mercury-cash-reconciliation/SKILL.md          # Mercury side of a cash General Ledger reconciliation workpaper
```

Each directory name matches the skill's `name` frontmatter field.

## Skills

| Skill | Category | What it does |
|-------|----------|--------------|
| `mercury-shared` | shared | CLI usage rules, auth, dates, pagination, money formatting |
| `mercury-analyze-spend` | agentic | Categorized breakdown + month-over-month for an account/date range |
| `mercury-detect-anomaly` | agentic | Builds 90d baselines and flags pattern breaks in a recent window |
| `mercury-receipt-upload` | agentic | Reads a receipt image, finds the matching transaction, attaches via CLI |
| `mercury-autocategorize-transactions` | agentic | Suggests categories from counterparty/merchant-type history, applies via CLI |
| `mercury-journal-entry-prep` | agentic | Source Data + Calculation + Journal Entry block for accounts-payable accrual or cash-reclassification entries sourced from Mercury transactions |
| `mercury-cash-reconciliation` | agentic | Produces the Mercury side of a cash General Ledger reconciliation for a given account + period |

All agentic skills depend on `mercury-shared` and use the `mercury` CLI (`../mercury-cli`) for every read and write.

## SKILL.md Format

```yaml
---
name: mercury-analyze-spend
description: "Analyze spending patterns across Mercury accounts."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [accounts:read, transactions:read]
  requires: [mercury-shared]
---

# Mercury Analyze Spend
...
```
