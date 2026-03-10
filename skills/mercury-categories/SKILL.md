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
**Description:** Retrieve a paginated list of all available custom expense categories for the organization. Supports cursor-based pagination with limit, order, start_after, and end_before query parameters.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |
| `start_after` | query | string (uuid) | No | The ID of the category to start the page after (exclusive). When provided, results will begin with the category immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the category to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |

### Response (200)

Schema: `CategoriesPaginatedResponse`

