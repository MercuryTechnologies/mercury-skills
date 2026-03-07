<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-webhooks API Reference

## GET /webhooks

**Operation:** `getWebhooks`
**Summary:** Get webhook endpoints
**Description:** Retrieve a paginated list of all webhook endpoints for your organization. Supports filtering by status.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `status` | query | array[active | paused | disabled | deleted] | No | - |
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the webhook to start the page after (exclusive). When provided, results will begin with the webhook immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the webhook to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `ApiWebhooksPaginatedResponse`

---

## POST /webhooks

**Operation:** `createWebhook`
**Summary:** Create a new webhook endpoint
**Description:** Register a new webhook endpoint to receive event notifications

### Parameters

No parameters required.

### Request Body

Schema: `CreateWebhookParams`

### Response (200)

Schema: `ApiWebhookResponse`

---

## GET /webhooks/{webhookEndpointId}

**Operation:** `getWebhook`
**Summary:** Get webhook endpoint by id
**Description:** Retrieve details of a specific webhook endpoint by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `webhookEndpointId` | path | string (uuid) | Yes | ID for the webhook |

### Response (200)

Schema: `ApiWebhookResponse`

---

## POST /webhooks/{webhookEndpointId}

**Operation:** `updateWebhook`
**Summary:** Update an existing webhook endpoint
**Description:** Update the configuration of an existing webhook endpoint

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `webhookEndpointId` | path | string (uuid) | Yes | ID for the webhook |

### Request Body

Schema: `UpdateWebhookParams`

### Response (200)

Schema: `ApiWebhookResponse`

---

## DELETE /webhooks/{webhookEndpointId}

**Operation:** `deleteWebhook`
**Summary:** Delete a webhook endpoint
**Description:** Delete a webhook endpoint

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `webhookEndpointId` | path | string (uuid) | Yes | ID for the webhook |

### Response (200)

Schema: No schema

---

## POST /webhooks/{webhookEndpointId}/verify

**Operation:** `verifyWebhook`
**Summary:** Verify a webhook endpoint
**Description:** Send a test event to verify the webhook endpoint is properly configured and reachable. The request body accepts an optional 'eventType' field to specify which event type to test (e.g., 'transaction.created', 'transaction.updated'). If omitted from the request body, defaults to 'transaction.created'.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `webhookEndpointId` | path | string (uuid) | Yes | ID for the webhook |

### Request Body

Schema: `VerifyWebhookParams`

### Response (200)

Schema: No schema
