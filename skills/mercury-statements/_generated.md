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
