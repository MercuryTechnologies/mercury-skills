---
name: mercury-organization
version: 1.0.0
description: "Mercury organization API operations: get organization information, get all users, get user by id."
category: service
scopes:
  - organization:read
requires:
  skills:
    - mercury-shared
channels:
  - mcp
  - cli
metadata:
  api_resources:
    - getOrganization
    - getUsers
    - getUser
  mcp_tools:
    - getOrganization
    - getUsers
    - getUser
---

<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-organization API Reference

## GET /organization

**Operation:** `getOrganization`
**Summary:** Get organization information
**Description:** Retrieve information about your organization including EIN, legal business name, and DBAs.

### Parameters

No parameters required.

### Response (200)

Schema: `OrganizationResponse`

---

## GET /users

**Operation:** `getUsers`
**Summary:** Get all users

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the user to start the page after (exclusive). When provided, results will begin with the user immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the user to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `UsersPaginatedResponse`

---

## GET /users/{userId}

**Operation:** `getUser`
**Summary:** Get user by ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `userId` | path | string (uuid) | Yes | ID for the user |

### Response (200)

Schema: `UserDetails`

