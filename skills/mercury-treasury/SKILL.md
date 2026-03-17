---
name: mercury-treasury
description: >-
  Mercury treasury API operations: get all treasury accounts, get treasury account statements, get treasury
  transactions.
metadata:
  version: 1.0.0
  category: service
  scopes:
    - treasury:read
  requires:
    - mercury-shared
  channels:
    - mcp
    - cli
  api_resources:
    - getTreasury
    - getTreasuryStatements
    - getTreasuryTransactions
  mcp_tools:
    - getTreasury
    - getTreasuryStatements
    - getTreasuryTransactions
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# treasury API Reference

## GET /treasury

**Operation:** `getTreasury`
**Summary:** Get all treasury accounts
**Description:** Retrieve a paginated list of all treasury accounts associated with the authenticated organization. Use cursor parameters (start_after, end_before) for pagination.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the account to start the page after (exclusive). When provided, results will begin with the account immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the account to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `TreasuryAccountsPaginatedResponse`

---

## GET /treasury/{treasuryId}/statements

**Operation:** `getTreasuryStatements`
**Summary:** Get treasury account statements
**Description:** Retrieve a paginated list of statements for a specific treasury account. Supports cursor-based pagination and filtering by document type.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `treasuryId` | path | string (uuid) | Yes | ID for a Mercury account. |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |
| `start_after` | query | string (uuid) | No | The ID of the statement to start the page after (exclusive). When provided, results will begin with the statement immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the statement to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `documentType` | query | MonthlyStatement | TradeConfirmation | 1099 | 1099R | 1042S | 5498 | 5498ESA | 1099Q | FMV | SDIRA | No | Filter statements by document type. |

### Response (200)

Schema: `TreasuryStatementsPaginatedResponse`

---

## GET /treasury/{treasuryId}/transactions

**Operation:** `getTreasuryTransactions`
**Summary:** Get treasury transactions
**Description:** Retrieve paginated treasury transactions for a specific treasury account.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `treasuryId` | path | string (uuid) | Yes | ID for a Mercury account. |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Defaults to 100. Default: 100 |
| `order` | query | asc | desc | No | Sort order for transactions. Can be 'asc' or 'desc'. Defaults to 'desc'. Default: desc |
| `cursor` | query | integer | No | Pagination cursor for retrieving next batch of transactions. Must be an integer >= 0 |

### Response (200)

Schema: `TreasuryTransactionsResponse`

