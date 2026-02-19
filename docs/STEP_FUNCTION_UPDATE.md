# Step Function Update for Multi-Tenant Support

## Overview

The Grant Step Function needs to be updated to support a dual-path flow: SSO (existing) and Multi-Tenant (new). The Step Function currently uses `CreateAccountAssignment` for SSO-based access. For multi-tenant customers, it should use the `teamMultiTenantGrant` Lambda which performs `sts:AssumeRole`.

## Updated Step Function Definition

Replace the existing Grant State Machine definition with the following:

```json
{
  "Comment": "TEAM Grant Workflow - Dual Path (SSO + Multi-Tenant)",
  "StartAt": "CheckMultiTenant",
  "States": {
    "CheckMultiTenant": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamMultiTenantGrant-main",
      "ResultPath": "$",
      "Next": "IsMultiTenant",
      "Retry": [
        {
          "ErrorEquals": ["States.TaskFailed"],
          "IntervalSeconds": 3,
          "MaxAttempts": 2,
          "BackoffRate": 2
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "Next": "GrantError",
          "ResultPath": "$.error"
        }
      ]
    },
    "IsMultiTenant": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.isMultiTenant",
          "BooleanEquals": true,
          "Next": "MultiTenantUpdateStatus"
        }
      ],
      "Default": "ExistingSSOGrant"
    },
    "ExistingSSOGrant": {
      "Type": "Task",
      "Comment": "Existing CreateAccountAssignment call for SSO accounts",
      "Resource": "arn:aws:states:::aws-sdk:ssoadmin:createAccountAssignment",
      "Parameters": {
        "InstanceArn.$": "$.instanceARN",
        "PermissionSetArn.$": "$.roleId",
        "PrincipalId.$": "$.userId",
        "PrincipalType": "USER",
        "TargetId.$": "$.accountId",
        "TargetType": "AWS_ACCOUNT"
      },
      "ResultPath": "$.grant",
      "Next": "UpdateStatusInProgress"
    },
    "MultiTenantUpdateStatus": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamStatus-main",
      "Next": "NotifyGranted"
    },
    "UpdateStatusInProgress": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamStatus-main",
      "Next": "NotifyGranted"
    },
    "NotifyGranted": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamNotifications-main",
      "Next": "WaitForDuration"
    },
    "WaitForDuration": {
      "Type": "Wait",
      "SecondsPath": "$.duration",
      "Next": "CheckRevokeType"
    },
    "CheckRevokeType": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.isMultiTenant",
          "BooleanEquals": true,
          "Next": "MultiTenantRevoke"
        }
      ],
      "Default": "ExistingSSORevoke"
    },
    "ExistingSSORevoke": {
      "Type": "Task",
      "Comment": "Existing SSO revoke - DeleteAccountAssignment",
      "Resource": "arn:aws:states:::aws-sdk:ssoadmin:deleteAccountAssignment",
      "Parameters": {
        "InstanceArn.$": "$.instanceARN",
        "PermissionSetArn.$": "$.roleId",
        "PrincipalId.$": "$.userId",
        "PrincipalType": "USER",
        "TargetId.$": "$.accountId",
        "TargetType": "AWS_ACCOUNT"
      },
      "ResultPath": "$.revoke",
      "Next": "UpdateStatusEnded"
    },
    "MultiTenantRevoke": {
      "Type": "Pass",
      "Comment": "For multi-tenant, STS credentials auto-expire. Just update status.",
      "Result": {
        "AccountAssignmentDeletionStatus": {
          "Status": "IN_PROGRESS"
        }
      },
      "ResultPath": "$.revoke",
      "Next": "UpdateStatusEnded"
    },
    "UpdateStatusEnded": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamStatus-main",
      "Next": "NotifyEnded"
    },
    "NotifyEnded": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamNotifications-main",
      "End": true
    },
    "GrantError": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:us-east-1:722560225075:function:teamStatus-main",
      "End": true
    }
  }
}
```

## How It Works

### Grant Flow
1. **CheckMultiTenant** — Invokes `teamMultiTenantGrant` Lambda which checks if the request's `roleId` starts with `mt-`
2. **IsMultiTenant** — Choice state that branches based on `$.isMultiTenant` from the Lambda response
3. If `true` → Skips SSO `CreateAccountAssignment`, goes to `MultiTenantUpdateStatus` → `NotifyGranted`
4. If `false` → Uses existing SSO `CreateAccountAssignment` flow (`ExistingSSOGrant` → `UpdateStatusInProgress` → `NotifyGranted`)

### Revoke Flow
5. After the wait duration expires, `CheckRevokeType` branches again
6. If multi-tenant → `MultiTenantRevoke` (Pass state, STS credentials auto-expire)
7. If SSO → `ExistingSSORevoke` (`DeleteAccountAssignment`)
8. Both paths converge at `UpdateStatusEnded` → `NotifyEnded`

## Deployment Instructions

1. Navigate to the AWS Step Functions console
2. Find the Grant State Machine (ARN is in the `stepfunctions` custom resource outputs)
3. Edit the state machine definition
4. Replace the existing definition with the JSON above
5. Update the Lambda ARNs to match your environment if they differ
6. Save and test with both SSO and multi-tenant requests

Alternatively, update the definition in `amplify/backend/custom/stepfunctions/stepfunctions-cloudformation-template.json` and run `amplify push`.
