# GitHub to CodeCommit Sync Guide

## Understanding Your Setup

### Important Clarification

**Q: Is this an AWS official repo with read-only access?**  
**A: NO!** The CodeCommit repository `team-idc-app` in your AWS account (722560225075) is **YOUR OWN repository**. You have full read/write access to it. This is NOT an AWS-managed or read-only repository.

### Your Repository Architecture

You have **two repositories** for the same code:

1. **GitHub Repository** (`origin`)
   - URL: `https://github.com/umair228/cloudiqs-msp.git`
   - Purpose: Primary development, version control, collaboration
   - Branch: `main`

2. **AWS CodeCommit Repository** (`codecommit`)
   - URL: `codecommit::us-east-1://team-idc-app`
   - Purpose: Triggers AWS Amplify builds for deployment
   - Branch: `main`
   - Account: 722560225075
   - Region: us-east-1

### How It Works

```
┌─────────────┐        Push         ┌──────────────┐      Triggers      ┌────────────┐
│   GitHub    │──────────────────▶  │ CodeCommit   │──────────────────▶ │  Amplify   │
│   (origin)  │   (manual/auto)     │ (deployment) │     (automatic)    │   Build    │
└─────────────┘                     └──────────────┘                    └────────────┘
      │                                                                         │
      │                                                                         │
      └─────────────────── You develop here ─────────────────┐                │
                                                              │                │
                                                              ▼                ▼
                                                        Version Control   Live Application
```

**Workflow:**
1. You develop and commit code to **GitHub** (main branch)
2. You push GitHub main to **CodeCommit** main
3. CodeCommit push **automatically triggers** AWS Amplify build
4. Amplify builds and deploys your application

---

## Why Two Repositories?

### GitHub (Primary Development)
- ✅ Version control and history
- ✅ Pull requests and code reviews
- ✅ Issue tracking
- ✅ GitHub Actions for CI/CD
- ✅ Public or private collaboration
- ✅ Free for public repos

### CodeCommit (AWS Deployment Trigger)
- ✅ Integrated with AWS Amplify
- ✅ Triggers automatic deployments
- ✅ AWS-native integration
- ✅ Part of your AWS infrastructure

**You're NOT limited to read-only access** - you own both repositories!

---

## Method 1: Manual Sync (Recommended for Learning)

### Step 1: Set Up Both Remotes

First, configure both GitHub and CodeCommit remotes:

```bash
# Check current remotes
git remote -v

# If you don't have codecommit remote, add it:
git remote add codecommit codecommit::us-east-1://team-idc-app

# Verify both remotes exist
git remote -v
# Should show:
# codecommit  codecommit::us-east-1://team-idc-app (fetch)
# codecommit  codecommit::us-east-1://team-idc-app (push)
# origin      https://github.com/umair228/cloudiqs-msp.git (fetch)
# origin      https://github.com/umair228/cloudiqs-msp.git (push)
```

### Step 2: Push to Both Repositories

When you want to deploy:

```bash
# 1. Make your changes and commit
git add .
git commit -m "Your commit message"

# 2. Push to GitHub (for version control)
git push origin main

# 3. Push to CodeCommit (to trigger Amplify deployment)
git push codecommit main
```

### Step 3: Monitor Amplify Build

After pushing to CodeCommit, AWS Amplify automatically starts building:

```bash
# Check Amplify build status
aws amplify list-jobs --app-id <your-app-id> --branch-name main --region us-east-1
```

Or monitor in AWS Console:
1. Go to AWS Amplify Console
2. Select "TEAM-IDC-APP"
3. Click "main" branch
4. Watch the build progress

---

## Method 2: Automatic Sync with GitHub Actions

### Automatic Workflow

Set up GitHub Actions to automatically push to CodeCommit whenever you push to GitHub.

#### Step 1: Store AWS Credentials in GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key | IAM user with CodeCommit access |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Key | Corresponding secret key |
| `AWS_REGION` | `us-east-1` | Region of CodeCommit repo |
| `CODECOMMIT_REPO_NAME` | `team-idc-app` | Name of CodeCommit repository |

