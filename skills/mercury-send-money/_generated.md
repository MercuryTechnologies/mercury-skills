<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# send-money API Reference

## GET /request-send-money

**Operation:** `listSendMoneyApprovalRequests`
**Summary:** List send money approval requests
**Description:** Retrieve a paginated list of send money approval requests for the authenticated organization. Supports filtering by account and status.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `accountId` | query | string (uuid) | No | ID for a Mercury account. |
| `status` | query | pendingApproval | approved | rejected | cancelled | No | - |
| `start_after` | query | string (uuid) | No | The ID of the send money approval request to start the page after (exclusive). When provided, results will begin with the send money approval request immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the send money approval request to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |

### Response (200)

Schema: `SendMoneyApprovalRequestsPaginatedResponse`

---

## GET /request-send-money/{requestId}

**Operation:** `getSendMoneyApprovalRequest`
**Summary:** Get send money approval request by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `requestId` | path | string (uuid) | Yes | ID for the send money approval request |

### Response (200)

Schema: `SendMoneyApprovalRequestResponse`
