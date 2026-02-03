# 🚀 Quick Reference - TEAM Application Deployment

## Your Identity Center Details
```
Portal URL: https://d-90661f7cab.awsapps.com/start
Region: us-east-1
Organization: o-k3ygpfa9fk
Issuer: https://identitycenter.amazonaws.com/ssoins-7223afa5ccc151fe
```

## One-Command Deploy (After Configuration)

```bash
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment
./deploy.sh
```

## Essential Commands

### Check AWS Account
```bash
aws sts get-caller-identity
```

### Get Account ID
```bash
aws sts get-caller-identity --query Account --output text
```

### Deploy Stack
```bash
cd deployment && ./deploy.sh
```

### Check Deployment Status
```bash
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus' \
  --output text
```

### Get SAML Configuration
```bash
cd deployment && ./integration.sh
```

### Link Cognito with Identity Center
```bash
cd deployment && ./cognito.sh
```

### Get Application URL
```bash
aws amplify list-apps \
  --region us-east-1 \
  --query 'apps[?name==`TEAM-IDC-APP`].defaultDomain' \
  --output text
```

### Update Application
```bash
cd deployment && ./update.sh
```

### Destroy Application
```bash
cd deployment && ./destroy.sh
```

## Configuration Files

### deployment/parameters.sh
```bash
IDC_LOGIN_URL=https://d-90661f7cab.awsapps.com/start
REGION=us-east-1
TEAM_ACCOUNT=YOUR_ACCOUNT_ID
TEAM_ADMIN_GROUP="team-admins"
TEAM_AUDITOR_GROUP="team-auditors"
```

### src/aws-exports.js (auto-generated after deployment)
```javascript
// Real configuration replaces placeholder
const awsmobile = {
  "aws_user_pools_id": "us-east-1_XXXXXXXX",
  "oauth": {
    "domain": "dXXXXXXX-main.auth.us-east-1.amazoncognito.com"
  }
  // ... more
};
```

## Identity Center SAML Configuration

### Required Values (from integration.sh)
- **Application start URL**: `https://[cognito-domain]/authorize?...`
- **Application ACS URL**: `https://[cognito-domain]/saml2/idpresponse`
- **Application SAML audience**: `urn:amazon:cognito:sp:[user-pool-id]`

### Attribute Mappings
- Subject → `${user:subject}` (persistent)
- Email → `${user:email}` (basic)

## Troubleshooting Commands

### Check CloudFormation Events
```bash
aws cloudformation describe-stack-events \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --max-items 20
```

### Check Amplify Build Status
```bash
aws amplify list-branches \
  --app-id $(aws amplify list-apps --region us-east-1 --query 'apps[?name==`TEAM-IDC-APP`].appId' --output text) \
  --region us-east-1
```

### View Amplify Logs
```bash
aws amplify list-jobs \
  --app-id $(aws amplify list-apps --region us-east-1 --query 'apps[?name==`TEAM-IDC-APP`].appId' --output text) \
  --branch-name main \
  --region us-east-1
```

### Check Cognito User Pool
```bash
aws cognito-idp list-user-pools \
  --max-results 10 \
  --region us-east-1
```

## Important URLs

### AWS Console Links
- **IAM Identity Center**: https://console.aws.amazon.com/singlesignon/
- **CloudFormation**: https://console.aws.amazon.com/cloudformation/
- **Amplify**: https://console.aws.amazon.com/amplify/
- **Cognito**: https://console.aws.amazon.com/cognito/
- **AppSync**: https://console.aws.amazon.com/appsync/

### After Deployment
- **Application URL**: `https://main.d[app-id].amplifyapp.com`
- **Login**: Redirects to `https://d-90661f7cab.awsapps.com/start`

## Status Indicators

### CloudFormation Stack Status
- ✅ `CREATE_COMPLETE` - Deployment successful
- ⏳ `CREATE_IN_PROGRESS` - Deployment in progress
- ❌ `CREATE_FAILED` - Deployment failed
- ⏳ `UPDATE_IN_PROGRESS` - Update in progress
- ✅ `UPDATE_COMPLETE` - Update successful

### Amplify Build Status
- ✅ `SUCCEED` - Build successful
- ⏳ `RUNNING` - Build in progress
- ❌ `FAILED` - Build failed

## Common Errors

### "Stack already exists"
```bash
aws cloudformation delete-stack --stack-name TEAM-IDC-APP --region us-east-1
# Wait 5-10 minutes, then redeploy
```

### "Unable to parse config file"
```bash
aws configure
# Enter your credentials
```

### "Permission denied"
```bash
chmod +x deployment/*.sh
```

### "jq not found"
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq
```

## Deployment Time

| Step | Duration |
|------|----------|
| CloudFormation deploy | 15-20 min |
| Amplify build | 5-10 min |
| Identity Center config | 10 min |
| **Total** | **30-40 min** |

## Security Checklist

- [ ] Use dedicated AWS account (not management account)
- [ ] Enable MFA for IAM users
- [ ] Use least-privilege IAM policies
- [ ] Enable CloudTrail audit logging
- [ ] Review user access regularly
- [ ] Don't commit aws-exports.js to git
- [ ] Use strong passwords for Identity Center users
- [ ] Enable session timeout
- [ ] Monitor CloudWatch logs

## Documentation Files

- **DEPLOYMENT_CHECKLIST.md** - Step-by-step checklist
- **COMPLETE_DEPLOYMENT_GUIDE.md** - Comprehensive guide
- **DEPLOYMENT_FLOW.md** - Visual architecture and flow
- **QUICK_REFERENCE.md** - This file
- **AUTH_FIX_SUMMARY.md** - Authentication fix details

## Support

### Documentation Folders
- `/docs/docs/deployment/` - Deployment guides
- `/docs/docs/configuration/` - Configuration guides
- `/docs/docs/guides/` - User guides
- `/docs/docs/overview/` - Architecture and security

### Key Files
- `deployment/deploy.sh` - Main deployment script
- `deployment/integration.sh` - Get SAML config
- `deployment/cognito.sh` - Configure Cognito
- `deployment/parameters.sh` - Configuration parameters

## Quick Test After Deployment

1. **Open app**: `https://main.d[app-id].amplifyapp.com`
2. **Click**: "Federated Sign In"
3. **Redirects to**: `https://d-90661f7cab.awsapps.com/start`
4. **Sign in**: With Identity Center credentials
5. **Success**: You're back in TEAM app, authenticated!

## Next Steps After Deployment

1. ✅ Test authentication
2. ✅ Configure email notifications (SES)
3. ✅ Set up approval workflows
4. ✅ Test permission set requests
5. ✅ Configure session limits
6. ✅ Train admin users
7. ✅ Train auditor users
8. ✅ Enable audit logging
9. ✅ Set up monitoring
10. ✅ Document your configuration

---

**Ready to deploy?** → Start with `DEPLOYMENT_CHECKLIST.md`

**Need details?** → Read `COMPLETE_DEPLOYMENT_GUIDE.md`

**Need visuals?** → Check `DEPLOYMENT_FLOW.md`
