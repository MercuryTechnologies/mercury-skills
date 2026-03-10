<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-accounts API Reference

## GET /account/{accountId}

**Operation:** `getAccount`
**Summary:** Get account by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |

### Response (200)

Schema: `Account`

---

## GET /account/{accountId}/cards

**Operation:** `getAccountCards`
**Summary:** Get cards for account
**Description:** Retrieve all debit and credit cards associated with a specific account.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |

### Response (200)

Schema: `AccountCardsResponse`

---

## POST /account/{accountId}/request-send-money

**Operation:** `requestSendMoney`
**Summary:** Request to send money
**Description:** Create a "request to send money" that will require approval based on your organization's approval policies.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |

### Request Body

Schema: `SendMoneyAPIRequest`

### Response (200)

Schema: `SendMoneyApprovalRequestResponse`

---

## GET /account/{accountId}/statements

**Operation:** `getAccountStatements`
**Summary:** Get account statements
**Description:** Retrieve a paginated list of monthly statements for a specific account. Supports cursor-based pagination with limit, order, start_after, and end_before query parameters, as well as date range filtering with start and end parameters.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'desc'. Default: desc |
| `start_after` | query | string (uuid) | No | The ID of the statement to start the page after (exclusive). When provided, results will begin with the statement immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the statement to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `start` | query | string | No | Filter statements where the period start date is on or after this date. Format: YYYY-MM-DD |
| `end` | query | string | No | Filter statements where the period start date is on or before this date. If the date is in the future, defaults to the current date. Format: YYYY-MM-DD |

### Response (200)

Schema: `DepositoryAccountStatementsPaginatedResponse`

---

## GET /account/{accountId}/transaction/{transactionId}

**Operation:** `getTransaction`
**Summary:** Get transaction by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |
| `transactionId` | path | string (uuid) | Yes | ID for this transaction |

### Response (200)

Schema: `Transaction`

---

## GET /account/{accountId}/transactions

**Operation:** `listAccountTransactions`
**Summary:** List account transactions
**Description:** Retrieve a paginated list of transactions for a specific account. Supports filtering by date range, status, and search terms.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start` | query | string | No | Earliest date to filter transactions. If not provided, defaults to 30 days before the current date. Format: YYYY-MM-DD or ISO 8601 string |
| `end` | query | string | No | Latest date to filter transactions. If not provided, defaults to the current date. Format: YYYY-MM-DD or ISO 8601 string |
| `search` | query | string | No | Search term to filter transactions by description or counterparty name |
| `status` | query | pending | sent | cancelled | failed | reversed | blocked | No | - |
| `offset` | query | integer (int64) | No | Number of results to skip for pagination |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'desc'. Default: desc |
| `requestId` | query | string (uuid) | No | ID returned from /account/:id/request-send-money |
| `mercuryCategory` | query | string | No | Name of mercuryCategory you want to filter on. Merchant Type in the UI. |
| `categoryId` | query | string (uuid) | No | UUID of a custom category. Can be returned from /categories endpoint. |

### Response (200)

Schema: `TransactionsResponse`

---

## POST /account/{accountId}/transactions

**Operation:** `createTransaction`
**Summary:** Send money to a recipient
**Description:** Send money from an account to a recipient. Creates a transaction that will be processed immediately or may require approval.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for a Mercury account. |

### Request Body

Schema: `PostTransactionAPIRequest`

### Response (200)

Schema: `Transaction`

---

## GET /accounts

**Operation:** `getAccounts`
**Summary:** Get all accounts
**Description:** Retrieve a paginated list of accounts. Supports cursor-based pagination with limit, order, start_after, and end_before query parameters.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |
| `start_after` | query | string (uuid) | No | The ID of the account to start the page after (exclusive). When provided, results will begin with the account immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the account to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |

### Response (200)

Schema: `AccountsPaginatedResponse`
