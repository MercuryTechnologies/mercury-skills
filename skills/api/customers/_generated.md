<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# customers API Reference

## GET /ar/customers

**Operation:** `listCustomers`
**Summary:** List all customers
**Description:** Retrieve a paginated list of customers. Supports cursor-based pagination with limit, order, start_after, and end_before query parameters.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `limit` | query | integer (int64) | No | Maximum number of results to return. Allowed range: 1 to 1000. Defaults to 1000. Default: 1000 |
| `start_after` | query | string (uuid) | No | The ID of the customer to start the page after (exclusive). When provided, results will begin with the customer immediately following this ID. Use this for standard forward pagination to get the next page of results. Cannot be combined with end_before. |
| `end_before` | query | string (uuid) | No | The ID of the customer to end the page before (exclusive). When provided, results will end just before this ID and work backwards. Use this for reverse pagination or to retrieve previous pages. Cannot be combined with start_after. |
| `order` | query | asc | desc | No | Sort order. Can be 'asc' or 'desc'. Defaults to 'asc'. Default: asc |

### Response (200)

Schema: `ApiV1ArCustomerPaginatedResponseData`

---

## POST /ar/customers

**Operation:** `createCustomer`
**Summary:** Create a customer
**Description:** Create a new customer for the organization

### Parameters

No parameters required.

### Request Body

Schema: `ApiV1ArCustomerCreateRequest`

### Response (200)

Schema: `ApiV1ArCustomerResponseData`

---

## GET /ar/customers/{customerId}

**Operation:** `getCustomer`
**Summary:** Get a customer
**Description:** Retrieve details of a specific customer by their ID

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `customerId` | path | string (uuid) | Yes | The customer who will receive the invoice. Use the /api/v1/ar/customers endpoint to list your customers and find the corresponding id, or create a new customer first. |

### Response (200)

Schema: `ApiV1ArCustomerResponseData`

---

## POST /ar/customers/{customerId}

**Operation:** `updateCustomer`
**Summary:** Update a customer
**Description:** Update an existing customer

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `customerId` | path | string (uuid) | Yes | The customer who will receive the invoice. Use the /api/v1/ar/customers endpoint to list your customers and find the corresponding id, or create a new customer first. |

### Request Body

Schema: `ApiV1ArCustomerUpdateRequest`

### Response (200)

Schema: `ApiV1ArCustomerResponseData`

---

## DELETE /ar/customers/{customerId}

**Operation:** `deleteCustomer`
**Summary:** Delete a customer
**Description:** Delete a customer. This action cannot be undone.

### Parameters

| Name | In | Type | Required | Description |
|------|------|------|----------|-------------|
| `customerId` | path | string (uuid) | Yes | The customer who will receive the invoice. Use the /api/v1/ar/customers endpoint to list your customers and find the corresponding id, or create a new customer first. |

### Response (200)

Schema: No schema
