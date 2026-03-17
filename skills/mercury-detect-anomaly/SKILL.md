---
name: mercury-detect-anomaly
description: "Detect anomalous transactions by building spending baselines and flagging pattern breaks."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [accounts:read, transactions:read]
  requires: [mercury-shared, mercury-accounts, mercury-transactions]
  channels: [mcp, cli]
  mcp_tools: [getAccounts, listTransactions]
---

# Mercury Detect Anomaly

Detect anomalous transactions by building historical spending baselines and flagging pattern breaks. This skill analyzes transaction history to compute per-counterparty and per-category norms, then scores recent transactions against those baselines using a weighted anomaly model.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `analysisWindow` | Last 7 days | Time period for transactions to evaluate for anomalies |
| `baselinePeriod` | 90 days | Historical lookback period for building baselines |
| `scoreThreshold` | 0.5 | Minimum weighted score to flag a transaction as anomalous |

## Execution Strategy

### Step 1: Establish Baseline

Query historical transaction data and compute per-counterparty and per-category baselines.

```
1. Call getCurrentDate to get today's date
2. Call getAccounts to retrieve all active accounts
3. Calculate dates:
   - baselineStart = today - baselinePeriod (default: 90 days)
   - baselineEnd = today - analysisWindow (default: 7 days ago)
   - analysisStart = today - analysisWindow
   - analysisEnd = today
4. Store: accountIds[], baselineStart, baselineEnd, analysisStart, analysisEnd
```

### Step 2: Parallel Data Fetch

Retrieve both baseline and analysis window transactions using batched parallel queries.

```
Given: accountIds[], baselineStart, baselineEnd, analysisStart, analysisEnd

# Fetch baseline transactions
IF len(accountIds) <= 3:
    FOR EACH accountId IN accountIds (parallel):
        listTransactions(accountId, start=baselineStart, end=baselineEnd, limit=300)
ELSE:
    batches = chunk(accountIds, 3)
    FOR EACH batch IN batches (sequential):
        FOR EACH accountId IN batch (parallel):
            listTransactions(accountId, start=baselineStart, end=baselineEnd, limit=300)

# Handle large baselines
IF total baseline transactions > 2000:
    Re-fetch using 7-day windows with same batching logic

# Fetch analysis window transactions (same batching pattern)
FOR EACH accountId (parallel, batched by 3):
    listTransactions(accountId, start=analysisStart, end=analysisEnd, limit=300)

# Paginate all responses per mercury-shared rules
FOR EACH response:
    IF hasMorePages: paginate until complete
    IF truncated: reduce limit by 50% and retry
```

### Step 3: Score Anomalies

Build baselines from historical data, then score each transaction in the analysis window.

