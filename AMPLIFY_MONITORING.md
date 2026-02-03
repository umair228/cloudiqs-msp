# Amplify Rebuild Monitoring and Triggering Guide

## You Pushed to CodeCommit - Now What?

After successfully pushing to CodeCommit, AWS Amplify should automatically rebuild your application. This guide helps you:
1. Verify your push reached CodeCommit
2. Check if Amplify is building
3. Monitor the build progress
4. Manually trigger a rebuild if needed
5. Troubleshoot when builds don't start

---

## Step 1: Verify Your Push Reached CodeCommit

### Quick Check

```bash
# Verify your push succeeded (should show recent commit)
aws codecommit get-branch \
  --repository-name team-idc-app \
  --branch-name main \
  --region us-east-1
```

**What to look for:**
- `commitId`: Should match your latest commit
- `lastModifiedDate`: Should be very recent (just now)

### If AWS Command Fails

If you get an error like "Unable to locate credentials" or empty output:

```bash
# Your AWS credentials expired or aren't configured
# Re-configure them:
aws configure

# Enter your credentials again
# Then retry the check above
```

### View Recent Commits

```bash
# See the last 5 commits in CodeCommit
aws codecommit get-differences \
  --repository-name team-idc-app \
  --before-commit-specifier main \
  --region us-east-1
```

---

## Step 2: Check Amplify Build Status

### Method 1: AWS Console (Easiest - Visual)

1. **Open AWS Amplify Console**
   - Go to: https://console.aws.amazon.com/amplify/
   - Or search "Amplify" in AWS Console

2. **Select Your App**
   - Click on "TEAM-IDC-APP"

3. **Check Build Status**
   - Click on "main" branch
   - Look for recent build activity
   - Status will be one of:
     - 🟢 **SUCCEED** - Build completed successfully
     - 🟡 **IN_PROGRESS** - Currently building
     - 🔴 **FAILED** - Build failed (check logs)
     - ⚪ **PENDING** - Waiting to start

4. **View Build Details**
   - Click on a build to see:
     - Provision phase
     - Build phase
     - Deploy phase
     - Test phase
   - Each phase shows logs and duration

### Method 2: AWS CLI (Quick Status)

```bash
# Get Amplify App ID
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
  --output text
```

Save this App ID (looks like: `d123abc456def`)

```bash
# Check recent builds (replace <app-id> with your App ID)
aws amplify list-jobs \
  --app-id <app-id> \
  --branch-name main \
  --region us-east-1 \
  --max-results 5
```

**What you'll see:**
```json
{
  "jobSummaries": [
    {
      "jobId": "1",
      "commitId": "abc123...",
      "commitTime": "2026-02-03T14:00:00Z",
      "status": "SUCCEED",
      "startTime": "2026-02-03T14:01:00Z",
      "endTime": "2026-02-03T14:15:00Z"
    }
  ]
}
```

### Method 3: Quick Status Script

Save this as `check-build.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Checking Amplify build status..."
echo ""

# Get App ID
APP_ID=$(aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
  --output text)

echo "App ID: $APP_ID"
echo ""

# Get latest builds
echo "Recent builds:"
aws amplify list-jobs \
  --app-id $APP_ID \
  --branch-name main \
  --region us-east-1 \
  --max-results 3 \
  --query 'jobSummaries[*].[jobId,status,commitTime,startTime]' \
  --output table

echo ""
echo "For detailed logs, go to:"
echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/main"
```

Run it:
```bash
chmod +x check-build.sh
./check-build.sh
```

---

## Step 3: Understanding Build Timeline

### Typical Build Flow

```
Push to CodeCommit
    ↓
Within 1-2 minutes: Amplify detects push
    ↓
Build starts automatically
    ↓
Phase 1: PROVISION (1-2 min)
  - Set up build environment
  - Clone repository
    ↓
Phase 2: BUILD (5-10 min)
  - npm install
  - npm run build
    ↓
Phase 3: DEPLOY (2-3 min)
  - Upload to hosting
  - Configure CDN
    ↓
Phase 4: VERIFY (1 min)
  - Health checks
    ↓
✅ SUCCEED - Application deployed!
```

**Total time:** 8-15 minutes typically

### What's Normal

- ⏱️ **2-3 minute delay** between push and build start is normal
- ⏱️ **10-15 minutes** for full build is typical
- ⏱️ **First build** might take longer (20+ minutes)

### What's Not Normal

- ⚠️ **No build after 5 minutes** - Check if webhook is configured
- ⚠️ **Build stuck in PENDING** - Check CloudFormation stack status
- ⚠️ **Build immediately fails** - Check build logs for errors

---

## Step 4: Manually Trigger a Rebuild

### When to Manually Trigger

You need to manually trigger when:
- No build started after 5+ minutes
- You want to rebuild without new commits
- Previous build failed and you fixed the issue
- Testing deployment process

