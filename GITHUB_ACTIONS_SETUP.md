# Setting Up GitHub to CodeCommit Automatic Sync

This guide helps you configure automatic synchronization from GitHub to AWS CodeCommit, which triggers AWS Amplify builds.

## What This Does

When you push to GitHub's `main` branch, GitHub Actions will automatically:
1. Push the code to your AWS CodeCommit repository
2. Trigger AWS Amplify to build and deploy your application
3. Show you the deployment status

## Prerequisites

- AWS account with CodeCommit repository created
- AWS IAM user with CodeCommit permissions
- GitHub repository with Actions enabled

## Setup Instructions

### Step 1: Create IAM User for GitHub Actions

1. Go to AWS IAM Console
2. Create a new IAM user named `github-actions-codecommit`
3. Attach the policy `AWSCodeCommitPowerUser`
4. Create access keys (Access Key ID and Secret Access Key)
5. Save these credentials securely

### Step 2: Add Secrets to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key ID | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region of CodeCommit repo | `us-east-1` |
| `CODECOMMIT_REPO_NAME` | Name of your CodeCommit repository | `team-idc-app` |

### Step 3: Enable the Workflow

The workflow file is already created at `.github/workflows/sync-to-codecommit.yml`.

To enable it:
1. Commit this file to your repository
2. Push to GitHub
3. The workflow will run automatically on future pushes to `main`

### Step 4: Test the Workflow

```bash
# Make a test commit
echo "# Test" >> README.md
git add README.md
git commit -m "Test automatic sync to CodeCommit"
git push origin main
```

Watch the workflow run:
1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click on the latest workflow run
4. Monitor the "Sync to AWS CodeCommit" job

### Step 5: Verify Deployment

After the workflow completes:
1. Go to AWS Amplify Console
2. Select "TEAM-IDC-APP"
3. Click "main" branch
4. You should see a new build starting
5. Wait 8-15 minutes for build to complete
6. Your application will be deployed!

## How It Works

```
┌──────────────────────────────────────────────────────────────┐
│  Developer Workflow                                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  git push origin main                                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  GitHub receives push                                        │
│  ├─ Saves code to GitHub                                    │
│  └─ Triggers GitHub Actions workflow                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  GitHub Actions Workflow                                     │
│  ├─ Checks out code                                          │
│  ├─ Configures AWS credentials                              │
│  ├─ Installs git-remote-codecommit                          │
│  ├─ Adds CodeCommit remote                                  │
│  └─ Pushes to CodeCommit main branch                        │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  AWS CodeCommit receives push                                │
│  └─ Triggers AWS Amplify build webhook                      │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  AWS Amplify Build                                           │
│  ├─ Provision build environment                             │
│  ├─ Run npm install                                         │
│  ├─ Run npm run build                                       │
│  ├─ Deploy to hosting                                       │
│  └─ Verify deployment                                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Live Application Updated! 🎉                                │
└──────────────────────────────────────────────────────────────┘
```

## Workflow Configuration

The workflow runs on:
- Every push to the `main` branch
- Manual trigger (via Actions tab → "Run workflow")

### Workflow Steps

1. **Checkout code**: Gets your repository code
2. **Configure AWS credentials**: Uses secrets to authenticate
3. **Install git-remote-codecommit**: Python helper for CodeCommit
4. **Configure Git**: Sets up git user for commits
5. **Add CodeCommit remote**: Adds your CodeCommit repo as a remote
6. **Push to CodeCommit**: Pushes main branch to trigger Amplify
7. **Show status**: Displays repository and deployment information

## Troubleshooting

### Workflow fails with "Access Denied"

**Cause**: AWS credentials are invalid or don't have CodeCommit permissions.

**Fix**:
1. Verify secrets are correct in GitHub Settings
2. Check IAM user has `AWSCodeCommitPowerUser` policy
3. Regenerate access keys if needed

### Workflow succeeds but Amplify doesn't build

**Cause**: Amplify app not connected to CodeCommit repository.

**Fix**:
1. Go to Amplify Console
2. Check app is connected to CodeCommit repository
3. Verify branch name is `main`
4. Manually trigger build to test:
   ```bash
   aws amplify start-job --app-id <your-app-id> --branch-name main --job-type RELEASE --region us-east-1
   ```