```
baselineTransactions = merge(all baseline responses)
analysisTransactions = merge(all analysis window responses)

# Build per-counterparty baseline
counterpartyBaseline = {}
FOR EACH txn IN baselineTransactions:
    cp = txn.counterpartyName
    counterpartyBaseline[cp].amounts.push(abs(txn.amount))
    counterpartyBaseline[cp].dates.push(txn.date)
    counterpartyBaseline[cp].count += 1

FOR EACH cp IN counterpartyBaseline:
    cp.avgAmount = mean(cp.amounts)
    cp.frequency = cp.count / baselinePeriodWeeks  # transactions per week
    cp.typicalDays = mode(cp.dates.map(d => dayOfWeek(d)))

# Build per-category baseline
categoryBaseline = {}
FOR EACH txn IN baselineTransactions:
    cat = txn.category || "Uncategorized"
    categoryBaseline[cat].amounts.push(abs(txn.amount))
    categoryBaseline[cat].count += 1

FOR EACH cat IN categoryBaseline:
    cat.avgAmount = mean(cat.amounts)

# Score each transaction in the analysis window
FOR EACH txn IN analysisTransactions:
    score = 0
    reasons = []
    cp = txn.counterpartyName
    cat = txn.category || "Uncategorized"
    txnAmount = abs(txn.amount)

    # 1. Amount anomaly (weight: 0.3)
    IF cp IN counterpartyBaseline:
        IF txnAmount > 3 * counterpartyBaseline[cp].avgAmount:
            score += 0.3
            reasons.push("Amount ${txnAmount} is {ratio}x the average ${cp.avgAmount} for {cp}")

    # 2. New counterparty (weight: 0.2)
    IF cp NOT IN counterpartyBaseline:
        score += 0.2
        reasons.push("First transaction with counterparty '{cp}'")

    # 3. Frequency spike (weight: 0.2)
    IF cp IN counterpartyBaseline:
        analysisWindowWeeks = analysisWindow / 7
        currentFrequency = count(analysisTransactions where counterparty == cp) / analysisWindowWeeks
        IF currentFrequency > 2 * counterpartyBaseline[cp].frequency:
            score += 0.2
            reasons.push("Frequency {currentFrequency}/week vs baseline {cp.frequency}/week")

    # 4. Category outlier (weight: 0.15)
    IF cat IN categoryBaseline:
        IF txnAmount > 2 * categoryBaseline[cat].avgAmount:
            score += 0.15
            reasons.push("Amount is {ratio}x the category average of ${cat.avgAmount}")

    # 5. Time anomaly (weight: 0.15)
    IF cp IN counterpartyBaseline:
        IF dayOfWeek(txn.date) NOT IN counterpartyBaseline[cp].typicalDays:
            score += 0.15
            reasons.push("Transaction on {day} -- typically occurs on {typicalDays}")

    txn.anomalyScore = score
    txn.anomalyReasons = reasons

# Filter to flagged transactions
flagged = analysisTransactions.filter(t => t.anomalyScore >= scoreThreshold)
flagged.sortBy(anomalyScore, descending)
```

### Step 4: Present

Format the anomaly report with context and baseline comparisons.

```
1. Summary header:
   - Analysis window and baseline period
   - Total transactions analyzed
   - Number of anomalies detected
   - Highest anomaly score

2. Ranked anomaly list:
   FOR EACH txn IN flagged (sorted by score descending):
       | Score | Date | Counterparty | Amount | Category |
       Reasons: bullet list of what triggered the flag
       Baseline context: historical average, frequency, typical timing

3. Anomaly breakdown by signal type:
   - Count of amount anomalies triggered
   - Count of new counterparties
   - Count of frequency spikes
   - Count of category outliers
   - Count of time anomalies
```

## Example Output

```
Anomaly Detection: Feb 27 - Mar 6, 2026
Baseline: Dec 7, 2025 - Feb 27, 2026 (90 days)
Transactions analyzed: 142 | Anomalies flagged: 4

Flagged Transactions:

1. Score: 0.65 | Mar 3 | "NewTech Solutions" | $18,500.00 | Software
   - First transaction with counterparty 'NewTech Solutions' (+0.2)
   - Amount is 3.2x the Software category average of $1,622.50 (+0.15)
   - Amount $18,500.00 is 4.1x the average for similar vendors (+0.3)

2. Score: 0.50 | Mar 5 | "AWS" | $28,900.00 | Cloud Services
   - Amount $28,900.00 is 3.4x the average $8,500.00 for AWS (+0.3)
   - Frequency 3/week vs baseline 0.8/week (+0.2)

3. Score: 0.50 | Mar 1 | "Office Depot" | $4,200.00 | Office Supplies
   - Amount is 2.8x the category average of $617.00 (+0.15)
   - Transaction on Saturday -- typically occurs on Mon, Wed (+0.15)
   - Frequency 4/week vs baseline 1.5/week (+0.2)

Signal Breakdown:
  Amount anomalies:    2
  New counterparties:  1
  Frequency spikes:    2
  Category outliers:   2
  Time anomalies:      1
```

## Tips

- Always call `getCurrentDate` first before calculating any date ranges.
- Handle pagination per mercury-shared rules -- never provide answers based on truncated or incomplete data.
- Use programmatic computation for all scoring and baseline calculations per mercury-shared computational requirements.
- A 90-day baseline gives reliable averages for most counterparties. For newer accounts with less history, note reduced baseline confidence in the output.
- Transactions with multiple anomaly signals are more likely to be genuinely anomalous -- prioritize those with the highest composite scores.
- Debit transactions (outgoing spend) have negative amounts in the Mercury API; use absolute values for comparisons.