### Method 1: Via AWS Console

1. Go to AWS Amplify Console
2. Select "TEAM-IDC-APP"
3. Click on "main" branch
4. Click **"Redeploy this version"** button
5. Confirm the rebuild

### Method 2: Via AWS CLI

```bash
# Get App ID
APP_ID=$(aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
  --output text)

# Trigger new build
aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1

echo "✅ Build triggered!"
echo "Monitor at: https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/main"
```

### Method 3: Quick Trigger Script

Save as `trigger-rebuild.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Triggering Amplify rebuild..."

# Get App ID
APP_ID=$(aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
  --output text)

# Start build
JOB_ID=$(aws amplify start-job \
  --app-id $APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --region us-east-1 \
  --query 'jobSummary.jobId' \
  --output text)

echo "✅ Build triggered! Job ID: $JOB_ID"
echo ""
echo "Monitor progress:"
echo "  Console: https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/main"
echo ""
echo "Or check status with:"
echo "  aws amplify get-job --app-id $APP_ID --branch-name main --job-id $JOB_ID --region us-east-1"
```

Run it:
```bash
chmod +x trigger-rebuild.sh
./trigger-rebuild.sh
```

---

## Step 5: Monitor Build Progress

### Watch Build in Real-Time

```bash
# Get App ID
APP_ID=$(aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' \
  --output text)

# Get latest job ID
JOB_ID=$(aws amplify list-jobs \
  --app-id $APP_ID \
  --branch-name main \
  --region us-east-1 \
  --max-results 1 \
  --query 'jobSummaries[0].jobId' \
  --output text)

# Watch build status (run this in a loop)
while true; do
  STATUS=$(aws amplify get-job \
    --app-id $APP_ID \
    --branch-name main \
    --job-id $JOB_ID \
    --region us-east-1 \
    --query 'job.summary.status' \
    --output text)
  
  echo "$(date): Build status: $STATUS"
  
  if [[ "$STATUS" == "SUCCEED" ]] || [[ "$STATUS" == "FAILED" ]] || [[ "$STATUS" == "CANCELLED" ]]; then
    echo "Build completed with status: $STATUS"
    break
  fi
  
  sleep 30
done
```

### View Build Logs

```bash
# Get detailed build information
aws amplify get-job \
  --app-id <app-id> \
  --branch-name main \
  --job-id <job-id> \
  --region us-east-1
```

Or view in console: Click on build → Click on each phase for logs

---

## Step 6: Troubleshooting

### Problem: No Build Started After Push

**Symptoms:**
- Pushed to CodeCommit successfully
- No build appears in Amplify Console after 5+ minutes

**Possible Causes:**

1. **Webhook not configured**
   ```bash
   # Check if Amplify is connected to CodeCommit
   aws amplify get-app \
     --app-id <app-id> \
     --region us-east-1 \
     --query 'app.defaultDomain'
   ```
   
   **Fix:** Manually trigger build (see Step 4)

2. **Wrong branch monitored**
   ```bash
   # Check which branch Amplify is watching
   aws amplify get-branch \
     --app-id <app-id> \
     --branch-name main \
     --region us-east-1
   ```
   
   **Fix:** Ensure you pushed to `main` branch

3. **Amplify app misconfigured**
   - Check CloudFormation stack: `TEAM-IDC-APP`
   - Verify stack status is `CREATE_COMPLETE` or `UPDATE_COMPLETE`
   - If stack is in failed state, may need to update or recreate

### Problem: Build Fails Immediately

**Symptoms:**
- Build starts but fails in PROVISION phase
- Error: "Repository not accessible"

**Possible Causes:**

1. **IAM permissions issue**
   ```bash
   # Check Amplify service role has CodeCommit access
   aws iam list-attached-role-policies \
     --role-name amplifyconsole-backend-role
   ```
   
   **Fix:** Ensure role has CodeCommit read permissions

2. **Repository doesn't exist**
   ```bash
   # Verify repository
   aws codecommit get-repository \
     --repository-name team-idc-app \
     --region us-east-1
   ```
   
   **Fix:** Verify repository name matches exactly

### Problem: Build Fails During BUILD Phase

**Symptoms:**
- Provision succeeds
- Build phase fails with errors

**Check Build Logs:**
1. Go to Amplify Console
2. Click on failed build
3. Click on "Build" phase
4. Read error messages

**Common Issues:**

1. **Dependency installation fails**
   - Error: `npm install failed`
   - Fix: Check `package.json` for errors
   - Fix: Ensure all dependencies are available

2. **Build script fails**
   - Error: `npm run build failed`
   - Fix: Test build locally: `npm install && npm run build`
   - Fix: Check for TypeScript errors, linting errors

3. **Out of memory**
   - Error: `JavaScript heap out of memory`
   - Fix: Contact AWS support to increase build instance size

