---
name: mercury-autocategorize-transactions
description: "Suggest expense categories for uncategorized Mercury transactions based on counterparty, description, and Mercury merchant type, then apply via the mercury CLI."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [transactions:read, transactions:write, categories:read]
  requires: [mercury-shared]
---

# Mercury Autocategorize Transactions

Suggest expense categories for uncategorized Mercury transactions based on each transaction's counterparty, description, and Mercury-assigned merchant type. The skill batches the suggestions into a single review table, lets the user approve or edit, then applies the chosen categories with `mercury transactions update`.

Updates are written one transaction at a time and **always** require user confirmation before any write.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `dateRange` | Last 30 days | Window of transactions to evaluate. |
| `accountFilter` | All accounts | List of specific account IDs to include. |
| `onlyUncategorized` | true | If true, skip transactions that already have a category. Set false to suggest re-categorization. |
| `confidenceThreshold` | 0.6 | Suggestions below this confidence are flagged "Needs review" rather than auto-applied. |

## Execution Strategy

### Step 1: Load Categories and Recent History

```
1. Run `date +%Y-%m-%d` to get today's date.
2. Run `mercury categories list --max-items -1 --format jsonl`
   to get the organization's full list of expense categories.
   Each category has: id, name, optional description.
3. (Optional but recommended) Pull a 90-day window of already-categorized
   transactions to learn which counterparty -> category mappings the
   organization uses today:

   mercury transactions list \
     --start <today - 90 days> --end <today> \
     --status sent \
     --max-items -1 --format jsonl

   Build counterpartyHistory[counterpartyName] = mode(category)
   so suggestions follow the org's actual conventions instead of
   guessing from the category name alone.
```

### Step 2: Fetch Target Transactions

```
mercury transactions list \
  [--account-id <id> ...] \
  --start <dateRange.start> --end <dateRange.end> \
  --status sent \
  --max-items -1 --format jsonl

IF onlyUncategorized:
    target = transactions where category is null/empty
ELSE:
    target = all transactions in the window
```

Use `--status sent` so we don't categorize a pending transaction that may later post with different details.

### Step 3: Suggest a Category Per Transaction

For each target transaction, compute a suggested categoryId and a confidence score in [0, 1] from the strongest signal available, in this priority order:

```
1. counterpartyHistory match (confidence: 0.9)
   IF txn.counterpartyName IN counterpartyHistory:
       suggestion = counterpartyHistory[txn.counterpartyName]
       reason = "Org has previously categorized {N} transactions
                 from '{counterpartyName}' as '{category}'"

2. mercuryCategory mapping (confidence: 0.75)
   Mercury assigns a `mercuryCategory` (merchant type) to most card
   transactions. Map common values to the closest org category by name
   match -- e.g. "Software" -> Software, "Restaurants" -> Meals,
   "RideShare" -> Travel. If the mapping is exact, use it.

3. Counterparty name keyword match (confidence: 0.6)
   Match the lowercased counterpartyName / description against category
   names and known keywords:
     "aws", "gcp", "azure"          -> Cloud Services
     "github", "linear", "figma"    -> Software
     "uber", "lyft", "delta"        -> Travel
     "doordash", "blue bottle"      -> Meals
     "stripe payout"                -> Revenue (income)
     "gusto", "rippling"            -> Payroll
   Build this list from the actual category list returned in Step 1 --
   never invent a category name that isn't in the org's list.

4. No confident signal (confidence: < 0.6)
   suggestion = null
   reason = "No confident match -- needs manual review"
```

Important: every `suggestion.categoryId` must come from the categories list returned in Step 1. Never invent a category.

### Step 4: Present a Review Table

```
| # | Date | Counterparty | Amount | Mercury Type | Suggested Category | Confidence | Reason |

Sort by confidence descending, with "Needs review" rows last.

Summary line:
  "{N} transactions to categorize. {auto} ready to apply ({threshold}+ confidence),
   {review} need review."
```

### Step 5: Confirm Before Writing (ALWAYS)

Writes happen one row at a time and only after the user explicitly approves the batch (or hand-edits rows). Never auto-apply without confirmation.

```
Prompt the user with three options:
  1. Apply all "ready" rows as suggested
  2. Apply a subset (user picks row numbers)
  3. Edit one row -- user supplies a different categoryId or
     types a category name; resolve it against the Step 1 list.

IF user does not explicitly approve:
    STOP. Do not write.
```

### Step 6: Apply Updates

```
FOR EACH approved row:
    mercury transactions update \
      --transaction-id <txn.id> \
      --category-id <suggestion.categoryId>

    Capture exit status. On error, follow mercury-shared error handling
    (retry transients up to 2x, surface 400s verbatim, stop on 401/403).
```

After the loop, print a summary:
```
Updated {applied} transactions. {failed} failed -- see errors above.
```

## Example Output

```
Categorizing transactions Mar 30 - Apr 29, 2026 (1 account, status=sent)
Loaded 18 categories. Built history from 612 already-categorized transactions.

Found 14 uncategorized transactions:

| # | Date       | Counterparty           | Amount    | Mercury Type | Suggested      | Conf  | Reason                                         |
|---|------------|------------------------|-----------|--------------|----------------|-------|------------------------------------------------|
| 1 | 2026-04-02 | AWS                    | -$8,432.00| CloudServices| Cloud Services | 0.92  | Org has 23 prior 'AWS' txns as Cloud Services  |
| 2 | 2026-04-04 | GitHub                 |   -$84.00 | Software     | Software       | 0.91  | Org has 11 prior 'GitHub' txns as Software     |
| 3 | 2026-04-09 | Uber                   |   -$28.40 | RideShare    | Travel         | 0.75  | Mercury merchant type maps to Travel           |
| 4 | 2026-04-12 | Blue Bottle Coffee     |   -$12.45 | Restaurants  | Meals          | 0.75  | Mercury merchant type maps to Meals            |
| 5 | 2026-04-18 | NewTech Solutions      |-$18,500.00| (none)       | --             | <0.6  | No confident match -- needs manual review      |
...

12 ready to apply (>=0.6 confidence), 2 need review.

Apply all ready rows? (a)pply / (s)ubset / (e)dit / (c)ancel: a
Updating...
  #1 AWS                  -> Cloud Services    OK
  #2 GitHub               -> Software          OK
  ...
Updated 12 transactions. 0 failed.
2 still need review (#5, #11) -- ask the user how to categorize them.
```

## Tips

- Only use category IDs that appear in `mercury categories list` output. Fabricating a category name will fail with a 400.
- Counterparty history is the strongest signal — when an org has consistently coded a vendor, repeat their decision instead of guessing from the name.
- Use `--transform 'transactions.#.{id,amount,counterpartyName,category,categoryId,mercuryCategory,description,postedAt}'` on the history pull to keep the 90-day window small in context.
- `mercury transactions update` accepts only `--category-id` and `--note`. To clear a category later, send `null` per the CLI's `--help`.
- The Mercury debit/credit sign convention does not affect categorization, but exclude inflows (positive amounts) from the suggestion set unless the org categorizes income too.
- Never apply a write without explicit user approval — this is the same rule as `mercury-receipt-upload`.
