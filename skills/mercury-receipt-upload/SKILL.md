---
name: mercury-receipt-upload
description: "Attach a receipt image to the matching Mercury transaction by extracting details from the image, finding the transaction, and uploading via the mercury CLI."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [transactions:read, transactions:write]
  requires: [mercury-shared]
---

# Mercury Receipt Upload

Attach a receipt image to the matching Mercury transaction. This skill extracts merchant, amount, and date from a receipt image, searches Mercury transactions to find the corresponding charge, confirms the match with the user, and uploads the file as an attachment via the `mercury` CLI.

Upload is irreversible: the skill **always** confirms the target transaction with the user before calling `mercury transactions attachments attach`.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `receiptPath` | (required) | Absolute path to the receipt file (PDF, PNG, JPG, GIF). |
| `transactionId` | (optional) | Skip matching and upload directly to this transaction ID. |
| `dateWindow` | ±3 days | Days of leeway around the receipt date when searching transactions. |
| `amountTolerance` | $0.00 (exact) | Allowed absolute difference between the receipt total and the transaction amount. Increase for restaurant/tip scenarios. |
| `accountId` | (optional) | Restrict the transaction search to a specific Mercury account. |

## Execution Strategy

### Step 1: Extract Receipt Details

Read the image and extract the fields needed for matching.

```
1. Open the receipt at receiptPath (Claude multimodal read).
2. Extract:
   - merchant        (string, e.g. "Blue Bottle Coffee")
   - totalAmount     (decimal USD, the final charged total)
   - transactionDate (YYYY-MM-DD)
   - last4           (optional, last 4 digits of the card if shown)
3. For any field with low extraction confidence, ASK the user. Do not guess.
4. Echo the extracted fields back to the user in a small table so they can
   catch OCR errors before the search runs.
5. Mask any card digits beyond the last 4, per mercury-shared.
```

### Step 2: Anchor Dates

```
1. Run `date +%Y-%m-%d` to get today's date.
2. searchStart = transactionDate - dateWindow
3. searchEnd   = min(transactionDate + dateWindow, today)
```

### Step 3: Query Transactions

```
mercury transactions list \
  --start <searchStart> \
  --end <searchEnd> \
  --status sent \
  [--account-id <accountId>] \
  --max-items -1 \
  --format jsonl
```

Default to `--status sent`. Pending transaction amounts frequently differ from the final posted amount and will mismatch the receipt total.

### Step 4: Score Candidates

```
candidates = []
FOR EACH txn IN transactions:
    # Amount match is required -- drop anything outside tolerance.
    IF abs(abs(txn.amount) - receipt.totalAmount) > amountTolerance:
        continue

    score = 0
    reasons = []

    # Amount exactness (weight: 0.4)
    IF abs(abs(txn.amount) - receipt.totalAmount) < 0.01:
        score += 0.4
        reasons.push("Amount matches exactly")

    # Date closeness (weight: 0.3 max, linear decay over dateWindow)
    daysApart = abs(daysBetween(txn.postedAt || txn.createdAt, receipt.transactionDate))
    score += 0.3 * max(0, 1 - daysApart / dateWindow)
    reasons.push("Posted {daysApart} day(s) from receipt date")

    # Merchant similarity (weight: 0.2)
    IF tokenOverlap(lower(txn.counterpartyName || txn.description), lower(receipt.merchant)) > 0:
        score += 0.2
        reasons.push("Counterparty '{txn.counterpartyName}' matches merchant")

    # Card last-4 (weight: 0.1, only if available)
    IF receipt.last4 AND txn.card?.last4 == receipt.last4:
        score += 0.1
        reasons.push("Card last-4 matches")

    candidates.push({ txn, score, reasons })

candidates.sortBy(score, descending)
```

### Step 5: Resolve to a Single Transaction

```
IF transactionId was provided:
    target = `mercury transactions get --transaction-id <transactionId> --format jsonl`
    go to Step 6.

IF len(candidates) == 0:
    Report: "No matching transaction found between {searchStart} and {searchEnd}
             for amount ${totalAmount} at merchant '{merchant}'."
    Ask the user to:
      - widen dateWindow, or
      - increase amountTolerance (e.g. if a tip was added), or
      - supply a transactionId directly.
    STOP.

IF len(candidates) == 1:
    target = candidates[0].txn
    go to Step 6.

IF len(candidates) > 1:
    Present the top candidates as a numbered list:
      | # | Score | Date | Counterparty | Amount | Card |
    Ask the user to pick one (or cancel).
    target = user's choice.
    go to Step 6.
```

### Step 6: Confirm Before Upload (ALWAYS)

Never skip this step, even for a single exact match. Upload is not reversible.

```
Show the user a side-by-side summary:

  Receipt                          Transaction
  -------                          -----------
  Merchant:  {receipt.merchant}    Counterparty: {target.counterpartyName}
  Amount:    ${receipt.total}      Amount:       ${abs(target.amount)}
  Date:      {receipt.date}        Posted:       {target.postedAt}
  Card:      ****{receipt.last4}   Card:         ****{target.card.last4}
  File:      {receiptPath}         Txn ID:       {target.id}

Prompt: "Upload this receipt to transaction {target.id}? (y/N)"

IF user does not explicitly confirm:
    STOP. Do not upload.
```

### Step 7: Upload

```
mercury transactions attachments attach \
  --transaction-id <target.id> \
  --file <receiptPath> \
  --attachment-type receipt \
  --format jsonl
```

The CLI's `--attachment-type` accepts `receipt`, `bill`, or `other`. Default to `receipt` for this workflow; only change it if the user asks.

On success, report the transaction ID and file name. On a non-zero exit, surface the CLI's error message to the user verbatim.

## Example Output

```
Extracted from /tmp/receipt-bluebottle.jpg:
  Merchant: Blue Bottle Coffee
  Amount:   $12.45
  Date:     2026-04-18
  Card:     ****4821

Searching transactions 2026-04-15 to 2026-04-21 (status=sent)...
Found 1 candidate:

  Receipt                          Transaction
  -------                          -----------
  Merchant:  Blue Bottle Coffee    Counterparty: BLUE BOTTLE COFFEE SF
  Amount:    $12.45                Amount:       $12.45
  Date:      2026-04-18            Posted:       2026-04-19
  Card:      ****4821              Card:         ****4821
  File:      /tmp/receipt-blue...  Txn ID:       a7c0...-3f1e

Upload this receipt to transaction a7c0...-3f1e? (y/N) y

Uploading...
Attached /tmp/receipt-bluebottle.jpg to transaction a7c0...-3f1e.
```

## Tips

- Default to `--status sent`. Pending amounts can differ from the final posted amount and will mismatch the receipt.
- Restaurants: the printed receipt total often excludes a handwritten tip. If no candidates match on amount, ask the user for the final charged total (with tip) before widening `amountTolerance`.
- Foreign currency: if the receipt total is not USD, surface that to the user rather than attempting conversion. The posted transaction will be in USD and will not match the printed foreign total.
- Never upload without explicit user confirmation. A single exact match is not sufficient reason to skip Step 6.
- If the user already knows the transaction ID, accept `transactionId` as input and skip matching entirely — still confirm before uploading.
