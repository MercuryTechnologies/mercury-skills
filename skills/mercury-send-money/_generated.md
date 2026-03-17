<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# send-money API Reference

## GET /request-send-money/{requestId}

**Operation:** `getSendMoneyApprovalRequest`
**Summary:** Get send money approval request by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `requestId` | path | string (uuid) | Yes | ID for the send money approval request |

### Response (200)

Schema: `SendMoneyApprovalRequestResponse`
