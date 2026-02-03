# Redeployment Guide for CloudiQS MSP TEAM Application

## Overview

You have successfully made changes to the CloudiQS MSP repository. This guide provides step-by-step instructions for redeploying your latest changes to AWS.

## Current Setup

Based on your git remotes:
```bash
codecommit  https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app (fetch/push)
origin      https://github.com/umair228/cloudiqs-msp.git (fetch/push)
```

You have:
- **GitHub (origin)**: Source code repository
- **CodeCommit (codecommit)**: AWS deployment repository that triggers Amplify builds

## Prerequisites

Before redeploying, ensure you have:

1. ✅ AWS CLI configured with appropriate credentials
2. ✅ Git configured to access CodeCommit (git-remote-codecommit helper)
3. ✅ Amplify CLI installed (if making schema changes): `npm install -g @aws-amplify/cli`
4. ✅ Appropriate AWS permissions for:
   - CodeCommit repository access
   - CloudFormation stack updates
   - Amplify console access
   - DynamoDB, AppSync, Lambda (via CloudFormation)

## Redeployment Options

You have three main deployment options depending on what changed:

### Option 1: Code-Only Changes (Frontend/UI Changes)
**Use when:** You've modified React components, UI, or frontend code only.

### Option 2: Schema Changes (GraphQL/Database Changes)
**Use when:** You've modified `amplify/backend/api/team/schema.graphql` or backend configuration.

### Option 3: Infrastructure Changes (CloudFormation)
**Use when:** You've modified `deployment/template.yml` or AWS infrastructure configuration.

---

## Step-by-Step Redeployment Process

### Step 1: Verify Your Changes

First, ensure all your changes are committed to your current branch:

```bash
# Check current status
git status

# View recent commits
git log --oneline -5

# Ensure you're on the correct branch
git branch
```

### Step 2: Push to GitHub (Optional but Recommended)

Keep your GitHub repository synchronized:

```bash
# Push to GitHub origin
git push origin main

# Or push your current branch
git push origin <your-branch-name>
```

### Step 3: Push to CodeCommit

This is the critical step that triggers AWS Amplify to rebuild and redeploy:

```bash
# Push to CodeCommit - this triggers Amplify build
git push codecommit main
```

If you're working on a different branch, you may need to push that branch and then update the main branch:

```bash
# Option A: Push your branch to CodeCommit
git push codecommit <your-branch-name>:main

# Option B: Merge to main first, then push
git checkout main
git merge <your-branch-name>
git push codecommit main
```

### Step 4: Monitor Amplify Build

After pushing to CodeCommit, AWS Amplify will automatically trigger a build.

**Monitor via AWS Console:**

1. Navigate to AWS Amplify Console
2. Select the TEAM-IDC-APP application
3. Click on the "main" branch
4. Monitor the build progress:
   - Provision (1-2 min)
   - Build (5-10 min)
   - Deploy (2-3 min)
   - Verify (1 min)

**Monitor via CLI:**

```bash
# Get the Amplify App ID from CloudFormation
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
  --output text

# List recent builds (replace <app-id> with your app ID)
aws amplify list-jobs \
  --app-id <app-id> \
  --branch-name main \
  --region us-east-1
```

### Step 5: Deploy Schema Changes (If Applicable)

**Only needed if you modified GraphQL schema or backend configuration.**

```bash
# Navigate to project root
cd /path/to/cloudiqs-msp

# Check Amplify status
amplify status

# Push schema changes to AWS
amplify push

# When prompted:
# - Review and confirm changes: Yes
# - Update code for GraphQL API: Yes
# - Generate GraphQL operations: No (unless you need them)
```

This will:
- Update DynamoDB tables
- Update AppSync GraphQL API
- Deploy Lambda resolvers
- Update IAM policies

### Step 6: Update CloudFormation Stack (If Needed)

**Only needed if you modified infrastructure in `deployment/template.yml`.**

Before updating, configure your parameters:

```bash
cd deployment

# Copy the template if you haven't already
cp parameters-template.sh parameters.sh

# Edit parameters.sh with your values
nano parameters.sh
```

Update the stack:

```bash
# Using the deployment script
cd deployment
./update.sh

# Or manually with AWS CLI
aws cloudformation deploy \
  --region us-east-1 \
  --template-file template.yml \
  --stack-name TEAM-IDC-APP \
  --parameter-overrides \
    Login=$IDC_LOGIN_URL \
    CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
    teamAdminGroup="$TEAM_ADMIN_GROUP" \
    teamAuditGroup="$TEAM_AUDITOR_GROUP" \
    teamAccount="$TEAM_ACCOUNT" \
    customRepository="Yes" \
    customRepositorySecretName="$SECRET_NAME" \
  --capabilities CAPABILITY_NAMED_IAM
```

---

## Post-Deployment Verification

### 1. Verify Application is Running

```bash
# Get the Amplify app URL
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppUrl`].OutputValue' \
  --output text
```

Open the URL in your browser and verify:
- ✅ Application loads without errors
- ✅ Login works with IAM Identity Center
- ✅ Your changes are visible

### 2. Test Core Functionality

As an **Admin user**, test:
- [ ] Navigate to Administration → Customers (if MSP features are active)
- [ ] Create a test customer (if applicable)
- [ ] View existing data loads correctly

As a **Regular user**, test:
- [ ] Navigate to Requests → Create request
- [ ] Form displays correctly with your changes
- [ ] Can submit a test request

As an **Approver**, test:
- [ ] Navigate to Approvals → Approve requests
- [ ] Pending requests display correctly
- [ ] Approval workflow functions

As an **Auditor**, test:
- [ ] Navigate to Audit → Elevated access
- [ ] Audit logs display correctly
- [ ] Export functionality works

### 3. Check CloudWatch Logs

Monitor for errors:

```bash
# AppSync API logs
aws logs tail /aws/appsync/apis/<api-id> --follow --region us-east-1

