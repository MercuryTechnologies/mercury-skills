---
name: mercury-journal-entry-prep
description: "Produce the Source Data + Calculation + Journal Entry block for an Accounts Payable accrual or cash-reclassification entry sourced from Mercury transactions, ready to paste into a NetSuite Journal Entry import template."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [accounts:read, transactions:read]
  requires: [mercury-shared]
---

# Mercury Journal Entry Prep

Pulls Mercury transaction detail for a target period and emits a Journal Entry (JE) workpaper draft in the standard three-block structure used in the close process — Source Data | Calculation | Journal Entry — ready to paste into a NetSuite JE import template.

Supports two entry types where the source data lives in Mercury:

- **`ap-accrual`** (Accounts Payable accrual) — outgoing payments in the period that don't yet have an invoice or receipt attached. The accrual recognizes the expense even though the invoice hasn't been received.
- **`cash-reclass`** — internal transfers and sweeps between Mercury accounts that need to be reclassified between cash sub-accounts on the General Ledger (GL).

> This skill produces only the Mercury-sourced data blocks. NetSuite import, approval routing, and posting stay in your finance close process and are handled by the user.

This skill is **read-only by default**. The optional Step 7 (memo-tagging accrued transactions so they aren't double-counted next month) is the only write, and only fires after explicit user confirmation.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `entryType` | (required) | One of `ap-accrual`, `cash-reclass`. |
| `period` | Last closed month | Period for the JE, as `YYYY-MM`. |
| `accountFilter` | All accounts | Optional list of Mercury account IDs to scope to. |
| `glMappingPath` | `./gl-mapping.jsonl` | Path to a JSONL file mapping `mercuryCategory` to NetSuite GL account. See "GL mapping file" below. |
| `outputDir` | `~/Downloads` | Where to write the assembled workpaper Markdown. |

## GL Mapping File

The skill expects a JSONL file with one row per mapping. Each row:

```json
{"mercuryCategory": "Software", "glAccount": "60410", "department": "31000", "memo": "SaaS"}
{"mercuryCategory": "Travel",   "glAccount": "60520", "department": "22000", "memo": "Travel"}
{"mercuryCategory": "Cloud Services", "glAccount": "60420", "department": "31000", "memo": "Hosting"}
```

- `mercuryCategory` (required) — the Mercury category string exactly as it appears in `transactions.category`.
- `glAccount` (required) — NetSuite GL account number, as a string.
- `department` (optional) — cost center / department code. Falls through to a placeholder if not supplied.
- `memo` (optional) — memo prefix; otherwise the skill defaults to `"<entryType> accrual <period>"` style.

If the mapping file is missing, the skill emits placeholders (`[GL?]`, `[DEPT?]`) and a "needs mapping" call-out at the top of the workpaper.

## Execution Strategy

### Step 1: Anchor and resolve scope

```
1. Run `date +%Y-%m-%d` to get today's date.
2. IF period not provided:
       period = previous calendar month, format YYYY-MM
3. Compute:
   - periodStart = first day of period
   - periodEnd   = last day of period
4. Run `mercury accounts list --max-items -1 --format jsonl`.
   IF accountFilter provided: restrict to those IDs.
5. Load GL mapping file. IF missing, set glMapping = {} and continue with placeholders.
```

### Step 2: Fetch transactions

```
mercury transactions list \
  [--account-id <id> ...] \
  --start <periodStart> --end <periodEnd> \
  --status sent \
  --max-items -1 --format jsonl \
  --transform 'transactions.#.{id,amount,postedAt,createdAt,counterpartyName,category,mercuryCategory,note,kind,counterpartyId}'
```

Use `--status sent` here — JEs are based on what actually posted. Pending items get accrued the *following* month if still pending at period end.

### Step 3a: Build the source set — `ap-accrual`

```
candidates = transactions where amount < 0   # debits only

# Drop transactions that already have an attachment (invoice/receipt on file).
# Mercury's transaction-list output may not include attachment counts; if it
# doesn't, run `mercury transactions get --transaction-id <id> --format jsonl`
# per candidate and inspect `attachments`.
FOR EACH txn IN candidates:
    full = mercury transactions get --transaction-id <txn.id> --format jsonl
    IF len(full.attachments) > 0:
        skip
    ELSE:
        accrualSet.push(txn)

# Aggregate by counterparty + Mercury category so each unique (vendor, category)
# pair becomes one row in the JE.
groups = {}
FOR EACH txn IN accrualSet:
    key = (txn.counterpartyName, txn.category || "Uncategorized")
    groups[key].total += abs(txn.amount)
    groups[key].count += 1
    groups[key].txnIds.push(txn.id)
```

### Step 3b: Build the source set — `cash-reclass`

```
# Internal transfers show up with both legs in the period. Detect them by
# `kind == "internalTransfer"` if present, otherwise by counterparty being
# another Mercury account in the user's org.
internalAccountIds = set(accounts.id for accounts in (step 1 account list))

transferLegs = []
FOR EACH txn IN transactions:
    IF txn.kind == "internalTransfer":
        transferLegs.push(txn)
    ELIF txn.counterpartyId IN internalAccountIds:
        transferLegs.push(txn)

# Each transfer has two legs (one debit, one credit). Pair them by (amount, date).
pairs = pairLegsByAmountAndDate(transferLegs)
```

### Step 4: Map to GL accounts

```
FOR EACH group IN groups (ap-accrual) OR pair IN pairs (cash-reclass):
    mapping = glMapping[group.category] OR glMapping[pair.fromAccount]
    IF mapping found:
        group.glAccount = mapping.glAccount
        group.department = mapping.department || "[DEPT?]"
        group.memoPrefix = mapping.memo || "<entryType> <period>"
    ELSE:
        group.glAccount = "[GL?]"
        group.department = "[DEPT?]"
        group.memoPrefix = "<entryType> <period>"
        unmappedCategories.push(group.category)
```

### Step 5: Compose the workpaper

Save to `<outputDir>/mercury-je-<entryType>-<period>.md` and print to the conversation.

**ap-accrual layout:**

```markdown
# Journal Entry: AP Accrual — <period>

**Type:** AP Accrual
**Period:** <period>
**Prepared:** <today> by <user>

<!-- if any categories were unmapped, list them here as a fix-before-posting block -->

## Source Data

| Txn ID | Date | Counterparty | Mercury Category | Amount | Attachment? | Tickmark |
|--------|------|--------------|------------------|--------|-------------|----------|
| <id>   | ...  | ...          | ...              | ...    | none        | ✓        |

## Calculation

| # | Counterparty | Mercury Category | Txn Count | Total | GL Account | Dept | Tickmark |
|---|--------------|------------------|-----------|-------|------------|------|----------|
| 1 | ...          | ...              | ...       | $...  | <gl>       | <d>  | ^        |

## Journal Entry (NetSuite import format)

| Account | Debit | Credit | Department | Memo |
|---------|-------|--------|------------|------|
| <gl-expense>          | $<amount> |           | <dept> | <memoPrefix> — <vendor> |
| 21000 (AP Accrual)    |           | $<amount> | <dept> | <memoPrefix> — <vendor> |

**Total Debits:** $<sum>   **Total Credits:** $<sum>   **Difference:** $0.00 ✓

## Review Checklist

- [ ] Debits equal credits
- [ ] Period is correct (<period>)
- [ ] All GL accounts are valid (no `[GL?]` placeholders remain)
- [ ] Department / cost center coded
- [ ] Reversal flag set for next period
- [ ] Approver identified (route per your close process; Broker Dealer entries may need a dedicated approver)
```

**cash-reclass layout:** same three-block structure, but Source Data lists transfer legs (from-account, to-account, amount, date), Calculation pairs legs, and the JE has one row per pair debiting the destination cash GL sub-account and crediting the source.

### Step 6: Print the review checklist and stop

The skill never posts the JE — NetSuite import is the user's job. Print the workpaper path and tell the user it's ready to paste into the JE import template.

### Step 7 (optional, write): Tag accrued transactions

After the JE is posted in NetSuite, the user can re-run the skill with `--tag-accrued` to mark every transaction in the accrual set with a note so it doesn't get re-accrued next month.

```
Prompt: "Tag {N} accrued transactions with 'accrued <period>' in their note? (y/N)"

IF user confirms:
    FOR EACH txn IN accrualSet:
        mercury transactions update \
          --transaction-id <txn.id> \
          --note "accrued <period>"
```

Subsequent runs should filter out transactions whose `note` already contains `accrued <prior-period>` so reversing entries can be derived without double-counting. Follow `mercury-shared` write rules — one transaction at a time, surface errors verbatim, stop on 401/403.

## Example Output

```
Mercury JE Prep — ap-accrual, 2026-04

Loaded 3 accounts, 27 mappings from ./gl-mapping.jsonl.
Pulled 412 sent transactions in period (Mar 31 - Apr 30, 2026).
Filtered to 89 outgoing debits.
Checked attachments: 11 unattached -> accrual candidates.
Aggregated to 7 (counterparty, category) groups.

Unmapped categories needing review: ["Marketing Software"]

Source Data:
  Txn ID         Date        Counterparty             Category            Amount     Attached?
  a7c0...-3f1e   2026-04-12  NewTech Solutions        Software            -$18,500   none
  b8d1...-4f2e   2026-04-18  ToolCo                   Software             -$5,200   none
  ...

Calculation:
  # | Counterparty             | Category            | N | Total      | GL     | Dept   | TM
  1 | NewTech Solutions        | Software            | 1 | $18,500.00 | 60410  | 31000  | ^
  2 | ToolCo                   | Software            | 1 |  $5,200.00 | 60410  | 31000  | ^
  3 | Acme Cloud               | Cloud Services      | 2 | $12,450.00 | 60420  | 31000  | ^

Journal Entry:
  Account | Debit       | Credit      | Department | Memo
  60410   | $23,700.00  |             | 31000      | ap-accrual 2026-04 — Software
  60420   | $12,450.00  |             | 31000      | ap-accrual 2026-04 — Cloud Services
  ...
  21000   |             | $36,150.00  | 31000      | ap-accrual 2026-04

  Total Debits: $36,150.00   Total Credits: $36,150.00   Difference: $0.00 ✓

Saved workpaper: ~/Downloads/mercury-je-ap-accrual-2026-04.md
```

## Tips

- **Mapping file lives next to the data**, not committed to this repo. The canonical `mercuryCategory -> GL account` mapping is maintained by your finance team — copy it locally for each run, don't drift.
- **Unmapped categories block posting.** Print them in a top-of-file call-out so they get fixed before the JE leaves the workpaper.
- **Pending items belong to next month.** Don't accrue items that are still `status: pending` at period end — they'll post (with possibly different amounts) in the next period and get caught by next month's run.
- **Reversal flag** — most AP accruals are auto-reversing in the following period. The review checklist surfaces this so it's not missed.
- **`mercury transactions update` accepts `--note`**, not `--memo`. Don't typo this — it's the rule the autocategorize skill follows too.
- **Internal-transfer detection is heuristic.** If `kind == "internalTransfer"` isn't present in your CLI build, fall back to "counterparty is one of my own account IDs" — but verify the leg pairing on the first run since spurious pairs can occur on same-day same-amount external transfers.
