---
name: mercury-accounts
version: 1.0.0
description: "Mercury accounts API operations: get account by id, get cards for account, request to send money, and more."
category: service
scopes:
  - accounts:read
  - accounts:write
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
  api_resources:
    - getAccount
    - getAccountCards
    - requestSendMoney
    - getAccountStatements
    - getTransaction
    - listAccountTransactions
    - createTransaction
    - getAccounts
  mcp_tools:
    - getAccount
    - getAccountCards
    - getAccountStatements
    - getTransaction
    - listAccountTransactions
    - getAccounts
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-accounts API Reference

## GET /account/{accountId}

**Operation:** `getAccount`
**Summary:** Get account by id

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |

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
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |

### Response (200)

Schema: `AccountCardsResponse`

---

## POST /account/{accountId}/request-send-money

**Operation:** `requestSendMoney`
**Summary:** Request to send money
**Description:** Create a payment request that may require approval based on your organization's payment policies.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |

### Request Body

Schema: `SendMoneyAPIRequest`

### Response (200)

Schema: `SendMoneyApprovalRequestResponse`

---

## GET /account/{accountId}/statements

**Operation:** `getAccountStatements`
**Summary:** Get account statements
**Description:** Retrieve monthly statements for a specific account. Supports date range filtering.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |
| `start` | query | string | No | - |
| `end` | query | string | No | - |

### Response (200)

Schema: `AccountStatementsResponse`

---

## GET /account/{accountId}/transaction/{transactionId}

**Operation:** `getTransaction`
**Summary:** Get transaction by id

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |
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
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 500. Defaults to 500. Default: 500 |
| `start` | query | string | No | Earliest date to filter transactions. If not provided, defaults to 30 days before the current date. Format: YYYY-MM-DD or ISO 8601 string |
| `end` | query | string | No | Latest date to filter transactions. If not provided, defaults to the current date. Format: YYYY-MM-DD or ISO 8601 string |
| `search` | query | string | No | Search term to filter transactions by description or counterparty name |
| `status` | query | pending | sent | cancelled | failed | reversed | blocked | No | - |
| `offset` | query | integer (int64) | No | Number of results to skip for pagination |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'desc'. Default: desc |
| `requestId` | query | string (uuid) | No | Id returned from /account/:id/request-send-money |
| `mercuryCategory` | query | string | No | Name of mercuryCategory you want to filter on. Merchant Type in the UI. |
| `categoryId` | query | string (uuid) | No | UUID of a custom category. Can be returned from /categories endpoint. |

### Response (200)

Schema: `TransactionsResponse`

---

## POST /account/{accountId}/transactions

**Operation:** `createTransaction`
**Summary:** Create a transaction
**Description:** Send money from this account. Creates a transaction that will be processed immediately or may require approval.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | path | string (uuid) | Yes | ID for the Mercury account |

### Request Body

Schema: `PostTransactionAPIRequest`

### Response (200)

Schema: `Transaction`

---

## GET /accounts

**Operation:** `getAccounts`
**Summary:** Get all accounts

### Parameters

No parameters required.

### Response (200)

Schema: `AccountsResponse`


# Mercury Accounts - Enrichments

## Computational Requirements

When handling any query that requires calculations across account data:

### Triggers

Any request involving:
- Sums, totals, averages, medians, modes, ranges
- Most/least comparisons (e.g., "which account has the highest balance?")
- Aggregations across multiple accounts
- Calculations involving currency amounts
- Comparisons of financial metrics

### Mandatory Approach

You **MUST**:
1. Create an artifact that processes the data programmatically
2. Parse the JSON response and use JavaScript/Python to calculate
3. Display intermediate steps for verification
4. **Never** rely on mental arithmetic for financial calculations

### Examples

**"What's my total balance?"**

CORRECT approach:
- Create an artifact that parses accounts
- Map to balance values
- Use `reduce()` to sum
- Display the total with currency formatting

```javascript
const total = accounts
  .map(a => a.currentBalance)
  .reduce((sum, bal) => sum + bal, 0);
```

INCORRECT approach:
- Manually reading and adding up balance values from the response
- Estimating or rounding financial figures

**"Which account has the most money?"**

CORRECT approach:
- Parse all accounts programmatically
- Sort by `currentBalance` descending
- Return the top result with its balance

INCORRECT approach:
- Visually scanning the response and picking the largest number
