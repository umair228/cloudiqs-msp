# Quick Deployment Guide - Next Steps

## Your Current Situation

You have:
- ✅ Code repository with latest changes
- ✅ Two git remotes configured:
  - `codecommit` → AWS CodeCommit (triggers Amplify builds)
  - `origin` → GitHub (source control)

## What You Need to Do: Redeploy Latest Changes

### The Simple Answer: Push to CodeCommit

The **quickest and most common redeployment** is:

```bash
# This triggers AWS Amplify to rebuild and deploy your application
git push codecommit main
```

That's it! AWS Amplify will automatically:
1. Detect the push to CodeCommit
2. Pull the latest code
3. Run `npm install`
4. Run `npm run build`
5. Deploy to your environment
6. Make it live (8-15 minutes total)

### Monitor the Build

Watch the progress:

1. **Via AWS Console**: 
   - Go to AWS Amplify Console
   - Select "TEAM-IDC-APP"
   - Click "main" branch
   - Watch the build pipeline

2. **Via CLI**:
   ```bash
   # Get build status
   aws amplify list-jobs --app-id <your-app-id> --branch-name main --region us-east-1
   ```

### When You Need More Than Just a Push

#### If You Changed GraphQL Schema

After pushing to CodeCommit, also run:

```bash
amplify push
```

This updates:
- DynamoDB tables
- AppSync API
- Lambda resolvers

#### If You Changed Infrastructure (template.yml)

After pushing to CodeCommit, also run:

```bash
cd deployment
./update.sh
```

This updates:
- CloudFormation stack
- AWS resources (IAM, Lambda, etc.)

---

## Complete Redeployment Workflow

### Step 1: Prepare

```bash
# Make sure you're on the right branch
git branch

# Check what's changed
git status
git log --oneline -5
```

### Step 2: Push to GitHub (Optional - for backup)

```bash
git push origin main
```

### Step 3: Push to CodeCommit (Required - triggers deployment)

```bash
git push codecommit main
```

### Step 4: Wait for Build to Complete

**Expected time**: 8-15 minutes

**Check status in Amplify Console**

### Step 5: Verify Deployment

Open your TEAM application URL and test:
- Application loads
- Login works
- Your changes are visible
- Core functionality works

---

## Common Scenarios

### Scenario 1: "I just changed some UI/React code"

```bash
git push codecommit main
# Wait for Amplify build
# Done!
```

### Scenario 2: "I added new fields to the database"

```bash
git push codecommit main    # Deploy frontend
amplify push               # Update backend schema
# Done!
```

### Scenario 3: "I modified IAM roles or Lambda functions"

```bash
git push codecommit main    # Deploy frontend
cd deployment
./update.sh                # Update CloudFormation
# Done!
```

### Scenario 4: "I'm not sure what I changed"

```bash
# Review changes
git diff HEAD~1

# Deploy everything to be safe
git push codecommit main    # Frontend
amplify push               # Schema (if needed)
cd deployment
./update.sh                # Infrastructure (if needed)
```

---

## Troubleshooting Quick Fixes

### Problem: "git push codecommit main" fails

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CodeCommit access
aws codecommit get-repository --repository-name team-idc-app --region us-east-1

# Re-add remote if needed
git remote remove codecommit
git remote add codecommit codecommit::us-east-1://team-idc-app
git push codecommit main
```

### Problem: Build fails in Amplify

1. Check Amplify Console for error details
2. Try building locally: `npm run build`
3. Fix errors and push again: `git push codecommit main`

### Problem: Changes not visible after deployment

1. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check Amplify Console - verify latest build is deployed
4. Check build ID matches in Amplify

### Problem: Old errors in CloudWatch logs

- This is normal - old logs remain
- Focus on logs timestamped AFTER your deployment
- Filter by timestamp to see only new logs

---

## Emergency Rollback

If something breaks:

```bash
# Option 1: Revert the commit
git revert HEAD
git push codecommit main

# Option 2: Use Amplify Console
# Go to Amplify → TEAM-IDC-APP → main branch
# Find previous successful build → Click "Redeploy this version"
```

---

## Your Next Action

Based on your question "what should be my next move to redeploy the latest stuff":

### Do This Now:

```bash
# 1. Verify you're ready
git status
git log --oneline -3

# 2. Push to CodeCommit (this is the key step!)
git push codecommit main

# 3. Monitor the build in AWS Amplify Console
# Open: https://console.aws.amazon.com/amplify/
# Select: TEAM-IDC-APP → main branch

# 4. Wait 8-15 minutes for build to complete

# 5. Test your application
# Open your TEAM application URL and verify changes
```

### If You Have MSP Features

Since you have MSP multi-customer features, after deployment:

1. Login as Admin
2. Go to Administration → Customers
3. Verify customer management works
4. Test creating a customer organization
5. Test account assignment to customers

---

## Need More Help?

- **Detailed Guide**: See [REDEPLOYMENT_GUIDE.md](REDEPLOYMENT_GUIDE.md)
- **MSP Setup**: See [docs/MSP_SETUP_GUIDE.md](docs/MSP_SETUP_GUIDE.md)
- **Deployment Checklist**: See [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)

---

## Summary

**Bottom Line**: Your next move to redeploy is:

```bash
git push codecommit main
```

This will trigger AWS Amplify to automatically rebuild and deploy your application with the latest changes. Monitor the build in the Amplify Console and verify when complete.

That's it! 🚀
