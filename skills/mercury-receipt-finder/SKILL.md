---
name: mercury-receipt-finder
description: "Find Mercury transactions missing receipts, search macOS Photos and Gmail for matching receipt images and emails, then upload them via the mercury CLI."
metadata:
  version: "1.0.0"
  category: agentic
  scopes: [transactions:read, transactions:write, cards:read]
  requires: [mercury-shared]
---

# Mercury Receipt Finder

Automatically find transactions that are missing receipts, then hunt for matching receipts across macOS Photos and Gmail. For each match found, confirm with the user and upload via `mercury transactions attachments attach`.

This skill combines local photo search (screenshots of digital receipts, photos of paper receipts) with Gmail search (order confirmations, payment receipts, invoices) to close the gap on missing documentation. Uploads are irreversible — the skill **always** confirms each match before attaching.

## Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `dateRange` | Last 30 days | Window of transactions to scan for missing receipts. |
| `accountFilter` | All accounts | Restrict to specific Mercury account IDs. |
| `cardFilter` | (optional) | Filter transactions to a specific cardholder. Accepts a cardholder name (matched against `nameOnCard` from the cards API) or card last-4 digits (matched against `cardLastFourDigits` on transactions). Since the skill searches the current user's personal Photos and Gmail, this avoids searching for other people's receipts. |
| `minAmount` | $0.00 | Only look for receipts on transactions at or above this amount. Useful for focusing on material spend. |
| `sources` | photos, gmail | Which sources to search. Set to just `photos` or `gmail` to limit scope. |
| `gmailQuery` | (auto-built) | Override the Gmail search query. When set, the same query is used for all transactions — useful for searching a specific vendor across the full date range. |
| `photosDateBuffer` | 5 days | Days before the earliest transaction to begin the Photos search. Accounts for photos taken before the charge posts. |
| `maxPhotoCandidates` | 30 | Maximum images to send through vision analysis per run. If more candidates exist, the most recent are chosen. |

## Execution Strategy

### Step 1: Find Transactions Missing Receipts

```
1. Run `date +%Y-%m-%d` to get today's date.
2. Create a temp directory for the entire run:
   tmpDir = $(mktemp -d)
3. Fetch all transactions in the date range:

   mercury transactions list \
     --start <dateRange.start> --end <dateRange.end> \
     --status sent \
     [--account-id <accountFilter>] \
     --max-items -1 --format jsonl \
     --transform 'transactions.#.{id,amount,counterpartyName,description,postedAt,createdAt,compliantWithReceiptPolicy,cardId,cardLastFourDigits}'

4. Filter to transactions that:
   - Have compliantWithReceiptPolicy == false (transaction needs a receipt)
   - Are debits (amount < 0) — credits rarely need receipts
   - Have abs(amount) >= minAmount
   - IF cardFilter is provided:
     IF cardFilter looks like 4 digits (e.g. "4821"):
         Filter transactions where cardLastFourDigits == cardFilter.
     ELSE (cardFilter is a name, e.g. "Jane Smith"):
         Look up the user's cards to resolve name -> card IDs:

           mercury cards list --account-id <id> --format jsonl

         Find cards where nameOnCard matches cardFilter (case-insensitive).
         Collect matching card IDs.
         Filter transactions where cardId is in the matched card ID set.

     If no transactions remain after filtering, report:
       "No transactions found for card filter '{cardFilter}'.
        Available cardholders: {list nameOnCard values from cards}."
     STOP.

5. Sort by abs(amount) descending — prioritize high-value transactions.

6. Present a summary to the user:
   "Found {N} transactions without receipts totaling ${sum}.
    Highest: ${max} ({counterparty}), Lowest: ${min} ({counterparty}).
    Searching {sources} for matches..."

   If N == 0, report that all transactions have receipts and STOP.
   If N > 50, suggest narrowing the date range or raising minAmount.
   (Gmail search runs one API query per transaction, so high N is slow.
    Photos search is capped at maxPhotoCandidates regardless of N.)
```

### Step 2: Search macOS Photos

Skip this step if `photos` is not in `sources`.

This step searches for receipt photos across the entire date range at once, then uses vision to identify which images are actually receipts and extract their details. It does **not** loop per-transaction — matching happens later in Step 4.

