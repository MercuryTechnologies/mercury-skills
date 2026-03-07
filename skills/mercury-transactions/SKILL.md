---
name: mercury-transactions
version: 1.0.0
description: >-
  Mercury transactions API operations: get a transaction by id, update transaction metadata, upload a transaction
  attachment, and more.
category: service
scopes:
  - transactions:read
  - transactions:write
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
  api_resources:
    - getTransactionById
    - updateTransaction
    - uploadTransactionAttachment
    - listTransactions
  mcp_tools:
    - getTransactionById
    - listTransactions
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-transactions API Reference

## GET /transaction/{transactionId}

**Operation:** `getTransactionById`
**Summary:** Get a transaction by ID
**Description:** Retrieve a single transaction by its ID. Returns full transaction details including attachments, check images, and related metadata.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `transactionId` | path | string (uuid) | Yes | ID for this transaction |

### Response (200)

Schema: `Transaction`

---

## PATCH /transaction/{transactionId}

**Operation:** `updateTransaction`
**Summary:** Update transaction metadata
**Description:** Update the note and/or category of an existing transaction. Use null values to clear existing data.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `transactionId` | path | string (uuid) | Yes | ID for this transaction |

### Request Body

Schema: `ApiUpdateTransactionRequest`

### Response (200)

Schema: `Transaction`

---

## POST /transaction/{transactionId}/attachments

**Operation:** `uploadTransactionAttachment`
**Summary:** Upload a transaction attachment
**Description:** Upload a file attachment to a transaction. The file is uploaded via multipart/form-data. Supported file types include PDF, images (PNG, JPG, GIF), and common document formats.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `transactionId` | path | string (uuid) | Yes | ID of the transaction to attach the file to |

### Request Body

Schema: `Inline schema`
File to upload. Use form field name 'file'. Optionally include 'attachmentType' field with value 'receipt', 'bill', or 'other'.

### Response (200)

Schema: No content

---

## GET /transactions

**Operation:** `listTransactions`
**Summary:** List all transactions
**Description:** Retrieve a paginated list of all transactions across all accounts. Supports advanced filtering by date ranges, status, categories, and cursor-based pagination.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `status` | query | array[pending | sent | cancelled | failed | reversed | blocked] | No | - |
| `search` | query | string | No | Search term to look for in transaction descriptions. |
| `start` | query | string | No | Earliest createdAt date to filter for. If not provided, it defaults to the date of your first transaction. Format: YYYY-MM-DD or an ISO 8601 string. Please note that your Mercury transactions on your Dashboard might have their postedAt date displayed, as opposed to createdAt |
| `end` | query | string | No | Latest createdAt date to filter for. If it's not provided, it defaults to current day. Format: YYYY-MM-DD or an ISO 8601 string. Please note that your Mercury transactions on your Dashboard might have their postedAt date displayed, as opposed to createdAt |
| `postedStart` | query | string | No | Earliest postedAt date to filter for. Format: YYYY-MM-DD or an ISO 8601 string |
| `postedEnd` | query | string | No | Latest postedAt date to filter for. Format: YYYY-MM-DD or an ISO 8601 string |
| `accountId` | query | array[string] | No | - |
| `mercuryCategory` | query | string | No | Name of mercuryCategory you want to filter on. Merchant Type in the UI. |
| `categoryId` | query | string | No | UUID of a custom category. Can be returned from /categories endpoint. |
| `start_at` | query | string | No | The ID of the resource to start the page at (inclusive). When provided, results will begin with and include the resource with this ID. Use this to retrieve a specific page when you know the exact starting point. Cannot be combined with start_after or end_before. |
| `start_after` | query | string (uuid) | No | The ID of the transaction to start the page after (exclusive). When provided, results will begin with the transaction immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the transaction to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `TransactionsPaginatedResponse`


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
