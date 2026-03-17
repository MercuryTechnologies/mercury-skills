---
name: mercury-events
description: "Mercury events API operations: get all events, get event by id."
metadata:
  version: 1.0.0
  category: service
  scopes:
    - events:read
  requires:
    - mercury-shared
  channels:
    - mcp
    - cli
  api_resources:
    - getEvents
    - getEvent
  mcp_tools:
    - getEvents
    - getEvent
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# events API Reference

## GET /events

**Operation:** `getEvents`
**Summary:** Get all events

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the event to start the page after (exclusive). When provided, results will begin with the event immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the event to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |
| `resourceType` | query | transaction | checkingAccount | savingsAccount | treasuryAccount | investmentAccount | creditAccount | No | - |
| `resourceId` | query | string (uuid) | No | - |

### Response (200)

Schema: `ApiEventsPaginatedResponse`

---

## GET /events/{eventId}

**Operation:** `getEvent`
**Summary:** Get event by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `eventId` | path | string (uuid) | Yes | ID for the API event |

### Response (200)

Schema: `ApiEventResponse`

