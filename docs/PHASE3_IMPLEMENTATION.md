# Phase 3: Multi-Tenant Access Implementation

## Summary

Phase 3 implements a **dual-path access system** that supports both:
- **SSO (existing)**: IAM Identity Center `CreateAccountAssignment` for internal AWS Organization accounts
- **Multi-Tenant (new)**: `sts:AssumeRole` with cross-account IAM roles for external customer accounts

## Architecture

```
Request Created → teamRouter (DDB Stream)
  ├── roleId starts with "mt-" → Multi-tenant eligibility check → Approval workflow
  └── roleId is SSO ARN → Existing SSO eligibility check → Existing SSO workflow

Grant Step Function:
  ├── CheckMultiTenant → teamMultiTenantGrant Lambda
  │   ├── isMultiTenant=true → Update status (STS creds auto-expire)
  │   └── isMultiTenant=false → CreateAccountAssignment (SSO)
  └── On revoke:
      ├── Multi-tenant → Pass state (STS auto-expires)
      └── SSO → DeleteAccountAssignment

On-demand credentials (for active multi-tenant requests):
  └── getMultiTenantCredentials GraphQL query → teamGetMultiTenantCredentials Lambda
      ├── accessType="console" → Federation URL
      └── accessType="cli" → AccessKeyId/SecretAccessKey/SessionToken
```

## New Lambda Functions

### teamMultiTenantGrant
- **Purpose**: Called by Grant Step Function to check if request is multi-tenant and assume the cross-account role
- **Runtime**: Python 3.9
- **Key Logic**: Scans Customers table, calls `sts:AssumeRole` with ExternalId, generates console federation URL

### teamGetMultiTenantCredentials
- **Purpose**: On-demand credential generation for active multi-tenant requests
- **Runtime**: Python 3.9
- **GraphQL Query**: `getMultiTenantCredentials(requestId, accessType)`
- **Returns**: Console URL or CLI credentials

## Modified Lambda Functions

### teamGenerateCloudFormation
- Now generates **multi-role** CloudFormation templates (8 roles instead of 1)
- Supports `selectedRoles` parameter for explicit role selection
- Backward compatible with `permissionSet` parameter

### teamRouter
- Added multi-tenant eligibility check before SSO flow
- New `check_multi_tenant_eligibility()` function
- New `get_allowed_roles_for_permission_set()` function
- Added `CUSTOMERS_TABLE_NAME` environment variable

### teamNotifications
- Added `build_customer_notification_email()` function
- Sends informational email to customer admin when their account is accessed
- Added `CUSTOMERS_TABLE_NAME` environment variable

## Frontend Changes

### Request.js
- Added `MULTI_TENANT_ROLES` constant with 8 role definitions
- `getPermissions()` now returns multi-tenant roles for established customers
- `checkApprovalAndApproverGroups()` skips SSO approver check for `mt-` roles

### ActiveAccessActions.js (new)
- Renders "Access Console" and "CLI Credentials" buttons for active multi-tenant requests
- Console access opens federation URL in new tab
- CLI access shows modal with environment variables and credentials file format

### View.js
- Integrated `ActiveAccessActions` component into the request details modal

## Schema Changes

### GraphQL Schema
- Added `MultiTenantCredentialsResponse` type
- Added `getMultiTenantCredentials` query

### VTL Resolver
- Updated role ID validation to accept both SSO ARNs and `mt-*` role IDs

## Role Mapping

| Multi-Tenant Role ID | IAM Role Created | Managed Policy |
|---------------------|-----------------|----------------|
| mt-ReadOnlyAccess | CloudIQS-MSP-ReadOnlyRole | ReadOnlyAccess |
| mt-S3FullAccess | CloudIQS-MSP-S3AdminRole | AmazonS3FullAccess |
| mt-EC2FullAccess | CloudIQS-MSP-EC2AdminRole | AmazonEC2FullAccess |
| mt-PowerUserAccess | CloudIQS-MSP-PowerUserRole | PowerUserAccess |
| mt-AdministratorAccess | CloudIQS-MSP-AdminRole | AdministratorAccess |
| mt-DatabaseAdmin | CloudIQS-MSP-DatabaseAdminRole | AmazonRDSFullAccess + AmazonDynamoDBFullAccess |
| mt-NetworkAdmin | CloudIQS-MSP-NetworkAdminRole | AmazonVPCFullAccess + AmazonRoute53FullAccess |
| mt-SecurityAudit | CloudIQS-MSP-SecurityAuditRole | SecurityAudit + AWSCloudTrail_ReadOnlyAccess |

## Deployment Checklist

1. Run `amplify push` to deploy all new and modified Lambda functions
2. Update the Grant Step Function definition (see `docs/STEP_FUNCTION_UPDATE.md`)
3. Verify frontend builds successfully
4. Test with both SSO and multi-tenant requests
