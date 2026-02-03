# Deployment Flow - Visual Guide

## The Problem You Had

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (localhost:3000)                                   │
│                                                              │
│  aws-exports.js:                                            │
│  {                                                           │
│    "aws_project_region": "us-east-1"                        │
│    // ❌ Missing Cognito configuration!                     │
│  }                                                           │
│                                                              │
│  Result: ❌ App crashes with AuthError                      │
└─────────────────────────────────────────────────────────────┘
```

## Temporary Fix (Current State)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (localhost:3000)                                   │
│                                                              │
│  aws-exports.js:                                            │
│  {                                                           │
│    "aws_project_region": "us-east-1",                       │
│    "aws_user_pools_id": "us-east-1_PLACEHOLDER",  ← Mock    │
│    "oauth": {                                               │
│      "domain": "placeholder-domain.auth..."  ← Mock         │
│    }                                                         │
│  }                                                           │
│                                                              │
│  Result: ✅ App loads, but can't authenticate               │
└─────────────────────────────────────────────────────────────┘
```

## Full Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        AWS CLOUD (us-east-1)                            │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  1. IAM Identity Center                                       │    │
│  │     Instance: ssoins-7223afa5ccc151fe                         │    │
│  │     Portal: https://d-90661f7cab.awsapps.com/start            │    │
│  │                                                                │    │
│  │     Groups:                                                    │    │
│  │     - team-admins                                             │    │
│  │     - team-auditors                                           │    │
│  │                                                                │    │
│  │     SAML 2.0 Application: "TEAM IDC APP"                      │    │
│  └───────────────────────┬───────────────────────────────────────┘    │
│                          │ SAML Federation                             │
│                          ↓                                             │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  2. Amazon Cognito User Pool                                  │    │
│  │     ID: us-east-1_xxxxxxxx                                    │    │
│  │     Domain: dxxxxxxxxx-main.auth.amazoncognito.com            │    │
│  │                                                                │    │
│  │     SAML Identity Provider: "team"                            │    │
│  │     Metadata: From Identity Center                            │    │
│  └───────────────────────┬───────────────────────────────────────┘    │
│                          │ OAuth 2.0 / OpenID Connect                  │
│                          ↓                                             │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │  3. AWS Amplify Hosting                                       │    │
│  │     App: TEAM-IDC-APP                                         │    │
│  │     URL: https://main.dxxxxxxxxx.amplifyapp.com               │    │
│  │                                                                │    │
│  │     Auto-generated aws-exports.js with real config            │    │
│  └───────────────────────┬───────────────────────────────────────┘    │
│                          │                                             │
│  ┌───────────────────────┴───────────────────────────────────────┐    │
│  │  4. Backend Services                                          │    │
│  │                                                                │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │    │
│  │  │  AppSync     │  │  DynamoDB    │  │  Lambda      │        │    │
│  │  │  GraphQL API │  │  Tables      │  │  Functions   │        │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘        │    │
│  │                                                                │    │
│  │  ┌──────────────┐  ┌──────────────┐                          │    │
│  │  │  CloudTrail  │  │  SES Email   │                          │    │
│  │  │  Audit Logs  │  │  Notifications│                          │    │
│  │  └──────────────┘  └──────────────┘                          │    │
│  └───────────────────────────────────────────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Deployment Steps Flow

