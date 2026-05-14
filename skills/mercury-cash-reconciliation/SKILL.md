---
name: mercury-cash-reconciliation
description: "Produce the Mercury side of a cash General Ledger reconciliation for a given account and period, formatted to drop into a Mercury Reconciliation Workbook."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [accounts:read, transactions:read]
  requires: [mercury-shared]
---

# Mercury Cash Reconciliation

Pulls the Mercury side of a cash General Ledger (GL) reconciliation for a target Mercury account and accounting period. Produces a workpaper block formatted to match the standard Mercury Reconciliation Workbook — GL balance vs. Mercury balance, a reconciling-items table bucketed into timing / permanent / prior-period, tickmark legend, and sign-off line.

> Adapts `/recon cash` from the `MercuryTechnologies/mercury-finance` repo. The other half of the workpaper (NetSuite GL pull, Numeric sync, JE adjustments) lives there — this skill only produces the Mercury side.

This skill is **read-only by default**. The optional Step 7 (memo-tagging aged items) is the only write, and only fires after explicit user confirmation.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `accountId` | (required) | Mercury account to reconcile. If omitted, the skill lists accounts and asks. |
| `period` | Last closed month | Period to reconcile, as `YYYY-MM` (e.g. `2026-04`). |
| `priorOpenItems` | none | Optional path to a JSONL file or pasted list of items still outstanding from the prior period — used to age and resolve carry-forward items. |
| `outputDir` | `~/Downloads` | Where to save the reconciliation Markdown block and any downloaded statement PDF. |

## Execution Strategy

### Step 1: Anchor and resolve scope

```
1. Run `date +%Y-%m-%d` to get today's date.
2. IF period not provided:
       period = previous calendar month, format YYYY-MM
3. Compute:
   - periodStart = first day of period (YYYY-MM-01)
   - periodEnd   = last day of period (last calendar day)
4. Run `mercury accounts list --max-items -1 --format jsonl`.
5. IF accountId not provided:
       Show the user a numbered account list (name, kind, last4) and ask which to reconcile.
   ELSE:
       Confirm the account exists in the list. If not, stop and surface the error.
6. Capture the Mercury-reported `currentBalance` and `availableBalance` from the chosen account row.
```

### Step 2: Download the period statement (optional but recommended)

The statement PDF is the authoritative source for the bank-side closing balance Christine ties to.

```
mercury statements download --account-id <accountId> --period <YYYY-MM> --output <outputDir>/mercury-rec-<accountSlug>-<period>.pdf
```

> Verify exact flag names with `mercury statements download --help` before first use — `--period` and `--output` are the expected shape but flag names can drift. If `statements download` is not available in your CLI build, skip this step and tie to `currentBalance` from Step 1 instead.

If the PDF downloads, extract the printed closing balance and use it as the canonical Mercury-side balance. If it doesn't, fall back to Step 1's `currentBalance` and call this out in the workpaper notes.

### Step 3: Pull the period's transactions

```
mercury transactions list \
  --account-id <accountId> \
  --start <periodStart> --end <periodEnd> \
  --max-items -1 --format jsonl \
  --transform 'transactions.#.{id,amount,postedAt,createdAt,counterpartyName,status,note,kind}'
```

Note: this call deliberately omits `--status sent` — we need pending and in-transit items to surface reconciling differences. Filter by status in the analysis step instead.

### Step 4: Bucket reconciling items

```
posted    = transactions where status == "sent"
inTransit = transactions where createdAt in period AND (status != "sent" OR postedAt > periodEnd)
pending   = transactions where status in ("pending", "processing") AND createdAt in period

# Aged carry-forward
IF priorOpenItems supplied:
    FOR EACH prior IN priorOpenItems:
        IF prior.id IN posted (i.e. it cleared this period):
            mark prior as "cleared"
        ELSE:
            carryForward.push(prior with age + 1 month)
ELSE:
    carryForward = []  # ask user to supply prior workbook for full aging
```

### Step 5: Compute the reconciliation

```
mercuryBalance   = statement closing balance (Step 2) OR currentBalance (Step 1)
inTransitTotal   = sum(abs(t.amount) for t in inTransit, with sign preserved)
pendingTotal     = sum(abs(t.amount) for t in pending, with sign preserved)
carryForwardTotal = sum(carryForward amounts)

# Adjusted Mercury balance — what the GL should reconcile to.
adjustedMercury = mercuryBalance
                  + (debits in transit / pending that haven't yet hit the bank)
                  - (credits in transit / pending that haven't yet hit the bank)
                  + carryForwardTotal

# At this stage the user (or the corresponding /recon run in mercury-finance) supplies the GL balance.
# Difference = glBalance - adjustedMercury
# Any non-zero difference is a "permanent" reconciling item -- bank fees, missing entries, errors.
```

