<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# invoices API Reference

## GET /ar/attachments/{attachmentId}

**Operation:** `getAttachment`
**Summary:** Get an attachment
**Description:** Retrieve attachment details including download URL

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `attachmentId` | path | string (uuid) | Yes | ID for the attachment. |

### Response (200)

Schema: `ApiV1ArAttachmentResponseData`

---

## GET /ar/invoices

**Operation:** `listInvoices`
**Summary:** List all invoices
**Description:** Retrieve a paginated list of invoices. Supports cursor-based pagination with limit, order, start_after, and end_before query parameters.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |
| `start_after` | query | string (uuid) | No | The ID of the invoice to start the page after (exclusive). When provided, results will begin with the invoice immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the invoice to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |

### Response (200)

Schema: `ApiV1ArInvoicesPaginatedResponse`

---

## POST /ar/invoices

**Operation:** `createInvoice`
**Summary:** Create an invoice
**Description:** Create a new invoice for the organization

### Parameters

No parameters required.

### Request Body

Schema: `ApiV1ArInvoiceCreateRequest`

### Response (200)

Schema: `ApiV1ArInvoiceResponse`

---

## GET /ar/invoices/{invoiceId}

**Operation:** `getInvoice`
**Summary:** Get an invoice
**Description:** Retrieve details of an invoice by its ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `invoiceId` | path | string (uuid) | Yes | ID for the invoice. |

### Response (200)

Schema: `ApiV1ArInvoiceResponse`

---

## POST /ar/invoices/{invoiceId}

**Operation:** `updateInvoice`
**Summary:** Update an invoice
**Description:** Update an existing invoice

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `invoiceId` | path | string (uuid) | Yes | ID for the invoice. |

### Request Body

Schema: `ApiV1ArInvoiceUpdateRequest`

### Response (200)

Schema: `ApiV1ArInvoiceResponse`

---

## GET /ar/invoices/{invoiceId}/attachments

**Operation:** `listInvoiceAttachments`
**Summary:** List invoice attachments
**Description:** Retrieve a list of all attachments for a specific invoice

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `invoiceId` | path | string (uuid) | Yes | ID for the invoice. |

### Response (200)

Schema: `ApiV1ArAttachmentsResponseData`

---

## POST /ar/invoices/{invoiceId}/cancel

**Operation:** `cancelInvoice`
**Summary:** Cancel an invoice
**Description:** Cancel an invoice. This action cannot be undone.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `invoiceId` | path | string (uuid) | Yes | ID for the invoice. |

### Response (200)

Schema: No schema

---

## GET /ar/invoices/{invoiceId}/pdf

**Operation:** `getInvoicePdf`
**Summary:** Download invoice PDF
**Description:** Downloads a PDF file for the specified invoice. The response includes a Content-Disposition header set to 'attachment' with the filename.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `invoiceId` | path | string (uuid) | Yes | ID for the invoice. |

### Response (200)

Schema: `PDFDocument`