#### Step 2a: Compute a single search window

```
searchStart = earliest(missingReceipts.postedAt) - photosDateBuffer
searchEnd   = today (from `date +%Y-%m-%d` in Step 1)
```

The buffer accounts for the common case where someone photographs a paper receipt at the point of sale, but the charge doesn't post for a day or two.

#### Step 2b: Find all images in the window

Use Spotlight (`mdfind`) as the primary search — it's fast, doesn't require launching Photos.app, and indexes the Photos library, Downloads, Desktop, and other locations in a single call.

```
mdfind 'kMDItemContentTypeTree == "public.image" && \
  kMDItemFSCreationDate >= $time.iso("<searchStart>T00:00:00") && \
  kMDItemFSCreationDate <= $time.iso("<searchEnd>T23:59:59")'
```

This returns all image files (camera photos, screenshots, downloaded images) created in the window regardless of where they live on disk.

If `mdfind` returns no results (e.g. Spotlight indexing is off, or all photos are in iCloud-only storage), fall back to a **single** AppleScript call:

```
osascript -e '
  tell application "Photos"
    set results to every media item whose date is greater than ¬
      date "<searchStart>" and date is less than date "<searchEnd>"
    if (count of results) > maxPhotoCandidates then
      set results to items 1 thru maxPhotoCandidates of results
    end if
    export results to POSIX file "<tmpDir>/photos/" using originals
  end tell
'
```

#### Step 2c: Pre-filter by file size

Before the expensive vision pass, apply a single cheap filter to cut down volume:

```
candidates = []
FOR EACH imagePath IN mdfindResults:
    fileSize = stat(imagePath).size
    IF fileSize < 10KB:
        skip  # icons, thumbnails
    IF fileSize > 30MB:
        skip  # very large files — panoramas, design assets
    candidates.push(imagePath)
```

No filename or dimension filtering — receipt photos have no predictable name (often just `IMG_1234.jpg`) and no consistent aspect ratio.

#### Step 2d: Cap candidates and sort by recency

```
IF len(candidates) > maxPhotoCandidates:
    Sort candidates by creation date descending (most recent first).
    candidates = candidates[0:maxPhotoCandidates]
    Inform the user:
      "Found {total} candidate images but capped at {maxPhotoCandidates}.
       Raise maxPhotoCandidates to search more, or narrow the date range."
```

#### Step 2e: Vision pass — identify receipts and extract details

For each candidate image, use multimodal vision to determine whether it's a receipt and, if so, extract structured data.

```
extractedReceipts = []
FOR EACH imagePath IN candidates:
    # Read the image via Claude multimodal vision.
    # Ask two questions in one pass:
    #   1. Is this a receipt, invoice, or proof of purchase? (yes/no)
    #   2. If yes, extract: merchant, totalAmount, date, last4 (if visible)

    IF image is NOT a receipt:
        skip

    extractedReceipts.push({
        path: imagePath,
        source: "photos",
        merchant: extracted.merchant,
        totalAmount: extracted.totalAmount,
        date: extracted.date,
        last4: extracted.last4 or null
    })

Report: "Scanned {len(candidates)} images, found {len(extractedReceipts)} receipts."
```

The extracted receipts are passed to Step 4 for scoring against transactions.

### Step 3: Search Gmail

Skip this step if `gmail` is not in `sources`.

Search Gmail for order confirmations, payment receipts, and invoices that correspond to the missing transactions. This step requires Google OAuth — if not configured, instruct the user to authorize.

```
# Check for Google OAuth credentials.
# The agent should use the Gmail API via curl with a valid access token.
# If no token is available, guide the user:
#   "Gmail search requires Google OAuth. Run:
#    1. Set GMAIL_ACCESS_TOKEN in your environment, or
#    2. Use `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/gmail.readonly`
#    Then re-run."
```

#### Step 3a: Query Gmail per transaction