If the user hasn't supplied the GL balance, emit the workpaper with the GL row blank and a `[fill in from NetSuite]` placeholder.

### Step 6: Emit the workpaper block

Save to `<outputDir>/mercury-rec-<accountSlug>-<period>.md` and also print to the conversation.

```markdown
# Mercury Cash Reconciliation — <Account Name> (****<last4>)

**Entity:** <entity number from account, if available>
**GL Account:** [fill in from NetSuite]
**Period:** <period> (<periodStart> to <periodEnd>)
**Statement PDF:** <path or "not downloaded">
**Prepared by:** <user>  |  **Date:** <today>

## Balance summary

| Line | Amount |
|------|--------|
| GL closing balance | $[fill in] |
| Less: in-transit debits not yet posted | -$<amount> |
| Add: in-transit credits not yet posted | +$<amount> |
| Less: pending debits | -$<amount> |
| Add: pending credits | +$<amount> |
| Aged outstanding carryforward | +/-$<amount> |
| **Adjusted Mercury balance** | **$<adjustedMercury>** |
| Mercury statement closing balance | $<mercuryBalance> |
| **Difference (should be $0.00)** | **$<diff>** |

## Reconciling items

| # | Date | Counterparty | Amount | Category | Age (days) | Status | Action | Tickmark |
|---|------|--------------|--------|----------|------------|--------|--------|----------|
| 1 | ... | ...          | ...    | timing   | ...        | ...    | ...    | ✓        |
| 2 | ... | ...          | ...    | prior    | ...        | ...    | ...    | †        |
| 3 | ... | ...          | ...    | permanent| ...        | ...    | ...    | ^        |

**Tickmarks:** ✓ agreed to Mercury statement   ^ recalculated   † tied to prior period

## Sign-off

| | Name | Date |
|-|------|------|
| Preparer | | |
| Reviewer | | |
```

### Step 7 (optional, write): Tag aged carry-forward items

Only run if the user explicitly approves and there are carry-forward items aged 30+ days.

```
Prompt: "Tag {N} aged reconciling items with 'rec-aged-<period>' in their note field? (y/N)"

IF user confirms:
    FOR EACH item IN agedCarryForward:
        mercury transactions update \
          --transaction-id <item.id> \
          --note "rec-aged-<period> (carry forward {age} months)"
```

This is purely a marker so next month's run can pick the items up without re-typing them. Follow the `mercury-shared` write rules — one transaction at a time, surface errors per item, stop on 401/403.

## Example Output

```
Mercury Cash Reconciliation — Operating (****4821)
Entity: 11300   GL Account: [fill in from NetSuite]
Period: 2026-04 (2026-04-01 to 2026-04-30)
Statement PDF: ~/Downloads/mercury-rec-operating-2026-04.pdf
Prepared by: cobrien   Date: 2026-05-14

Balance summary:
  GL closing balance                                  $[fill in]
  Less: in-transit debits not yet posted              -$4,820.00
  Add:  in-transit credits not yet posted             +$0.00
  Less: pending debits                                -$1,247.50
  Add:  pending credits                               +$0.00
  Aged outstanding carryforward                       +$312.00
  Adjusted Mercury balance                            $1,247,503.21
  Mercury statement closing balance                   $1,253,258.71
  Difference                                          $0.00  ✓

Reconciling items:
  # | Date       | Counterparty       | Amount     | Category  | Age | Status   | Tickmark
  1 | 2026-04-29 | Vendor Wire Co     | -$4,820.00 | timing    |   1 | pending  | ✓
  2 | 2026-04-28 | SaaS Charge        | -$1,247.50 | timing    |   2 | pending  | ✓
  3 | 2026-02-15 | OldVendor LLC      | -$312.00   | prior     |  88 | open     | †
```

## Tips

- **Pull without `--status sent`** for this skill — pending and in-transit items are the whole point. The `mercury-shared` rule about defaulting to `sent` applies to spend-analysis skills, not reconciliation.
- The Mercury statement PDF's printed closing balance is what Christine ties to. If you can't download it, surface that clearly and tie to `currentBalance` with a note.
- If the GL balance isn't supplied, emit the workpaper with placeholders rather than skipping — Christine pastes the GL row in from `/recon` output on her side.
- For Broker Dealer / restricted-cash subaccounts, the entity number matters for the J-file. Confirm with the user which entity context the account belongs to before emitting the workpaper.
- Aged items 60+ days old should be flagged to the user verbally, not just included in the table — they may need an adjusting entry rather than another month of carry-forward.
