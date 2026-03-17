# Mercury Transactions - Enrichments

## Critical Truncation Rule

**IF YOU SEE "Result too long" IN THE RESPONSE:**

1. **IMMEDIATELY STOP** -- do not attempt to analyze the data
2. The data is **INCOMPLETE** and any analysis will be **WRONG**
3. Start over with a smaller limit (reduce by 50%)
4. Paginate through ALL pages until you have complete data
5. **NEVER** provide answers based on truncated results

## Mandatory Pagination for Complete Results

When a user asks **ANY** question requiring complete data (totals, counts, averages, lists, searches, etc.):

1. Start with a limit of **300** transactions
2. You **MUST** automatically paginate through ALL pages **WITHOUT** asking the user
3. Continue calling `listTransactions` using the `page.nextPage` value
4. Keep fetching until `page.nextPage` is not present (null/undefined)
5. If pagination would take more than **3 tool calls**, ask the user to narrow the date range or filters
6. It is a **CRITICAL ERROR** to answer before having fetched ALL pages

### Pagination Mechanics

- Use the `limit` parameter to control page size (default: 300)
- If `page.nextPage` is returned in the response, use it as the `start_after` parameter in the next call
- Keep fetching until `page.nextPage` is null or undefined
- Combine all pages of results before performing any analysis

## Filtering Rules

- **WHEN FILTERING BY DATE, ALWAYS CHECK THE CURRENT DATE FIRST** -- do not assume what today's date is
- Unless the user specifies otherwise, **ONLY include transactions with `status: sent`** -- pending, cancelled, and failed transactions should be excluded from calculations
- Use the `accountId` parameter to filter by a specific account when the user references one
- Use `start` and `end` query parameters for date-based filtering at the API level rather than filtering client-side

## Computational Requirements

When handling any query that requires calculations across transaction data:

### Triggers

Any request involving:
- Sums, totals, averages, medians, modes, ranges
- Most/least comparisons (e.g., "what was my largest expense?")
- Aggregations across multiple transactions
- Calculations involving currency amounts
- Comparisons of financial metrics
- Categorization or grouping of transactions

### Mandatory Approach

You **MUST**:
1. Create an artifact that processes the data programmatically
2. Parse the JSON response and use JavaScript/Python to calculate
3. Display intermediate steps for verification
4. **Never** rely on mental arithmetic for financial calculations

### Examples

**"How much did I spend last month?"**

CORRECT approach:
- Check the current date
- Set `start` and `end` parameters for the previous month
- Paginate through all results
- Filter to `status: sent` only
- Sum negative amounts programmatically using `reduce()`

INCORRECT approach:
- Fetching one page and assuming it is complete
- Manually adding transaction amounts
- Not checking the current date before setting date filters

## Using getTransactionById

Use the `getTransactionById` tool when you need more details about a specific transaction. This is useful when:
- The user references a specific transaction and wants full details
- You need to verify transaction metadata before updating
- The list response does not include sufficient detail for the user's question
