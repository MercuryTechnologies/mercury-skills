---
name: mercury-send-money
description: "Mercury send-money API operations: get send money approval request by id."
metadata:
  version: 1.0.0
  category: service
  scopes:
    - send-money:read
  requires:
    - mercury-shared
  channels:
    - mcp
    - cli
  api_resources:
    - getSendMoneyApprovalRequest
  mcp_tools:
    - getSendMoneyApprovalRequest
---

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

