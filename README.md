# Mercury Skills Directory

A centralized source of truth for agent-readable instructions that guide Mercury API consumption across multiple channels (MCP server, CLI, SDKs).

## Structure

```
skills/
  mercury-shared/SKILL.md        # Auth, security, pagination, date handling
  mercury-accounts/               # Service skill (hybrid: generated + enriched)
    _generated.md                 # Auto-generated from OpenAPI (overwritten)
    _enrichments.md               # Manual behavioral guidance (preserved)
    SKILL.md                      # Final merged output
  mercury-transactions/           # Same pattern for each service...
  mercury-analyze-spend/SKILL.md  # Agentic skill (manual)
  mercury-detect-anomaly/SKILL.md # Agentic skill (manual)
  ...
```

## Skill Categories

| Category | Source | Examples |
|----------|--------|----------|
| **Shared** | Manual | Auth, security rules, pagination, date handling |
| **Service** | Hybrid (generated + enriched) | accounts, transactions, recipients |
| **Helper** | Manual | balance-check, recent-activity, spending-summary |
| **Workflow** | Manual | monthly-close, vendor-payment, cash-flow-analysis |
| **Agentic** | Manual | analyze-spend, detect-anomaly |

## Usage

```bash
# Install dependencies
npm install

# Generate service skills from OpenAPI spec
npm run generate

# Build MCP bundle (dist/skills-bundle.json)
npm run build:mcp

# Build CLI instructions (dist/cli-instructions.md)
npm run build:cli

# Run all steps
npm run build
```

## Distribution

- **MCP Server**: `dist/skills-bundle.json` replaces hardcoded `SERVER_INSTRUCTIONS` and `toolDescriptionExtras`
- **CLI**: `dist/cli-instructions.md` consumed as `.claude/INSTRUCTIONS.md` in mercury-cli

## SKILL.md Format

Each skill file uses YAML frontmatter + markdown body:

```yaml
---
name: mercury-transactions
version: 1.0.0
description: "Query, filter, and manage transactions."
category: service
scopes: [transactions:read, transactions:write]
requires:
  skills: [mercury-shared]
channels: [mcp, cli]
metadata:
  mcp_tools: [listTransactions, getTransactionById]
---

# Transactions

## Usage
...
```
