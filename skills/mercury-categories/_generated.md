<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# categories API Reference

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

---

## POST /categories/create

**Operation:** `createCategory`
**Summary:** Create a new category
**Description:** Create a new custom expense category for the organization.

### Parameters

No parameters required.

### Request Body

Schema: `CreateCategoryApiRequest`

### Response (200)

Schema: `CategoryData`

---

## POST /categories/{expenseCategoryId}/edit

**Operation:** `editCategory`
**Summary:** Edit a category
**Description:** Update an existing custom expense category for the organization.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `expenseCategoryId` | path | string (uuid) | Yes | ID for the category |

### Request Body

Schema: `EditCategoryApiRequest`

### Response (200)

Schema: `CategoryData`
