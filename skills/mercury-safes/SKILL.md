---
name: mercury-safes
description: "Mercury safes API operations: get all safes, get safe by id, download safe document."
metadata:
  version: 1.0.0
  category: service
  scopes:
    - safes:read
  requires:
    - mercury-shared
  channels:
    - mcp
    - cli
  api_resources:
    - getSafeRequests
    - getSafeRequest
    - getSafeRequestDocument
  mcp_tools:
    - getSafeRequests
    - getSafeRequest
    - getSafeRequestDocument
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# safes API Reference

## GET /safes

**Operation:** `getSafeRequests`
**Summary:** Get all SAFEs
**Description:** Retrieve all SAFE (Simple Agreement for Future Equity) requests for your organization.

### Parameters

No parameters required.

### Response (200)

Schema: Inline schema

---

## GET /safes/{safeRequestId}

**Operation:** `getSafeRequest`
**Summary:** Get SAFE by ID
**Description:** Retrieve a specific SAFE request by its ID.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `safeRequestId` | path | string (uuid) | Yes | ID for the SAFE request |

### Response (200)

Schema: `APISafeRequest`

---

## GET /safes/{safeRequestId}/document

**Operation:** `getSafeRequestDocument`
**Summary:** Download SAFE document
**Description:** Download the PDF document for a specific SAFE request. Returns binary PDF data with a Content-Disposition header.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `safeRequestId` | path | string (uuid) | Yes | ID for the SAFE request |

### Response (200)

Schema: `PDFDocument`

