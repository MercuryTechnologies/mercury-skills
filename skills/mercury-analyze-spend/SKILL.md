---
name: mercury-analyze-spend
version: 1.0.0
description: "Analyze spending patterns across accounts with parallel queries and categorized breakdowns."
category: agentic
scopes: [accounts:read, transactions:read]
requires:
  skills: [mercury-shared, mercury-accounts, mercury-transactions]
channels: [mcp, cli]
metadata:
  mcp_tools: [getAccounts, listTransactions]
---

# Mercury Analyze Spend

Analyze spending patterns across Mercury accounts with categorized breakdowns, counterparty grouping, and month-over-month comparisons. This skill orchestrates parallel queries across multiple accounts and aggregates results into a structured spend report.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `dateRange` | Last 30 days | Start and end dates for the analysis window |
| `accountFilter` | All accounts | List of specific account IDs to include |
| `categoryFilter` | All categories | Limit analysis to specific transaction categories |

## Execution Strategy

### Step 1: Determine Scope

Get all account IDs and calculate the date range for the analysis.

```
1. Call getCurrentDate to get today's date
2. Call getAccounts to retrieve all active accounts
3. Apply accountFilter if provided, otherwise use all active accounts
4. Calculate date range:
   - IF user specified a date range: use it
   - ELSE: start = today - 30 days, end = today
5. Store: accountIds[], startDate, endDate
```

### Step 2: Parallel Data Fetch

Retrieve transactions across accounts using batched parallel queries.

```
Given: accountIds[], startDate, endDate

IF len(accountIds) <= 3:
    # Query all accounts in parallel
    FOR EACH accountId IN accountIds (parallel):
        listTransactions(accountId, start=startDate, end=endDate, limit=300)

IF len(accountIds) > 3:
    # Batch into groups of 3
    batches = chunk(accountIds, 3)
    FOR EACH batch IN batches (sequential):
        FOR EACH accountId IN batch (parallel):
            listTransactions(accountId, start=startDate, end=endDate, limit=300)

# Handle large result sets
IF total transactions across all responses > 2000:
    # Reduce to 7-day windows and re-fetch
    windows = splitDateRange(startDate, endDate, windowSize=7)
    FOR EACH window IN windows:
        Re-fetch using window.start, window.end with same batching logic

# Paginate each response per mercury-shared rules
FOR EACH response:
    IF hasMorePages: paginate until complete
    IF truncated: reduce limit by 50% and retry
```

### Step 3: Analyze

Group and compute spend metrics from the collected transactions.

```
allTransactions = merge(all fetched transactions)

# Filter to outgoing transactions only (debit / negative amounts)
spending = allTransactions.filter(t => t.amount < 0)

# Apply categoryFilter if provided
IF categoryFilter:
    spending = spending.filter(t => categoryFilter.includes(t.category))

# Group by category + counterparty
groups = {}
FOR EACH txn IN spending:
    key = txn.category || "Uncategorized"
    groups[key].total += abs(txn.amount)
    groups[key].count += 1
    groups[key].counterparties[txn.counterpartyName].total += abs(txn.amount)
    groups[key].counterparties[txn.counterpartyName].count += 1

# Compute metrics per category
FOR EACH category IN groups:
    category.average = category.total / category.count
    category.percentOfSpend = category.total / totalSpend * 100

# Sort by total amount descending
sortedCategories = groups.sortBy(total, descending)

# Month-over-month comparison (if date range spans multiple months)
IF dateRange spans >= 2 months:
    FOR EACH category:
        currentMonth = sum of transactions in most recent month
        previousMonth = sum of transactions in prior month
        category.monthOverMonthChange = ((currentMonth - previousMonth) / previousMonth) * 100

# Flag significant increases
FOR EACH category:
    IF category.monthOverMonthChange > 20%:
        category.flagged = true
```

### Step 4: Present

Format the analysis into a clear, structured report.

```
1. Summary header:
   - Total spend for the period
   - Number of transactions analyzed
   - Date range covered
   - Number of accounts included

2. Top 10 categories by spend:
   | Rank | Category | Total | % of Spend | Avg Txn | Count |
   Show top counterparty per category inline

3. Month-over-month comparison (if available):
   | Category | Prior Month | Current Month | Change % | Flag |
   Highlight categories with >20% increase

4. Flagged categories:
   List any categories with >20% month-over-month increase
   Include context: top counterparties driving the increase
```

## Example Output

```
Spend Analysis: Feb 4, 2026 - Mar 6, 2026
Accounts: 2 | Transactions: 847 | Total Spend: $234,567.89

Top 10 Categories:
 1. Payroll          $125,000.00  (53.3%)  avg $62,500.00  x2
 2. Software         $32,450.00   (13.8%)  avg $1,622.50   x20
 3. Cloud Services   $28,900.00   (12.3%)  avg $9,633.33   x3
 4. Office Supplies  $12,340.00   (5.3%)   avg $617.00     x20
 5. Professional     $11,200.00   (4.8%)   avg $2,800.00   x4
 ...

Month-over-Month:
 Category         Jan          Feb         Change
 Software         $24,100.00   $32,450.00  +34.6%  !!
 Cloud Services   $27,500.00   $28,900.00  +5.1%

Flagged: Software spending increased 34.6% -- driven by
  new vendor "ToolCo" ($5,200.00) and increased usage of "Acme SaaS" ($3,150.00 vs $1,800.00).
```

## Tips

- Always call `getCurrentDate` first before calculating any date ranges.
- Handle pagination per mercury-shared rules -- never provide answers based on truncated or incomplete data.
- Use programmatic computation (reduce, map, sort) for all financial calculations per mercury-shared computational requirements.
- When accounts have high transaction volume, prefer narrower date windows over large single queries.
- Debit transactions (outgoing spend) have negative amounts in the Mercury API.
