# Quick Start Deployment Checklist

## Before You Start

Make sure you have:
- [ ] AWS CLI installed and configured
- [ ] Administrator access to AWS account
- [ ] git-remote-codecommit installed
- [ ] jq installed

## Step-by-Step Checklist

### 1. Update Parameters ⏱️ 5 minutes

```bash
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment
nano parameters.sh
```

**Update these values**:
```bash
IDC_LOGIN_URL=https://d-90661f7cab.awsapps.com/start  # ✅ Already correct!
REGION=us-east-1  # ✅ Already correct!
TEAM_ACCOUNT=YOUR_ACCOUNT_ID  # ⚠️ CHANGE THIS
ORG_MASTER_PROFILE=default  # Your AWS profile
TEAM_ACCOUNT_PROFILE=default  # Your AWS profile
TEAM_ADMIN_GROUP="team-admins"  # Your admin group name
TEAM_AUDITOR_GROUP="team-auditors"  # Your auditor group name
CLOUDTRAIL_AUDIT_LOGS=none  # Or your CloudTrail ARN
```

Save and exit (Ctrl+X, Y, Enter)

### 2. Create Groups in Identity Center ⏱️ 5 minutes

1. Go to: https://console.aws.amazon.com/singlesignon/
2. Click **Groups** → **Create group**
3. Create two groups:
   - Name: `team-admins`, Description: "TEAM Application Administrators"
   - Name: `team-auditors`, Description: "TEAM Application Auditors"
4. Add users to these groups

### 3. Get Your AWS Account ID ⏱️ 1 minute

```bash
aws sts get-caller-identity --query Account --output text
```

Copy this number and update `TEAM_ACCOUNT` in parameters.sh

### 4. Deploy CloudFormation Stack ⏱️ 15-20 minutes

```bash
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment
chmod +x deploy.sh
./deploy.sh
```

**Watch for**:
- Repository creation: `team-idc-app`
- Stack creation: `TEAM-IDC-APP`
- Status: `CREATE_COMPLETE`

**Monitor progress**:
```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus' \
  --output text
```

### 5. Get SAML Configuration ⏱️ 2 minutes

After stack completes:

```bash
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment
chmod +x integration.sh
./integration.sh
```

**📋 Copy these values**:
- [ ] applicationStartURL
- [ ] applicationACSURL
- [ ] applicationSAMLAudience

### 6. Configure Identity Center SAML ⏱️ 10 minutes

1. Go to: https://console.aws.amazon.com/singlesignon/
2. **Applications** → **Add application**
3. Select **Add custom SAML 2.0 Application**
4. **Display name**: `TEAM IDC APP`
5. **📋 SAVE**: Copy the "SAML metadata file URL"
6. **Application start URL**: Paste `applicationStartURL` from step 5
7. **Application ACS URL**: Paste `applicationACSURL` from step 5
8. **Application SAML audience**: Paste `applicationSAMLAudience` from step 5
9. Click **Submit**
10. **Actions** → **Edit attribute mappings**:
    - Subject: `${user:subject}` (persistent)
    - Email: `${user:email}` (basic)
11. **Assign users**: Add `team-admins` and `team-auditors` groups

### 7. Link Cognito with Identity Center ⏱️ 3 minutes

```bash
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment
chmod +x cognito.sh
./cognito.sh
```

**When prompted**:
- Paste the SAML metadata URL (from step 6, item 5)
- Identity provider name: `team`

### 8. Get Application URL ⏱️ 2 minutes

```bash
aws amplify list-apps --region us-east-1 --query 'apps[?name==`TEAM-IDC-APP`].defaultDomain' --output text
```

Your URL will be: `https://main.d[app-id].amplifyapp.com`

**Wait for Amplify build to complete** (5-10 minutes):
```bash
# Check build status
aws amplify list-branches \
  --app-id $(aws amplify list-apps --region us-east-1 --query 'apps[?name==`TEAM-IDC-APP`].appId' --output text) \
  --region us-east-1
```

### 9. Test! ⏱️ 5 minutes

1. Open the Amplify URL in browser
2. Click **Federated Sign In**
3. You should be redirected to:
   ```
   https://d-90661f7cab.awsapps.com/start
   ```
4. Sign in with a user that's in `team-admins` or `team-auditors` group
5. You should be redirected back to TEAM application
6. Verify you can access the dashboard

## ✅ Success Criteria

After deployment, you should have:
- [ ] CloudFormation stack: `CREATE_COMPLETE`
- [ ] Amplify app built and deployed
- [ ] Identity Center SAML app configured
- [ ] Users can sign in via Identity Center
- [ ] Admin users can access admin features
- [ ] Auditor users can access audit features

## Common Issues & Quick Fixes

### "No default AWS profile"
```bash
aws configure
# Enter your AWS credentials
```

### "Permission denied: deploy.sh"
```bash
chmod +x deployment/*.sh
```

### "Stack already exists"
```bash
# Delete and redeploy
aws cloudformation delete-stack --stack-name TEAM-IDC-APP --region us-east-1
# Wait 5-10 minutes, then run deploy.sh again
```

### "User not found after login"
Make sure:
1. User is assigned to TEAM application in Identity Center (step 6, item 11)
2. User is in either `team-admins` or `team-auditors` group

### "Cannot find module jq"
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

## Total Time Estimate

| Step | Time |
|------|------|
| Update parameters | 5 min |
| Create groups | 5 min |
| Deploy stack | 15-20 min |
| Get SAML config | 2 min |
| Configure Identity Center | 10 min |
| Link Cognito | 3 min |
| Wait for Amplify build | 5-10 min |
| Test | 5 min |
| **Total** | **50-65 minutes** |

## Next Steps After Deployment

1. **Update local environment**:
   ```bash
   cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team
   amplify pull
   npm start
   ```

2. **Test locally** with real backend

3. **Configure additional features**:
   - Email notifications (SES)
   - Custom approval workflows
   - Session duration limits
   - Audit logging

## Need Detailed Instructions?

See `COMPLETE_DEPLOYMENT_GUIDE.md` for comprehensive step-by-step instructions with troubleshooting.

---

**Ready?** Start with Step 1! 🚀
