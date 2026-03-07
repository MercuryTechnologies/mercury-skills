---
name: mercury-treasury
version: 1.0.0
description: "Mercury treasury API operations: get all treasury accounts, get treasury transactions."
category: service
scopes:
  - treasury:read
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
  api_resources:
    - getTreasury
    - getTreasuryTransactions
  mcp_tools:
    - getTreasury
    - getTreasuryTransactions
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-treasury API Reference

## GET /treasury

**Operation:** `getTreasury`
**Summary:** Get all treasury accounts
**Description:** Retrieve all treasury accounts associated with the authenticated organization.

### Parameters

No parameters required.

### Response (200)

Schema: `TreasuryAccountsResponse`

---

## GET /treasury/{treasuryId}/transactions

**Operation:** `getTreasuryTransactions`
**Summary:** Get treasury transactions
**Description:** Retrieve paginated treasury transactions for a specific treasury account.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `treasuryId` | path | string (uuid) | Yes | ID for the Mercury account |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Defaults to 100. Default: 100 |
| `order` | query | asc | desc | No | Sort order for transactions. Can be 'asc' or 'desc'. Defaults to 'desc'. Default: desc |
| `cursor` | query | integer | No | Pagination cursor for retrieving next batch of transactions. Must be an integer >= 0 |

### Response (200)

Schema: `TreasuryTransactionsResponse`

