<!-- Auto-generated from OpenAPI spec. Do not edit manually. -->

# mercury-payments API Reference

## POST /transfer

**Operation:** `createInternalTransfer`
**Summary:** Create an internal transfer
**Description:** Transfer funds between two accounts within the same organization. Supports transfers between depository accounts (checking/savings), from a depository account to a treasury/investment account, and from a treasury/investment account to a depository account. Creates paired debit and credit transactions.

### Parameters

No parameters required.

### Request Body

Schema: `InternalTransferAPIRequest`

### Response (200)

Schema: `InternalTransferAPIResponse`