#### Step 2: Create GitHub Actions Workflow

The workflow file has been created at `.github/workflows/sync-to-codecommit.yml` (see below).

#### Step 3: How It Works

```
┌───────────────────────────────────────────────────────────────┐
│  You push to GitHub main                                      │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│  GitHub Actions workflow triggers automatically               │
│  - Checks out code                                            │
│  - Configures AWS credentials                                 │
│  - Sets up git-remote-codecommit                              │
│  - Adds CodeCommit remote                                     │
│  - Pushes to CodeCommit main                                  │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│  CodeCommit receives push                                     │
└────────────────────────┬──────────────────────────────────────┘
                         │
                         ▼
┌───────────────────────────────────────────────────────────────┐
│  AWS Amplify build triggers automatically                     │
│  - Builds your application                                    │
│  - Deploys to environment                                     │
└───────────────────────────────────────────────────────────────┘
```

Now whenever you push to GitHub main, it automatically syncs to CodeCommit and triggers Amplify!

---

## Method 3: Push to Both in One Command

Create a git alias to push to both remotes at once:

```bash
# Add this to your ~/.gitconfig or run these commands:
git config --global alias.push-all '!git push origin main && git push codecommit main'

# Now you can use:
git push-all

# This pushes to both GitHub and CodeCommit in one command
```

Or create a shell script:

```bash
# Create deploy.sh
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "📦 Pushing to GitHub..."
git push origin main

echo "🚀 Pushing to CodeCommit (triggers Amplify)..."
git push codecommit main

echo "✅ Pushed to both repositories!"
echo "🔍 Check Amplify Console for build status"
EOF

chmod +x deploy.sh

# Use it:
./deploy.sh
```

---

## Troubleshooting

### Problem: "I can't push to CodeCommit main branch"

**Cause**: You might think it's read-only, but it's not! Common issues:

1. **Missing codecommit remote**
   ```bash
   git remote add codecommit codecommit::us-east-1://team-idc-app
   ```

2. **Not authenticated**
   ```bash
   # Install helper
   pip3 install git-remote-codecommit
   
   # Configure AWS credentials
   aws configure
   ```

3. **Wrong branch**
   ```bash
   # Make sure you're on main branch
   git checkout main
   
   # Push to main
   git push codecommit main
   ```

### Problem: "Still getting 403 error"

See our comprehensive authentication guide: [AWS_CODECOMMIT_AUTH.md](AWS_CODECOMMIT_AUTH.md)

### Problem: "Amplify not rebuilding"

**Check:**
1. Verify push reached CodeCommit:
   ```bash
   aws codecommit get-branch --repository-name team-idc-app --branch-name main --region us-east-1
   ```

2. Check Amplify app is connected to CodeCommit:
   ```bash
   aws amplify get-app --app-id <your-app-id> --region us-east-1
   ```

3. Manually trigger build if needed:
   ```bash
   aws amplify start-job --app-id <your-app-id> --branch-name main --job-type RELEASE --region us-east-1
   ```

### Problem: "Merge conflicts between GitHub and CodeCommit"

**If repositories diverged:**

```bash
# Fetch from CodeCommit
git fetch codecommit

# Check differences
git log codecommit/main..origin/main

# If CodeCommit is behind, just push:
git push codecommit main

# If CodeCommit is ahead, pull and merge:
git pull codecommit main
git push origin main
git push codecommit main
```

### Problem: "GitHub Actions workflow not running"

**Check:**
1. Secrets are configured in GitHub Settings
2. Workflow file is in `.github/workflows/` directory
3. You pushed to `main` branch (not another branch)
4. Check Actions tab in GitHub for error messages

---

## Understanding Your Permissions

### You ARE the Owner

Your CodeCommit repository details show:
- **Account ID**: 722560225075 (YOUR account)
- **Repository Name**: team-idc-app (YOU created this)
- **Created Date**: 2026-01-31 (YOU created it)

