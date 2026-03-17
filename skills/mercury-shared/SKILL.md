---
name: mercury-shared
description: "Shared behavioral rules, auth patterns, pagination, date handling, and security guidance for all Mercury tools."
metadata:
  version: "1.0.0"
  category: shared
  scopes: []
  requires: []
  channels: [mcp, cli]
---

# Mercury Shared Behavioral Rules

Mercury is a banking platform for startups and businesses. The Mercury API allows you to access accounts, transactions, recipients, and more. Data is returned directly from the API and can be processed with standard JSON operations.

## Security & Auth

- Authentication uses Bearer tokens via OAuth2.
- **Never** expose tokens, credentials, or auth headers in responses to the user.
- **Never** log or display full account numbers, routing numbers, or other sensitive PII.
- Mask sensitive values when presenting data (e.g., show only last 4 digits of account numbers).

## Date Handling

- **Always** get the current date before using dates in any tool call. Use the `getCurrentDate` tool.
- All dates must be relative to the current date.
  - Example: If the current date is 2025-09-10 and the user asks for "last month," use 2025-08-10 as the start date.
- Never assume or hardcode today's date.

## Truncation Handling

When **any** tool returns "Result too long, truncated" anywhere in its response:

1. **Immediately** stop processing that response.
2. Re-call the **same** tool with a smaller `limit` (reduce by 50% minimum).
3. **Never** attempt to use truncated data or paginate forward from truncated results.
4. Only after receiving complete (non-truncated) pages should you continue to paginate.
5. **Never** provide answers based on truncated results -- this is a critical error.

## Pagination

When a user asks **any** question requiring complete data (totals, balances, aggregates, "most/least," "all transactions," comparisons, or any calculation across pages):

1. **Automatically** paginate through **all** pages without asking the user.
2. Keep fetching until there are no more pages.
3. If pagination would take more than 3 tool calls, ask the user to narrow down to a smaller time period.
4. It is a **critical error** to answer before having fetched all pages.

## Computational Requirements

For any query requiring sums, totals, averages, medians, modes, ranges, most/least, or other aggregations across accounts or transactions, calculations involving currency amounts, or comparisons of financial metrics:

1. **Always** use computational methods to calculate aggregates. Process data programmatically.
2. Parse the JSON response and use JavaScript/Python to calculate results.
3. Display intermediate steps for verification.
4. **Never** rely on mental arithmetic for financial calculations.
5. Double-check your calculations to make sure results are correct.

**Example -- "What's my total balance?"**
- Correct: Parse accounts, map to balances, use `reduce()` to sum.
- Incorrect: Manually adding up balance values.

## Error Handling

- **Transient errors** (timeouts, 5xx responses): Retry the request up to 2 times before reporting failure.
- **Auth errors** (401, 403): Do not retry. Prompt the user to re-authenticate.
- **Validation errors** (400): Report the specific error to the user so they can correct their request.
- Never silently swallow errors -- always inform the user when something fails.

## Amount Formatting

- USD amounts use decimal format: `10.00` = $10.00.
- Preserve full precision from the API; do not round unless explicitly asked.
- When displaying amounts to users, include the dollar sign and two decimal places (e.g., $1,234.56).