```
FOR EACH txn IN missingReceipts:
    # Build a broad query — counterparty + date range only.
    # Do NOT include amount or receipt keywords in the query — these
    # over-constrain Gmail search and miss receipts where the merchant
    # name or formatting differs. Score locally instead.

    counterparty = txn.counterpartyName
    # Normalize common merchant prefixes for better Gmail matches:
    #   "SQ *COFFEE SHOP"  -> "COFFEE SHOP" (strip Square prefix)
    #   "AMZN Mktp US"     -> "Amazon"
    #   "TST* Restaurant"  -> "Restaurant" (strip Toast prefix)
    counterparty = stripKnownPrefixes(counterparty)

    IF gmailQuery is provided:
        query = gmailQuery
    ELSE:
        start = txn.postedAt - 5 days
        end   = txn.postedAt + 3 days
        query = "{counterparty} after:{start} before:{end}"

    curl -s -H "Authorization: Bearer $GMAIL_ACCESS_TOKEN" \
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?q={urlEncode(query)}&maxResults=5"
```

#### Step 3b: Fetch and score each email

```
    FOR EACH messageId IN results.messages:
        curl -s -H "Authorization: Bearer $GMAIL_ACCESS_TOKEN" \
          "https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}?format=full"

        # Extract from the email:
        #   - Subject line, sender, date
        #   - Body text (look for dollar amounts, order numbers)
        #   - Attachment list (PDF invoices, image receipts)

        # Score the email against the transaction:
        score = 0
        IF email body or subject contains abs(txn.amount) as a dollar figure:
            score += 0.4
        IF sender or subject token-overlaps txn.counterpartyName:
            score += 0.3
        IF email date is within 3 days of txn.postedAt:
            score += 0.2
        IF email has a PDF attachment:
            score += 0.1

        IF score >= 0.5:
            # Only download emails that have a usable attachment (PDF, PNG, JPG).
            # Skip emails with no attachment — they can't be uploaded as a receipt
            # file. Flag them as "receipt email found, no downloadable attachment"
            # so the user can save the PDF manually.
            IF email has PDF or image attachments:
                curl -s -H "Authorization: Bearer $GMAIL_ACCESS_TOKEN" \
                  "https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}/attachments/{attachmentId}" \
                  | jq -r '.data' | base64 -d > {tmpDir}/{messageId}-{filename}

                gmailReceipts.push({
                    txnId: txn.id,
                    receipt: {
                        path: "{tmpDir}/{messageId}-{filename}",
                        source: "gmail",
                        merchant: extractMerchant(sender, subject),
                        totalAmount: extractAmount(body),
                        date: emailDate
                    },
                    score: score,
                    source: "gmail",
                    preview: "{subject} from {sender}"
                })
            ELSE:
                gmailNoAttachment[txn.id] = {
                    score: score,
                    preview: "{subject} from {sender}",
                    note: "Receipt email found but has no downloadable attachment"
                }
```

### Step 4: Score Receipts Against Transactions

Photo receipts (from Step 2) were identified by vision but not yet matched to specific transactions. Gmail receipts (from Step 3) were scored during search. This step brings both sources together.

#### Step 4a: Match photo receipts to transactions

```
FOR EACH receipt IN extractedReceipts:  # from Step 2e
    FOR EACH txn IN missingReceipts:
        score = 0

        # Amount match (weight 0.4, linear decay over $1.00 tolerance)
        diff = abs(receipt.totalAmount - abs(txn.amount))
        IF diff < 1.00:
            score += 0.4 * (1 - diff / 1.00)
        ELSE:
            continue  # amount mismatch — skip this pair

        # Merchant match (weight 0.3)
        IF tokenOverlap(lower(receipt.merchant), lower(txn.counterpartyName)) > 0:
            score += 0.3

        # Date match (weight 0.2, linear decay over 7 days)
        daysApart = abs(daysBetween(receipt.date, txn.postedAt))
        IF daysApart <= 7:
            score += 0.2 * (1 - daysApart / 7)

        # Card last-4 match (weight 0.1)
        IF receipt.last4 AND txn.cardLastFourDigits == receipt.last4:
            score += 0.1

        IF score >= 0.5:
            photoMatches.push({
                txnId: txn.id,
                receipt: receipt,
                score: score,
                source: "photos",
                preview: "{receipt.path} — ${receipt.totalAmount} at {receipt.merchant}"
            })
```

#### Step 4b: Consolidate and pick best match per transaction

A single receipt must not be assigned to multiple transactions. Process transactions in descending amount order (highest-value first) and remove each claimed receipt from the pool.

