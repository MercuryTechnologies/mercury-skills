# Mercury Skills Directory

Agent skills that drive the Mercury CLI. Each skill is a self-contained `SKILL.md` following the [Agent Skills](https://github.com/agentskills/agentskills) format ([spec](https://agentskills.io/specification)).

## Prerequisites

- The **[`mercury` CLI](https://github.com/MercuryTechnologies/mercury-cli)** on your `PATH`. Every agentic skill shells out to it for reads and writes.
- **Authentication.** The CLI handles auth itself: set `MERCURY_API_KEY` in your environment, or run `mercury login` to use a saved OAuth token. Check the current state with `mercury status`. Skills never construct auth headers themselves.

## Install

### With `npx` (recommended)

Install the skills from this repo into your agent's skills directory:

```bash
npx skills add git@github.com:MercuryTechnologies/mercury-skills.git
```

This pulls every `SKILL.md` and drops it in the right place for your agent to discover.

### Manual

Clone the repo and copy (or symlink) the skill directories into your skills folder — `~/.claude/skills/` for all projects, or `<project>/.claude/skills/` for a single project:

```bash
git clone git@github.com:MercuryTechnologies/mercury-skills.git
cp -R mercury-skills/skills/* ~/.claude/skills/
```

Keep `mercury-shared` alongside the others — every agentic skill depends on it.

## Structure

```
skills/
  mercury-shared/SKILL.md                       # Auth, security, pagination, date handling
  mercury-analyze-spend/SKILL.md                # Categorized spend report
  mercury-detect-anomaly/SKILL.md               # Baseline + anomaly scoring
  mercury-receipt-upload/SKILL.md               # Match a receipt image to a transaction and attach it
  mercury-autocategorize-transactions/SKILL.md  # Suggest categories for uncategorized transactions
  mercury-receipt-finder/SKILL.md               # Find missing receipts in Photos & Gmail, then upload
  mercury-journal-entry-prep/SKILL.md           # Source Data + Calculation + Journal Entry block for accounts-payable accrual / cash-reclassification entries
  mercury-cash-reconciliation/SKILL.md          # Mercury side of a cash General Ledger reconciliation workpaper
  mercury-onboarding-apply/SKILL.md             # Generate, fill, and submit a Mercury onboarding application via the CLI
```

Each directory name matches the skill's `name` frontmatter field.

## Skills

| Skill | Category | What it does |
|-------|----------|--------------|
| `mercury-shared` | shared | CLI usage rules, auth, dates, pagination, money formatting |
| `mercury-analyze-spend` | agentic | Categorized breakdown + month-over-month for an account/date range |
| `mercury-detect-anomaly` | agentic | Builds 90-day baselines and flags pattern breaks in a recent window |
| `mercury-receipt-upload` | agentic | Reads a receipt image, finds the matching transaction, attaches via CLI |
| `mercury-autocategorize-transactions` | agentic | Suggests categories from counterparty/merchant-type history, applies via CLI |
| `mercury-receipt-finder` | agentic | Finds transactions missing receipts, searches macOS Photos and Gmail for matches, uploads via CLI |
| `mercury-journal-entry-prep` | agentic | Source Data + Calculation + Journal Entry block for accounts-payable accrual or cash-reclassification entries sourced from Mercury transactions |
| `mercury-cash-reconciliation` | agentic | Produces the Mercury side of a cash General Ledger reconciliation for a given account + period |
| `mercury-onboarding-apply` | agentic | Generates a blank application template, fills it with user-supplied KYC details, confirms, and submits via CLI |

All agentic skills depend on `mercury-shared` and use the `mercury` CLI for every read and write.

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
