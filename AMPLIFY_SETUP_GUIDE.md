# Amplify Setup Guide - Fix "Current environment cannot be determined"

## Problem

When running `amplify push`, you get:
```
🛑 Current environment cannot be determined.
Resolution: Use 'amplify init' in the root of your app directory to create a new environment.
```

## Root Cause

The Amplify CLI cannot find the **local environment configuration**. The project has backend configuration (`amplify/backend/`) but is missing local environment initialization files.

---

## Solution: Initialize Amplify Environment

### Prerequisites

Before starting, ensure you have:
- ✅ AWS account access
- ✅ AWS CLI configured (`aws configure`)
- ✅ Amplify CLI installed (`npm install -g @aws-amplify/cli`)
- ✅ AWS credentials with appropriate permissions

### Step 1: Verify AWS CLI Configuration

```bash
# Check if AWS CLI is configured
aws sts get-caller-identity

# Should return your AWS account ID, user ARN, etc.
# If this fails, run: aws configure
```

### Step 2: Initialize Amplify Environment

Run this command in the project root:

```bash
amplify init
```

You'll be prompted with several questions. Here are the recommended answers:

```
? Enter a name for the environment
  → dev (or staging, prod - your choice)

? Choose your default editor:
  → Visual Studio Code (or your preference)

? Choose the type of app that you're building
  → javascript

? What javascript framework are you using
  → react

? Source Directory Path:
  → src

? Distribution Directory Path:
  → build

? Build Command:
  → npm run-script build

? Start Command:
  → npm run-script start

? Do you want to use an AWS profile?
  → Yes

? Please choose the profile you want to use
  → default (or your AWS profile name)
```

### Step 3: Wait for Initialization

Amplify will:
1. Create CloudFormation stack
2. Set up IAM roles
3. Initialize the environment locally
4. Create `amplify/team-provider-info.json`

This takes **2-5 minutes**.

### Step 4: Deploy Backend Resources

After initialization completes:

```bash
amplify push
```

You'll see a summary of changes:
```
| Category | Resource name        | Operation | Provider plugin   |
| -------- | -------------------- | --------- | ----------------- |
| Auth     | teamidcapp           | Create    | awscloudformation |
| Api      | team                 | Create    | awscloudformation |
| Function | teamRouter           | Create    | awscloudformation |
| Function | teamNotifications    | Create    | awscloudformation |
... (and many more)

? Are you sure you want to continue?
  → Yes
```

Deployment takes **10-20 minutes** (lots of Lambda functions and DynamoDB tables).

### Step 5: Verify Deployment

After `amplify push` completes:

```bash
# Check status
amplify status

# List resources
aws dynamodb list-tables | grep team
aws lambda list-functions | grep team

# Verify aws-exports.js was generated
ls -la src/aws-exports.js
```

---

## What Gets Created

### AWS Resources
- **Cognito User Pool** - For authentication
- **AppSync GraphQL API** - For data operations
- **20+ Lambda Functions** - Backend logic
- **DynamoDB Tables** - Data storage
- **IAM Roles** - Permissions
- **S3 Bucket** - Deployment artifacts

### Local Files Created
- `amplify/team-provider-info.json` - Environment config (gitignored)
- `amplify/#current-cloud-backend/` - Deployed state
- `src/aws-exports.js` - Frontend configuration (auto-generated, gitignored)

---

## Common Issues & Solutions

### Issue 1: "AWS credentials not configured"

**Error**: `Unable to get AWS credentials`

**Solution**:
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Default output format: json
```

### Issue 2: "Not authorized to perform: cloudformation:CreateStack"

**Error**: Permission denied errors

**Solution**: Your AWS user needs these permissions:
- CloudFormation (full access)
- IAM (create/manage roles)
- Lambda (create/manage functions)
- DynamoDB (create/manage tables)
- AppSync (create/manage APIs)
- Cognito (create/manage user pools)

Ask your AWS admin for `PowerUserAccess` + `IAMFullAccess` policies.

### Issue 3: "Region is not supported"

**Error**: Some AWS services not available

**Solution**: Use one of these regions:
- `us-east-1` (N. Virginia) - Recommended
- `us-west-2` (Oregon)
- `eu-west-1` (Ireland)

### Issue 4: "amplify init" asks for environment but already exists

**Solution**:
```bash
# Pull existing environment
amplify pull

