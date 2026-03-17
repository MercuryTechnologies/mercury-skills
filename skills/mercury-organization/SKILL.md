---
name: mercury-organization
description: "Mercury organization API operations: get organization information."
metadata:
  version: 1.0.0
  category: service
  scopes:
    - organization:read
  requires:
    - mercury-shared
  channels:
    - mcp
    - cli
  api_resources:
    - getOrganization
  mcp_tools:
    - getOrganization
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# organization API Reference

## GET /organization

**Operation:** `getOrganization`
**Summary:** Get organization information
**Description:** Retrieve information about your organization including EIN, legal business name, and DBAs.

### Parameters

No parameters required.

### Response (200)

Schema: `OrganizationResponse`