```
allMatches = photoMatches + gmailReceipts  # both have txnId and score
claimedReceipts = set()  # track receipt paths already assigned

FOR EACH txn IN missingReceipts:  # already sorted by abs(amount) desc
    txnMatches = allMatches.filter(m =>
                     m.txnId == txn.id AND
                     m.receipt.path NOT IN claimedReceipts)
                   .sortBy(score, descending)

    IF len(txnMatches) == 0:
        IF txn.id IN gmailNoAttachment:
            noMatch.push({ txn, note: gmailNoAttachment[txn.id].note })
        ELSE:
            noMatch.push({ txn, note: "No receipt found in Photos or Gmail" })
        continue

    bestMatch = txnMatches[0]
    claimedReceipts.add(bestMatch.receipt.path)

    results.push({
        transaction: txn,
        bestMatch: bestMatch,
        alternativeCount: len(txnMatches) - 1
    })
```

### Step 5: Present Results for Review (ALWAYS)

Never auto-upload. Always present the full match table for user review.

```
Show results in two groups:

=== Matches Found ({len(results)} of {len(missingReceipts)}) ===

| # | Date | Counterparty | Amount | Source | Receipt Preview | Score |
|---|------|-------------|--------|--------|----------------|-------|
| 1 | 2026-04-02 | AWS | $8,432.00 | Gmail | "AWS Invoice Apr 2026.pdf" | 0.95 |
| 2 | 2026-04-09 | Uber | $28.40 | Photos | IMG_4821.jpg — $28.40 at Uber | 0.82 |
| ... |

=== No Match Found ({len(noMatch)}) ===

| # | Date | Counterparty | Amount | Notes |
|---|------|-------------|--------|-------|
| 8 | 2026-04-15 | NewTech Solutions | $18,500.00 | No receipt found in Photos or Gmail |
| 9 | 2026-04-18 | Office Depot | $234.56 | Receipt email found, no downloadable attachment |

For each matched row, show a brief preview:
  - Photos: filename + extracted amount + merchant
  - Gmail: email subject + sender

Prompt: "Upload matched receipts? (a)ll / (s)elect rows / (r)eview details / (c)ancel"

IF user picks (a)ll:
    Proceed to Step 6 with all matched rows.

IF user picks (s)elect:
    User picks row numbers. Proceed to Step 6 with selected rows only.

IF user picks (r)eview:
    For each row, show a side-by-side summary:

      Receipt                          Transaction
      -------                          -----------
      Source:    {source}               Counterparty: {txn.counterpartyName}
      Merchant:  {receipt.merchant}     Amount:       ${abs(txn.amount)}
      Amount:    ${receipt.totalAmount}  Posted:       {txn.postedAt}
      Date:      {receipt.date}         Card:         ****{txn.cardLastFourDigits}
      File:      {receipt.path}         Txn ID:       {txn.id}
      Score:     {score}

    If source is "photos", display the receipt image inline for visual check.
    Ask per row: "Upload this receipt to transaction {txn.id}? (y/N)"
    Only rows the user confirms with "y" proceed to Step 6.

IF user picks (c)ancel or does not explicitly confirm:
    STOP. Do not upload anything.
```

### Step 6: Upload Confirmed Receipts

```
FOR EACH confirmed match:
    mercury transactions attachments attach \
      --transaction-id <txn.id> \
      --file <match.receiptPath> \
      --attachment-type receipt \
      --format jsonl

    On success: log "Attached {filename} to {counterparty} (${amount})"
    On error: surface CLI error verbatim, continue to next.

# Clean up temp files
rm -rf {tmpDir}

# Final summary
"Uploaded {success} receipts. {failed} failed. {unmatched} transactions
 still need receipts — use `mercury-receipt-upload` to attach them manually."
```

## Example Output