# Or create new environment
amplify env add
```

### Issue 5: Deployment fails halfway

**Solution**:
```bash
# Check what failed
amplify status

# Try again (Amplify is idempotent)
amplify push --force
```

---

## After Successful Deployment

### 1. Verify Application Works

```bash
npm start
# Should load without errors
# Authentication should work
```

### 2. Test Features

- ✅ Sign in with Federated Identity
- ✅ Create customers
- ✅ Create access requests
- ✅ Database operations work

### 3. Configure Additional Services

**Email Notifications (SES)**:
```bash
# Verify sender email
aws ses verify-email-identity --email-address noreply@yourdomain.com

# Check verification status
aws ses get-identity-verification-attributes \
  --identities noreply@yourdomain.com
```

**AI Summaries (Bedrock)**:
```bash
# Request model access in AWS Console
# Bedrock > Model access > Request access to Claude 3
```

---

## Quick Reference

### Essential Commands

```bash
# Initialize (first time)
amplify init

# Deploy changes
amplify push

# Check status
amplify status

# View environments
amplify env list

# Pull environment
amplify pull

# Add new environment
amplify env add

# Delete environment
amplify env remove <env-name>

# View CloudFormation stack
amplify console
```

### File Locations

```
amplify/
├── .config/
│   └── project-config.json          # Project settings
├── backend/
│   ├── api/                          # GraphQL API
│   ├── auth/                         # Cognito config
│   ├── function/                     # Lambda functions
│   └── backend-config.json           # Backend resources
├── team-provider-info.json           # Environment secrets (gitignored)
└── #current-cloud-backend/           # Deployed state

src/
└── aws-exports.js                    # Generated config (gitignored)
```

---

## Timeline

| Step | Duration | Description |
|------|----------|-------------|
| AWS Configure | 2 min | Set up credentials |
| amplify init | 3-5 min | Initialize environment |
| amplify push | 10-20 min | Deploy all resources |
| SES setup | 2 min | Verify email |
| Testing | 5 min | Verify everything works |
| **Total** | **20-35 min** | Complete setup |

---

## Need Help?

### Amplify CLI Documentation
- [Getting Started](https://docs.amplify.aws/cli/start/install/)
- [Environment Management](https://docs.amplify.aws/cli/teams/overview/)
- [Troubleshooting](https://docs.amplify.aws/cli/project/troubleshooting/)

### Check Logs
```bash
# Amplify logs
cat ~/.amplify/logs/*.log

# CloudFormation events
aws cloudformation describe-stack-events \
  --stack-name amplify-teamidcapp-dev-XXXXX
```

### Get Support
- Amplify Discord: https://discord.gg/amplify
- AWS Forums: https://forums.aws.amazon.com/forum.jspa?forumID=314
- GitHub Issues: https://github.com/aws-amplify/amplify-cli/issues

---

## Summary

**To fix "Current environment cannot be determined":**

1. Run `amplify init` (3-5 minutes)
2. Run `amplify push` (10-20 minutes)
3. Test with `npm start`
4. Configure SES and Bedrock (optional)

**Result**: Fully deployed CloudiQS MSP application with working authentication, database, and all features.

**Total time**: 20-35 minutes

---

## Next Steps After Deployment

1. ✅ Test authentication flow
2. ✅ Create test customers
3. ✅ Test access request workflow
4. ✅ Configure email notifications
5. ✅ Set up AI summaries (Bedrock)
6. ✅ Add production customers
7. ✅ Monitor CloudWatch logs
8. ✅ Go live!

See **MSP_README.md** for feature documentation and **COMPLETE_TESTING_GUIDE.md** for testing instructions.
