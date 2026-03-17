---
name: mercury-credit
description: "Mercury credit API operations: list all credit accounts."
metadata:
  version: 1.0.0
  category: service
  scopes:
    - credit:read
  requires:
    - mercury-shared
  channels:
    - mcp
    - cli
  api_resources:
    - listCredit
  mcp_tools:
    - listCredit
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# credit API Reference

## GET /credit

**Operation:** `listCredit`
**Summary:** List all credit accounts
**Description:** Retrieve a list of all credit accounts for the organization.

### Parameters

No parameters required.

### Response (200)

Schema: `CreditAccountsResponse`

