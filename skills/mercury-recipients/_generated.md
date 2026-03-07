<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-recipients API Reference

## GET /recipient/{recipientId}

**Operation:** `getRecipient`
**Summary:** Get recipient by id
**Description:** Retrieve details of a specific recipient by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `recipientId` | path | string (uuid) | Yes | ID for the Mercury account |

### Response (200)

Schema: `RecipientInfo`

---

## POST /recipient/{recipientId}

**Operation:** `updateRecipient`
**Summary:** Edit information about a specific recipient
**Description:** Update an existing recipient's information

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `recipientId` | path | string (uuid) | Yes | ID for the Mercury account |

### Request Body

Schema: `EditRecipientRequest`

### Response (200)

Schema: `RecipientInfo`

---

## POST /recipient/{recipientId}/attachments

**Operation:** `uploadRecipientAttachment`
**Summary:** Upload a recipient attachment
**Description:** Upload a tax form attachment for a recipient. The file is uploaded via multipart/form-data. Supported file types include PDF, images (PNG, JPG, GIF), and common document formats. The attachment will be associated as a tax document for the recipient.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `recipientId` | path | string (uuid) | Yes | ID of the recipient to attach the file to |

### Request Body

Schema: `Inline schema`
File to upload. Use form field name 'file'.

### Response (200)

Schema: No content

---

## GET /recipients

**Operation:** `getRecipients`
**Summary:** Get all recipients
**Description:** Retrieve a paginated list of all recipients. Use cursor parameters (start_after, end_before) for pagination.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the recipient to start the page after (exclusive). When provided, results will begin with the recipient immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the recipient to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `RecipientsPaginatedResponse`

---

## POST /recipients

**Operation:** `createRecipient`
**Summary:** Add a new recipient
**Description:** Create a new recipient for making payments

### Parameters

No parameters required.

### Request Body

Schema: `AddRecipientRequest`

### Response (200)

Schema: `RecipientInfo`

---

## GET /recipients/attachments

**Operation:** `listRecipientsAttachments`
**Summary:** List all recipient attachments
**Description:** Retrieve a paginated list of all recipient tax form attachments across all recipients in the organization. Use cursor parameters (start_after, end_before) for pagination.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the recipient attachment to start the page after (exclusive). When provided, results will begin with the recipient attachment immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the recipient attachment to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `RecipientsAttachmentsPaginatedResponse`
