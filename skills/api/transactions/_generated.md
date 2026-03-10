<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# transactions API Reference

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