```
Step 1: Update Parameters
┌─────────────────────────┐
│ deployment/parameters.sh│
│ - IDC_LOGIN_URL         │
│ - TEAM_ACCOUNT          │
│ - TEAM_ADMIN_GROUP      │
│ - TEAM_AUDITOR_GROUP    │
└────────┬────────────────┘
         │
         ↓
Step 2: Deploy CloudFormation
┌─────────────────────────┐
│ ./deployment/deploy.sh  │
│                         │
│ Creates:                │
│ ✓ CodeCommit repo       │
│ ✓ Cognito User Pool     │
│ ✓ Cognito Identity Pool │
│ ✓ AppSync API           │
│ ✓ DynamoDB tables       │
│ ✓ Lambda functions      │
│ ✓ Amplify app           │
└────────┬────────────────┘
         │
         ↓
Step 3: Get SAML Config
┌─────────────────────────┐
│ ./deployment/           │
│ integration.sh          │
│                         │
│ Returns:                │
│ - applicationStartURL   │
│ - applicationACSURL     │
│ - applicationSAMLAudience│
└────────┬────────────────┘
         │
         ↓
Step 4: Configure Identity Center
┌─────────────────────────────────────┐
│ IAM Identity Center Console          │
│                                      │
│ 1. Add SAML 2.0 Application         │
│ 2. Enter SAML parameters             │
│ 3. Configure attribute mapping       │
│ 4. Assign users/groups               │
│ 5. Copy SAML metadata URL            │
└────────┬────────────────────────────┘
         │
         ↓
Step 5: Link Cognito with Identity Center
┌─────────────────────────┐
│ ./deployment/cognito.sh │
│                         │
│ Enter:                  │
│ - SAML metadata URL     │
│ - Identity provider name│
└────────┬────────────────┘
         │
         ↓
Step 6: Wait for Amplify Build
┌─────────────────────────┐
│ Amplify auto-builds and │
│ generates real          │
│ aws-exports.js          │
└────────┬────────────────┘
         │
         ↓
✅ COMPLETE!
┌─────────────────────────────────────┐
│ Application live at:                 │
│ https://main.d[app-id].amplifyapp.com│
│                                      │
│ Authentication via:                  │
│ https://d-90661f7cab.awsapps.com/    │
└──────────────────────────────────────┘
```

## Authentication Flow (After Deployment)

```
┌──────────┐                                  ┌─────────────────────┐
│  User    │                                  │ TEAM App (Amplify)  │
│          │──1. Visits app URL──────────────▶│ https://main.d...   │
└──────────┘                                  └──────────┬──────────┘
                                                         │
                                                         │ 2. Click "Federated Sign In"
                                                         ↓
┌──────────┐                                  ┌─────────────────────┐
│ Identity │◀──3. Redirect to IdC Portal─────│ Cognito User Pool   │
│ Center   │                                  │ OAuth authorize     │
│ Portal   │                                  └─────────────────────┘
└────┬─────┘
     │
     │ 4. User enters credentials
     │ 5. Identity Center authenticates
     │ 6. SAML assertion generated
     ↓
┌──────────┐                                  ┌─────────────────────┐
│ Identity │──7. SAML assertion──────────────▶│ Cognito User Pool   │
│ Center   │                                  │ (validates SAML)    │
└──────────┘                                  └──────────┬──────────┘
                                                         │
                                                         │ 8. Issues JWT tokens
                                                         ↓
┌──────────┐                                  ┌─────────────────────┐
│  User    │◀─9. Redirect with tokens────────│ TEAM App            │
│ Logged In│                                  │ (authenticated)     │
└──────────┘                                  └─────────────────────┘
     │
     │ 10. User can now:
     ↓
┌─────────────────────────────────────────────────┐
│ - View dashboard                                │
│ - Request elevated access                       │
│ - Approve requests (if admin)                   │
│ - View audit logs (if auditor)                  │
│ - Manage sessions                               │
└─────────────────────────────────────────────────┘
```

## Real Configuration vs Mock Configuration

### Before Deployment (Mock - Current)
```javascript
const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_identity_pool_id": "us-east-1:00000000-0000-0000-0000-000000000000",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_PLACEHOLDER",  // ⚠️ Fake
  "aws_user_pools_web_client_id": "PLACEHOLDER_CLIENT_ID",  // ⚠️ Fake
  "oauth": {
    "domain": "placeholder-domain.auth.us-east-1.amazoncognito.com",  // ⚠️ Fake
    "redirectSignIn": "http://localhost:3000/",
    "redirectSignOut": "http://localhost:3000/",
    // ... other config
  }
};
```

