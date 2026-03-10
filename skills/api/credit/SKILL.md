---
name: mercury-credit
version: 1.0.0
description: "Mercury credit API operations: list all credit accounts."
category: service
scopes:
  - credit:read
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
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

