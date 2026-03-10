---
name: mercury-statements
version: 1.0.0
description: "Mercury statements API operations: download account statement pdf."
category: service
scopes:
  - statements:read
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
  api_resources:
    - getStatementPdf
  mcp_tools:
    - getStatementPdf
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# statements API Reference

## GET /statements/{statementId}/pdf

**Operation:** `getStatementPdf`
**Summary:** Download account statement PDF
**Description:** Downloads a PDF file for the specified account statement. The response includes a Content-Disposition header for proper file download handling. Returns binary PDF data.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `statementId` | path | string (uuid) | Yes | ID for the account statement |

### Response (200)

Schema: `PDFDocument`