### After Deployment (Real)
```javascript
const awsmobile = {
  "aws_project_region": "us-east-1",
  "aws_cognito_identity_pool_id": "us-east-1:a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "aws_cognito_region": "us-east-1",
  "aws_user_pools_id": "us-east-1_GXaUCfcno",  // ✅ Real User Pool
  "aws_user_pools_web_client_id": "2vf6faj4v3t1jdos0misu29i67",  // ✅ Real Client
  "oauth": {
    "domain": "d1s8z5724fsfj7-main.auth.us-east-1.amazoncognito.com",  // ✅ Real
    "redirectSignIn": "https://main.d1s8z5724fsfj7.amplifyapp.com/",  // ✅ Real URL
    "redirectSignOut": "https://main.d1s8z5724fsfj7.amplifyapp.com/",
    // ... other config
  },
  "aws_appsync_graphqlEndpoint": "https://xyz123.appsync-api.us-east-1.amazonaws.com/graphql",  // ✅ Real API
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
  // ... more real backend config
};
```

## Key Differences: Mock vs Real

| Feature | Mock (Current) | Real (After Deployment) |
|---------|---------------|------------------------|
| **Authentication** | ❌ Fails | ✅ Works via Identity Center |
| **User Pool** | Fake ID | Real Cognito User Pool |
| **OAuth Domain** | Placeholder | Real Cognito domain |
| **Redirect URLs** | localhost:3000 | Amplify hosted URL |
| **API Endpoint** | None | Real AppSync GraphQL API |
| **Database** | None | Real DynamoDB tables |
| **Identity Provider** | None | IAM Identity Center SAML |
| **User Groups** | None | Real groups from Identity Center |

## What Happens When You Click "Federated Sign In"

### Current (Mock Configuration)
```
User clicks button
    ↓
App tries: https://placeholder-domain.auth.us-east-1.amazoncognito.com/...
    ↓
❌ DNS not found (domain doesn't exist)
    ↓
Error: "Federated sign in not available"
```

### After Deployment (Real Configuration)
```
User clicks button
    ↓
App redirects to: https://d1s8z5724fsfj7-main.auth.us-east-1.amazoncognito.com/authorize...
    ↓
Cognito redirects to: https://d-90661f7cab.awsapps.com/start
    ↓
User logs in with Identity Center credentials
    ↓
Identity Center sends SAML assertion to Cognito
    ↓
Cognito issues JWT tokens
    ↓
✅ User redirected back to app, fully authenticated!
```

## Resources Created by CloudFormation

```
TEAM-IDC-APP CloudFormation Stack
│
├── Cognito
│   ├── User Pool
│   ├── Identity Pool
│   ├── User Pool Client
│   ├── User Pool Domain
│   └── SAML Identity Provider (linked to Identity Center)
│
├── AppSync
│   ├── GraphQL API
│   ├── Data Sources (DynamoDB)
│   └── Resolvers
│
├── DynamoDB
│   ├── Sessions Table
│   ├── Approvals Table
│   ├── Requests Table
│   └── Settings Table
│
├── Lambda Functions
│   ├── Pre-Token Generation
│   ├── Get Permission Sets
│   ├── List Groups
│   ├── Create Session
│   └── Many more...
│
├── Amplify
│   ├── App: TEAM-IDC-APP
│   ├── Branch: main
│   ├── Build configuration
│   └── Hosting (auto-deployed)
│
├── IAM Roles & Policies
│   ├── Amplify Service Role
│   ├── Lambda Execution Roles
│   ├── AppSync Service Role
│   └── Cognito Authenticated Role
│
└── CloudTrail (optional)
    └── Organization Event Data Store
```

## Summary

You're currently here: **Temporary Fix**
```
✅ App loads without crashing
❌ Authentication doesn't work (placeholder config)
```

After following the deployment guide, you'll be here: **Full Deployment**
```
✅ App loads
✅ Authentication via Identity Center works
✅ Real backend (API, database, etc.)
✅ Users can request elevated access
✅ Admins can approve requests
✅ Auditors can view logs
```

**Next Step**: Follow `DEPLOYMENT_CHECKLIST.md` to deploy! 🚀