# Lambda function logs
aws logs tail /aws/lambda/TEAM-IDC-APP-SessionsTable --follow --region us-east-1
```

### 4. Verify DynamoDB Tables

Check that tables are healthy:

```bash
# List tables
aws dynamodb list-tables --region us-east-1 | grep -i team

# Describe a table
aws dynamodb describe-table --table-name Customers-<env> --region us-east-1
```

---

## Troubleshooting

### Issue: Amplify Build Fails

**Symptoms**: Build fails during provision, build, or deploy phase.

**Check:**
1. View build logs in Amplify Console
2. Common issues:
   - Node.js version mismatch
   - Missing dependencies in package.json
   - Build script errors

**Fix:**
```bash
# Ensure dependencies are correct
npm install
npm run build

# If successful locally, check Amplify build settings
amplify console
```

### Issue: Schema Changes Not Reflected

**Symptoms**: New fields or tables don't appear in the application.

**Check:**
1. Was `amplify push` executed?
2. Check AppSync console for schema updates
3. Check DynamoDB console for new tables

**Fix:**
```bash
# Re-run amplify push
amplify push --force

# Clear browser cache and reload application
```

### Issue: "Access Denied" or 401 Errors

**Symptoms**: Users can't access the application or specific features.

**Check:**
1. IAM Identity Center groups configured correctly
2. Cognito user pool has correct groups
3. AppSync authorization rules in schema

**Fix:**
- Verify user is member of correct IAM Identity Center group
- Check CloudWatch logs for authorization errors
- Review GraphQL schema authorization directives

### Issue: Old Version Still Showing

**Symptoms**: Changes not visible even after successful build.

**Fix:**
```bash
# Clear CDN cache (if using CloudFront)
# Clear browser cache (hard refresh: Ctrl+Shift+R)

# Verify build ID in Amplify console matches deployed version
aws amplify get-branch --app-id <app-id> --branch-name main --region us-east-1
```

### Issue: CodeCommit Push Fails

**Symptoms**: Cannot push to codecommit remote.

**Fix:**
```bash
# Check git-remote-codecommit is installed
pip3 install git-remote-codecommit

# Check AWS credentials
aws sts get-caller-identity

# Verify CodeCommit permissions
aws codecommit get-repository --repository-name team-idc-app --region us-east-1

# Re-add remote if needed
git remote remove codecommit
git remote add codecommit codecommit::us-east-1://team-idc-app
```

---

## Rollback Procedures

### Emergency Rollback (Revert to Previous Version)

If the deployment causes issues:

**Option 1: Revert Git Commit**
```bash
# Find the commit to revert to
git log --oneline

# Revert to previous commit
git revert HEAD

# Push to both remotes
git push origin main
git push codecommit main
```

**Option 2: Deploy Previous Build**
```bash
# In Amplify Console:
# 1. Navigate to the branch
# 2. Find the previous successful build
# 3. Click "Redeploy this version"
```

**Option 3: Rollback CloudFormation Stack**
```bash
# List stack events to find previous version
aws cloudformation describe-stack-events \
  --stack-name TEAM-IDC-APP \
  --region us-east-1

# If needed, delete and recreate from backup
# (Only in extreme cases - data loss may occur)
```

---

## Quick Reference

### Common Commands

```bash
# Check what needs to be deployed
git status
amplify status

# Deploy frontend changes
git push codecommit main

# Deploy schema changes
amplify push

# Deploy infrastructure changes
cd deployment && ./update.sh

# View application
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Deployment Checklist

Before pushing to production:

- [ ] All changes committed and tested locally
- [ ] Code builds successfully (`npm run build`)
- [ ] Unit tests pass (if applicable)
- [ ] Schema changes tested with `amplify mock api`
- [ ] Reviewed deployment documentation
- [ ] Notified team of deployment
- [ ] Monitoring and logs ready
- [ ] Rollback plan prepared

After deployment:

- [ ] Verify application loads
- [ ] Test critical user workflows
- [ ] Check CloudWatch logs for errors
- [ ] Monitor for 15-30 minutes
- [ ] Update deployment notes
- [ ] Notify team of completion

---

## Next Steps

Based on your current situation with changes ready to deploy:

### Recommended Next Steps:

1. **Review your changes**: `git log --oneline -5` and `git diff HEAD~1`

2. **Push to CodeCommit to trigger rebuild**:
   ```bash
   git push codecommit main
   ```

3. **Monitor the Amplify build** in AWS Console (builds typically take 8-15 minutes)

4. **If you have schema changes**, run:
   ```bash
   amplify push
   ```

5. **Verify deployment** by testing the application URL

6. **Monitor CloudWatch logs** for the first 15-30 minutes

### If Issues Occur:

- Check Amplify build logs first
- Review CloudWatch logs for errors
- Test rollback procedure if needed
- Refer to troubleshooting section above

---

## Additional Resources

- **MSP Setup Guide**: [docs/MSP_SETUP_GUIDE.md](docs/MSP_SETUP_GUIDE.md)
- **Deployment Checklist**: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)
- **Original TEAM Documentation**: https://aws-samples.github.io/iam-identity-center-team/
- **AWS Amplify Documentation**: https://docs.amplify.aws/
- **AWS CloudFormation Documentation**: https://docs.aws.amazon.com/cloudformation/

---

## Support

If you encounter issues:

1. Check CloudWatch logs for error details
2. Review the troubleshooting section above
3. Consult the MSP setup guide
4. Check AWS service health dashboard
5. Open an issue in the GitHub repository

**Last Updated**: 2024  
**Version**: 1.0
