---
name: mercury-analyze-spend
description: "Analyze spending patterns across Mercury accounts using the mercury CLI, with categorized breakdowns and month-over-month comparisons."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [accounts:read, transactions:read]
  requires: [mercury-shared]
---

# Mercury Analyze Spend

Analyze spending patterns across Mercury accounts with categorized breakdowns, counterparty grouping, and month-over-month comparisons. This skill orchestrates `mercury` CLI queries and aggregates the results into a structured spend report.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `dateRange` | Last 30 days | Start and end dates for the analysis window |
| `accountFilter` | All accounts | List of specific account IDs to include |
| `categoryFilter` | All categories | Limit analysis to specific transaction categories |

## Execution Strategy

### Step 1: Determine Scope

```
1. Run `date +%Y-%m-%d` to get today's date.
2. Run `mercury accounts list --max-items -1 --format jsonl` to get all accounts.
3. Apply accountFilter if provided, otherwise use every active account.
4. Calculate the date range:
   - IF user specified a range: use it.
   - ELSE: start = today - 30 days, end = today.
5. Store: accountIds[], startDate, endDate.
```

### Step 2: Fetch Transactions

`mercury transactions list` accepts repeated `--account-id` flags and `--max-items -1` to paginate fully.

```
mercury transactions list \
  --account-id <id1> [--account-id <id2> ...] \
  --start <startDate> \
  --end <endDate> \
  --status sent \
  --max-items -1 \
  --format jsonl
```

- Use `--status sent` so pending transactions (whose final amount may shift) are excluded from the totals.
- If the result set is very large (>2,000 rows), split the date range into 7-day windows and run one CLI call per window, then merge.

### Step 3: Analyze

Operate on the merged JSON programmatically (Python or jq):

```
allTransactions = merge(all responses)

# Outgoing spend only -- Mercury debits are negative.
spending = allTransactions.filter(t => t.amount < 0)

IF categoryFilter:
    spending = spending.filter(t => categoryFilter.includes(t.category))

# Group by category, then by counterparty within each category.
groups = {}
FOR EACH txn IN spending:
    key = txn.category || "Uncategorized"
    groups[key].total += abs(txn.amount)
    groups[key].count += 1
    cp = txn.counterpartyName || "Unknown"
    groups[key].counterparties[cp].total += abs(txn.amount)
    groups[key].counterparties[cp].count += 1

# Per-category metrics.
FOR EACH category IN groups:
    category.average = category.total / category.count
    category.percentOfSpend = category.total / totalSpend * 100

sortedCategories = groups.sortBy(total, descending)

# Month-over-month if range spans >= 2 months.
IF dateRange spans >= 2 months:
    FOR EACH category:
        currentMonth = sum(transactions in most recent month)
        previousMonth = sum(transactions in prior month)
        category.monthOverMonthChange = ((currentMonth - previousMonth) / previousMonth) * 100
        IF category.monthOverMonthChange > 20%:
            category.flagged = true
```

### Step 4: Present

```
1. Summary header:
   - Total spend for the period
   - Number of transactions analyzed
   - Date range covered
   - Number of accounts included

2. Top 10 categories by spend:
   | Rank | Category | Total | % of Spend | Avg Txn | Count |
   Show top counterparty per category inline.

3. Month-over-month comparison (if available):
   | Category | Prior Month | Current Month | Change % | Flag |
   Highlight categories with >20% increase.

4. Flagged categories:
   List any category with >20% month-over-month increase.
   Include the top counterparties driving the increase.
```

## Example Output

```
Spend Analysis: Mar 30, 2026 - Apr 29, 2026
Accounts: 2 | Transactions: 847 | Total Spend: $234,567.89

Top 10 Categories:
 1. Payroll          $125,000.00  (53.3%)  avg $62,500.00  x2
 2. Software         $32,450.00   (13.8%)  avg $1,622.50   x20
 3. Cloud Services   $28,900.00   (12.3%)  avg $9,633.33   x3
 4. Office Supplies  $12,340.00   (5.3%)   avg $617.00     x20
 5. Professional     $11,200.00   (4.8%)   avg $2,800.00   x4
 ...

Month-over-Month:
 Category         Mar          Apr         Change
 Software         $24,100.00   $32,450.00  +34.6%  !!
 Cloud Services   $27,500.00   $28,900.00  +5.1%

Flagged: Software spending increased 34.6% -- driven by
  new vendor "ToolCo" ($5,200.00) and increased usage of "Acme SaaS" ($3,150.00 vs $1,800.00).
```

## Tips

- For high-volume accounts, prefer narrower date windows over a single huge query — many small calls are cheaper than one truncated one.
- Use `--transform` to pull only the fields used downstream (`{id,amount,counterpartyName,category,postedAt}`) — saves a lot of tokens on large windows.
- Compute totals programmatically (reduce/map/sort); don't eyeball them.
