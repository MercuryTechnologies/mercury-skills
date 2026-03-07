---
name: mercury-categories
version: 1.0.0
description: "Mercury categories API operations: list all categories."
category: service
scopes:
  - categories:read
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
  api_resources:
    - listCategories
  mcp_tools:
    - listCategories
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-categories API Reference

## GET /categories

**Operation:** `listCategories`
**Summary:** List all categories
**Description:** Retrieve a list of all available custom expense categories for the organization.

### Parameters

No parameters required.

### Response (200)

Schema: Inline schema