```
Scanning transactions Apr 1 - Apr 30, 2026 for missing receipts...

Found 11 transactions without receipts totaling $32,847.22.
Highest: $18,500.00 (NewTech Solutions), Lowest: $12.45 (Blue Bottle Coffee).
Searching Photos and Gmail for matches...

Searching Photos (Mar 28 - May 1)... 142 images in range, 38 after size filter,
  capped at 30. Scanned 30 images, found 4 receipts.
Searching Gmail (11 transactions)... found 7 matching emails with attachments,
  1 receipt email without downloadable attachment.

Scoring receipts against transactions...

=== Matches Found (8 of 11) ===

| # | Date       | Counterparty         | Amount      | Source | Receipt                              | Score |
|---|------------|----------------------|-------------|--------|--------------------------------------|-------|
| 1 | 2026-04-02 | AWS                  | $8,432.00   | Gmail  | "AWS Invoice Apr 2026.pdf"           | 0.95  |
| 2 | 2026-04-04 | GitHub               | $84.00      | Gmail  | "Your GitHub receipt" from noreply@  | 0.92  |
| 3 | 2026-04-07 | Figma                | $45.00      | Gmail  | "Figma payment receipt" (PDF)        | 0.90  |
| 4 | 2026-04-09 | Uber                 | $28.40      | Photos | IMG_4821.jpg — $28.40 at Uber        | 0.82  |
| 5 | 2026-04-12 | Blue Bottle Coffee   | $12.45      | Photos | IMG_4830.jpg — $12.45 at Blue Bottle | 0.78  |
| 6 | 2026-04-14 | Delta Air Lines      | $487.00     | Gmail  | "Delta booking confirmation" (PDF)   | 0.85  |
| 7 | 2026-04-20 | Stripe               | $299.00     | Gmail  | "Stripe Atlas invoice" (PDF)         | 0.93  |
| 8 | 2026-04-25 | WeWork               | $2,100.00   | Gmail  | "WeWork monthly invoice" (PDF)       | 0.91  |

=== No Match Found (3 of 11) ===

| # | Date       | Counterparty         | Amount      | Notes                                          |
|---|------------|----------------------|-------------|-------------------------------------------------|
| 9 | 2026-04-15 | NewTech Solutions    | $18,500.00  | No receipt in Photos or Gmail                   |
|10 | 2026-04-18 | Office Depot         | $234.56     | Receipt email found, no downloadable attachment |
|11 | 2026-04-22 | Staples              | $89.99      | No receipt in Photos or Gmail                   |

Upload matched receipts? (a)ll / (s)elect rows / (r)eview details / (c)ancel: a

Uploading...
  #1 AWS Invoice Apr 2026.pdf         -> txn a7c0...3f1e  OK
  #2 Your GitHub receipt.pdf           -> txn b3d1...8a2c  OK
  #3 Figma payment receipt.pdf         -> txn c5e2...9b3d  OK
  #4 IMG_4821.jpg                      -> txn d7f3...0c4e  OK
  #5 IMG_4830.jpg                      -> txn e9a4...1d5f  OK
  #6 Delta booking confirmation.pdf    -> txn f1b5...2e6a  OK
  #7 Stripe Atlas invoice.pdf          -> txn a3c6...3f7b  OK
  #8 WeWork monthly invoice.pdf        -> txn b5d7...4a8c  OK

Uploaded 8 receipts. 0 failed.
3 transactions still need receipts — use `mercury-receipt-upload` to attach manually.
```

## Tips

- Start with `minAmount` set to a meaningful threshold (e.g. $25) to focus on transactions your accountant actually needs receipts for — most companies only require receipts above $25 or $75.
- The Photos search looks at all images in the date range — camera photos of paper receipts, screenshots, downloaded order confirmations. Vision identifies which are receipts, so no filename or format assumptions are made.
- Gmail search relies on a valid OAuth token. If the user's receipts go to a different email address, they'll need to configure that account's token.
- Some merchants send receipts from non-obvious email addresses (e.g. `noreply@square.com` for a local coffee shop). The Gmail query searches by counterparty name and date range, then scores amount locally — so it catches receipts regardless of sender.
- For transactions with no match in either source, suggest the user check their physical files or email, then use `mercury-receipt-upload` to attach manually.
- The skill creates a unique temp directory via `mktemp -d` for staging Gmail attachments. It is cleaned up after upload, but if the skill is interrupted, the user may want to clear it manually.
- Use `cardFilter` to scope transactions to the person running the skill. Since Photos and Gmail are personal sources, searching for another cardholder's transactions will produce false matches.
- Never upload without explicit user confirmation, even if every match scores above 0.9.