### "Repository not found" error

**Cause**: CodeCommit repository name or region is incorrect.

**Fix**:
1. Check `CODECOMMIT_REPO_NAME` secret matches exactly: `team-idc-app`
2. Check `AWS_REGION` secret is: `us-east-1`
3. Verify repository exists:
   ```bash
   aws codecommit get-repository --repository-name team-idc-app --region us-east-1
   ```

### Push to CodeCommit shows "already up-to-date"

**Cause**: CodeCommit already has the latest code.

**Fix**: This is normal! It means your code is already deployed.

## Manual Sync Alternative

If you prefer manual control instead of automatic sync:

```bash
# Add CodeCommit remote (one time)
git remote add codecommit codecommit::us-east-1://team-idc-app

# Deploy when ready
git push origin main        # Save to GitHub
git push codecommit main    # Deploy to AWS
```

See [GITHUB_CODECOMMIT_SYNC.md](GITHUB_CODECOMMIT_SYNC.md) for detailed manual sync instructions.

## Disabling Automatic Sync

To disable automatic sync but keep the workflow for manual use:

1. Edit `.github/workflows/sync-to-codecommit.yml`
2. Remove or comment out the `on: push:` section
3. Keep `workflow_dispatch:` for manual triggers
4. Commit and push

Then you can manually trigger from GitHub Actions tab when needed.

## Security Considerations

### Secrets Management

- ✅ AWS credentials are stored as GitHub encrypted secrets
- ✅ Secrets are not visible in logs or workflow output
- ✅ Only repository admins can view/edit secrets

### IAM Permissions

The IAM user needs minimum permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "codecommit:GitPull",
                "codecommit:GitPush"
            ],
            "Resource": "arn:aws:codecommit:us-east-1:*:team-idc-app"
        }
    ]
}
```

### Best Practices

1. Create a dedicated IAM user for GitHub Actions
2. Use least privilege IAM policies
3. Rotate access keys regularly (every 90 days)
4. Monitor CloudTrail logs for CodeCommit access
5. Use branch protection rules on GitHub main branch

## Monitoring

### GitHub Actions

View workflow runs:
- GitHub repository → Actions tab
- Click on a workflow run to see details
- Check logs for any errors

### AWS Amplify

Monitor builds:
- AWS Amplify Console → TEAM-IDC-APP
- Click "main" branch
- View build history and logs
- Check build status (Success/Failed)

### AWS CloudWatch

View detailed logs:
```bash
# Amplify build logs
aws logs tail /aws/amplify/TEAM-IDC-APP/main --follow

# CodeCommit activity
aws cloudtrail lookup-events --lookup-attributes AttributeKey=ResourceType,AttributeValue=AWS::CodeCommit::Repository
```

## Cost Considerations

### GitHub Actions

- ✅ Free for public repositories
- ✅ Free minutes for private repos (2,000/month)
- Each sync takes ~1-2 minutes

### AWS Services

- ✅ CodeCommit: Free tier 5 users, 50GB storage
- ✅ Amplify: Build minutes billed separately
- Typical cost: $1-5/month for small projects

## FAQ

**Q: How long does sync take?**  
A: 1-2 minutes for GitHub Actions, then 8-15 minutes for Amplify build.

**Q: Can I sync other branches?**  
A: Yes, modify the workflow to include other branches in the `on: push: branches:` section.

**Q: Does this sync delete files?**  
A: No, it only pushes new commits. Files deleted in GitHub will be deleted in CodeCommit.

**Q: Can I see what was pushed?**  
A: Yes, check the workflow logs in GitHub Actions tab.

**Q: What if sync fails?**  
A: The workflow will show an error. Your GitHub code is safe. Fix the issue and re-run.

## Support

For additional help:
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CodeCommit Documentation](https://docs.aws.amazon.com/codecommit/)
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [GITHUB_CODECOMMIT_SYNC.md](GITHUB_CODECOMMIT_SYNC.md) - Complete sync guide

---

**Last Updated**: February 2026  
**Version**: 1.0
