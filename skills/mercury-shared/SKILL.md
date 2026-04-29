---
name: mercury-shared
description: "Shared rules for Mercury CLI skills: token-efficient format, pagination, date anchoring, and the debit-sign convention."
metadata:
  version: "1.0.0"
  category: shared
  scopes: []
  requires: []
---

# Mercury Shared Rules

The `mercury` CLI handles authentication on its own. If `MERCURY_API_KEY` is set in the environment, the CLI uses it as a bearer token; otherwise it falls back to the OAuth token saved by `mercury login`. Either way, skills never construct auth headers or pass `--api-key` themselves — just invoke `mercury <command>` and the CLI picks the right credential. To check current auth state, run `mercury status`. If a call fails with 401/403, tell the user to either export `MERCURY_API_KEY` or run `mercury login`; do not retry.

These rules cover the few things that aren't obvious from `mercury --help`.

## Use `--format jsonl` for reads

`jsonl` collapses the response onto a single line with no indentation whitespace — the cheapest format to load into context. Use it for every read this skill performs:

```bash
mercury accounts list --max-items -1 --format jsonl
mercury transactions list --start 2026-04-01 --end 2026-04-29 --status sent --max-items -1 --format jsonl
```

Pair it with `--transform` (GJSON syntax — see https://github.com/tidwall/gjson/blob/master/SYNTAX.md) when you only need a few fields:

```bash
# Just the fields needed for spend analysis
mercury transactions list --start 2026-04-01 --end 2026-04-29 --status sent \
  --max-items -1 --format jsonl \
  --transform 'transactions.#.{id,amount,counterpartyName,category,mercuryCategory,postedAt,createdAt}'
```

`--format json` is the colorized, pretty-printed version for humans — don't use it from a skill.

## Always pass `--max-items -1` for list commands

Without it, the CLI returns the first page only. `--max-items -1` paginates through every page in a single call. Never answer questions that need full data ("total spend", "all transactions", "most/least") from a partial result.

If a single call would still pull an unmanageable number of rows, narrow `--start`/`--end` or filter further (`--account-id`, `--category-id`, `--status`, `--search`) instead of accepting truncation.

## Anchor dates against today

LLMs hallucinate dates. Before computing any window, run:

```bash
date +%Y-%m-%d
```

…and derive `--start`/`--end` relative to that. Never hardcode today.

## Debit sign + amount formatting

- Mercury **debits (outgoing spend) are negative**; credits are positive. Use `abs(amount)` when comparing against receipt totals or summing spend.
- Amounts are decimals: `10.00` = $10.00. Preserve full precision; only round when displaying.
- Display amounts to users with `$` and two decimals (e.g. `$1,234.56`).

## Never echo raw card or account numbers

The CLI may return full account/card numbers in responses. When showing data back to the user, mask everything except the last 4 (`****4821`).