**This is NOT:**
- ❌ An AWS official repository
- ❌ A read-only repository
- ❌ A shared AWS sample repository

**This IS:**
- ✅ Your own private CodeCommit repository
- ✅ Fully writable by you
- ✅ Under your control
- ✅ Created by your AWS account

You have **full permissions** to push, pull, create branches, and delete if needed.

---

## Recommended Workflow

### Daily Development

```bash
# 1. Work on GitHub
git checkout -b feature/new-feature
# ... make changes ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 2. Create PR on GitHub
# 3. Review and merge to main on GitHub

# 4. Deploy to AWS
git checkout main
git pull origin main
git push codecommit main  # Triggers Amplify build
```

### Quick Deployments

```bash
# Make changes directly on main (for urgent fixes)
git add .
git commit -m "Urgent fix"
git push origin main
git push codecommit main  # Triggers deployment
```

### With Automatic Sync

```bash
# Just push to GitHub - Actions handles CodeCommit
git add .
git commit -m "Update feature"
git push origin main
# GitHub Actions automatically pushes to CodeCommit
# Amplify automatically builds and deploys
```

---

## Best Practices

### 1. GitHub as Primary

- ✅ Always commit and push to GitHub first
- ✅ Use GitHub for pull requests and code review
- ✅ Keep GitHub as source of truth

### 2. CodeCommit for Deployment

- ✅ Push to CodeCommit only when ready to deploy
- ✅ CodeCommit main = production code
- ✅ Use CodeCommit push to trigger Amplify

### 3. Branching Strategy

- ✅ Develop on feature branches in GitHub
- ✅ Merge to GitHub main via PR
- ✅ Push GitHub main to CodeCommit main for deployment

### 4. Keep in Sync

- ✅ Push to both repositories regularly
- ✅ Use GitHub Actions for automation
- ✅ Monitor Amplify builds after CodeCommit pushes

---

## Quick Reference

### Setup Commands

```bash
# Install tools
pip3 install git-remote-codecommit
aws configure

# Add remotes
git remote add origin https://github.com/umair228/cloudiqs-msp.git
git remote add codecommit codecommit::us-east-1://team-idc-app

# Verify
git remote -v
aws sts get-caller-identity
```

### Deployment Commands

```bash
# Manual sync
git push origin main        # Save to GitHub
git push codecommit main    # Deploy via Amplify

# Or use GitHub Actions (automatic)
git push origin main        # Automatically syncs and deploys
```

### Monitoring Commands

```bash
# Check CodeCommit
aws codecommit get-repository --repository-name team-idc-app --region us-east-1

# Check Amplify builds
aws amplify list-jobs --app-id <your-app-id> --branch-name main --region us-east-1

# Get Amplify app URL
aws amplify get-app --app-id <your-app-id> --region us-east-1 \
  --query 'app.defaultDomain' --output text
```

---

## Summary

**The Bottom Line:**

1. **You OWN both repositories** - nothing is read-only
2. **GitHub** = version control and development
3. **CodeCommit** = deployment trigger for Amplify
4. **Workflow**: GitHub → CodeCommit → Amplify → Live App
5. **Choose**: Manual sync OR automatic GitHub Actions
6. **Result**: Push to GitHub, deploy to AWS automatically

**You have full control over everything!**

---

## Additional Resources

- [AWS CodeCommit Authentication](AWS_CODECOMMIT_AUTH.md) - Fix authentication issues
- [Quick Deploy Guide](QUICK_DEPLOY.md) - Fast deployment reference
- [Redeployment Guide](REDEPLOYMENT_GUIDE.md) - Comprehensive procedures
- [AWS Amplify Documentation](https://docs.aws.amazon.com/amplify/)
- [AWS CodeCommit Documentation](https://docs.aws.amazon.com/codecommit/)

---

**Last Updated**: February 2026  
**Version**: 1.0