### Problem: Build Succeeds but App Doesn't Update

**Symptoms:**
- Build shows SUCCEED
- Old version still showing in browser

**Fixes:**

1. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in incognito/private window

2. **Check CloudFront cache**
   - May take 5-10 minutes for CDN to update
   - Wait and try again

3. **Verify deployment URL**
   ```bash
   # Get your app URL
   aws amplify get-app \
     --app-id <app-id> \
     --region us-east-1 \
     --query 'app.defaultDomain' \
     --output text
   ```

### Problem: AWS Credentials Empty/Expired

**Symptoms:**
- `aws configure list` shows empty values
- AWS commands fail with authentication errors

**Fix:**
```bash
# Re-configure AWS credentials
aws configure

# Enter your:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json

# Verify
aws sts get-caller-identity
```

If you don't remember your credentials, see [AWS_CODECOMMIT_AUTH.md](AWS_CODECOMMIT_AUTH.md)

---

## Quick Reference Commands

### Check if Build is Running

```bash
APP_ID=$(aws cloudformation describe-stacks --stack-name TEAM-IDC-APP --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' --output text)
aws amplify list-jobs --app-id $APP_ID --branch-name main --region us-east-1 --max-results 1
```

### Trigger Manual Rebuild

```bash
APP_ID=$(aws cloudformation describe-stacks --stack-name TEAM-IDC-APP --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' --output text)
aws amplify start-job --app-id $APP_ID --branch-name main --job-type RELEASE --region us-east-1
```

### Get App URL

```bash
APP_ID=$(aws cloudformation describe-stacks --stack-name TEAM-IDC-APP --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' --output text)
aws amplify get-app --app-id $APP_ID --region us-east-1 --query 'app.defaultDomain' --output text
```

### View Latest Build Logs URL

```bash
APP_ID=$(aws cloudformation describe-stacks --stack-name TEAM-IDC-APP --region us-east-1 --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' --output text)
echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/$APP_ID/main"
```

---

## Complete Workflow After Pushing

### 1. Verify Push Succeeded

```bash
aws codecommit get-branch --repository-name team-idc-app --branch-name main --region us-east-1
```

### 2. Wait 2-3 Minutes

Amplify needs time to detect the change.

### 3. Check Build Status

Use AWS Console (easiest) or CLI:
```bash
./check-build.sh
```

### 4. If No Build After 5 Minutes

Manually trigger:
```bash
./trigger-rebuild.sh
```

### 5. Monitor Build

- Via Console: https://console.aws.amazon.com/amplify/
- Via CLI: Run check-build.sh every minute

### 6. After Build Succeeds

- Wait 2-3 minutes for CDN to update
- Open your app URL
- Hard refresh browser (Ctrl+Shift+R)

---

## Expected Behavior

### Normal Deploy Flow

```
1. Push to CodeCommit            ✅ You did this
2. Wait 1-2 minutes              ⏱️ Amplify detects change
3. Build starts automatically    🚀 Status: IN_PROGRESS
4. Provision phase (1-2 min)     📦 Setting up environment
5. Build phase (5-10 min)        🔨 npm install & build
6. Deploy phase (2-3 min)        🚀 Publishing to hosting
7. Build completes               ✅ Status: SUCCEED
8. CDN updates (2-5 min)         🌐 CloudFront cache refresh
9. App is live!                  🎉 Visit your URL
```

**Total time:** 10-20 minutes from push to live

### What You Should See

After pushing successfully:
- ✅ Within 5 minutes: Build appears in Amplify Console
- ✅ Status changes: PENDING → IN_PROGRESS → SUCCEED
- ✅ Each phase shows duration and logs
- ✅ After completion, new version is live

---

## Summary Checklist

After you push to CodeCommit:

- [ ] Verify AWS credentials are configured: `aws sts get-caller-identity`
- [ ] Confirm push reached CodeCommit: `aws codecommit get-branch --repository-name team-idc-app --branch-name main --region us-east-1`
- [ ] Check Amplify Console for build: https://console.aws.amazon.com/amplify/
- [ ] If no build after 5 minutes, manually trigger: `./trigger-rebuild.sh`
- [ ] Monitor build progress (8-15 minutes typical)
- [ ] After SUCCEED, wait 2-3 minutes for CDN
- [ ] Open app URL and hard refresh browser
- [ ] Verify your changes are live

---

## Additional Resources

- [REDEPLOYMENT_GUIDE.md](REDEPLOYMENT_GUIDE.md) - Complete deployment guide
- [TROUBLESHOOTING_CODECOMMIT.md](TROUBLESHOOTING_CODECOMMIT.md) - CodeCommit issues
- [AWS_CODECOMMIT_AUTH.md](AWS_CODECOMMIT_AUTH.md) - Authentication guide
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)

---

**Last Updated**: February 2026  
**Version**: 1.0
