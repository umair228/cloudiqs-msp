# CodeCommit Troubleshooting Guide - Common Issues

## Issue: "remote codecommit already exists" with 403 Error

### Your Exact Problem

You're seeing this:
```bash
$ git remote add codecommit codecommit::us-east-1://team-idc-app
error: remote codecommit already exists.

$ git remote -v
codecommit      https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app (fetch)
codecommit      https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app (push)

$ git push codecommit main
fatal: unable to access 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app/': 
The requested URL returned error: 403
```

### The Problem

Your `codecommit` remote is using the **WRONG URL format**:
- ❌ **Current (WRONG)**: `https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app`
- ✅ **Should be**: `codecommit::us-east-1://team-idc-app`

The HTTPS URL requires Git credentials (different authentication), while the `codecommit://` URL uses your AWS CLI credentials (easier and recommended).

---

## ✅ SOLUTION - Fix Your Remote URL

Follow these steps **in order**:

### Step 1: Install git-remote-codecommit

This is the helper that enables the `codecommit://` protocol:

```bash
# Install it
pip3 install git-remote-codecommit

# Verify installation
pip3 show git-remote-codecommit
```

If you get "command not found" for pip3:
```bash
# macOS
brew install python3

# Then install the helper
pip3 install git-remote-codecommit
```

### Step 2: Configure AWS Credentials

```bash
# Configure your AWS credentials
aws configure

# You'll be prompted for:
# AWS Access Key ID: [Enter your key]
# AWS Secret Access Key: [Enter your secret]
# Default region name: us-east-1
# Default output format: json
```

**Verify it worked:**
```bash
aws sts get-caller-identity
```

You should see your AWS account info (not empty).

### Step 3: Remove the Old (Wrong) Remote

```bash
# Remove the HTTPS remote
git remote remove codecommit
```

### Step 4: Add the Correct Remote

```bash
# Add the codecommit:// remote
git remote add codecommit codecommit::us-east-1://team-idc-app
```

### Step 5: Verify the Fix

```bash
# Check your remotes
git remote -v
```

You should now see:
```
codecommit  codecommit::us-east-1://team-idc-app (fetch)
codecommit  codecommit::us-east-1://team-idc-app (push)
origin      https://github.com/umair228/cloudiqs-msp.git (fetch)
origin      https://github.com/umair228/cloudiqs-msp.git (push)
```

### Step 6: Test the Push

```bash
# This should now work!
git push codecommit main
```

---

## Complete Fix Script

Copy and paste this entire script:

```bash
#!/bin/bash
echo "🔧 Fixing CodeCommit remote URL..."

# Step 1: Install git-remote-codecommit
echo "📦 Installing git-remote-codecommit..."
pip3 install git-remote-codecommit

# Step 2: Configure AWS credentials (you'll be prompted)
echo "🔑 Configuring AWS credentials..."
echo "Please enter your AWS credentials when prompted:"
aws configure

# Step 3: Verify credentials
echo "✓ Verifying AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS credentials configured successfully!"
else
    echo "❌ AWS credentials not configured. Please run 'aws configure' manually."
    exit 1
fi

# Step 4: Remove old remote
echo "🗑️  Removing old HTTPS remote..."
git remote remove codecommit

# Step 5: Add correct remote
echo "➕ Adding correct codecommit:// remote..."
git remote add codecommit codecommit::us-east-1://team-idc-app

# Step 6: Verify
echo "✓ Verifying remote configuration..."
git remote -v

echo ""
echo "════════════════════════════════════════"
echo "✅ Setup complete!"
echo "════════════════════════════════════════"
echo ""
echo "You can now push with:"
echo "  git push codecommit main"
echo ""
```

Save this as `fix-codecommit.sh` and run:
```bash
chmod +x fix-codecommit.sh
./fix-codecommit.sh
```

---

## Why This Happens

### HTTPS URL vs codecommit:// URL

There are **two different ways** to connect to CodeCommit:

#### Method 1: HTTPS URL (What you accidentally have)
- URL format: `https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app`
- Authentication: Requires **Git credentials** generated in IAM Console
- Setup: More complex, requires generating special credentials
- Not recommended for most users

#### Method 2: codecommit:// Protocol (What you should use)
- URL format: `codecommit::us-east-1://team-idc-app`
- Authentication: Uses your **AWS CLI credentials** (Access Key/Secret Key)
- Setup: Simple, just run `aws configure`
- Recommended: Much easier to use

### How It Happened

The HTTPS URL was probably:
1. Created by an old deployment script
2. Set up before git-remote-codecommit existed
3. Copied from AWS Console (which shows HTTPS by default)
4. Created by someone unfamiliar with codecommit:// protocol

---

## Detailed Step-by-Step (If Script Doesn't Work)

### Problem: pip3 not found

```bash
# macOS
brew install python3

# Linux (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install python3-pip

# Verify
python3 --version
pip3 --version
```

### Problem: git-remote-codecommit not found after install

```bash
# Find where it was installed
pip3 show git-remote-codecommit

# Add to PATH (macOS)
export PATH=$PATH:~/Library/Python/3.x/bin

# Add to PATH (Linux)
export PATH=$PATH:~/.local/bin

# Make permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export PATH=$PATH:~/.local/bin' >> ~/.bashrc
source ~/.bashrc
```

### Problem: "aws: command not found"

Install AWS CLI:

```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify
aws --version
```

### Problem: AWS credentials - "I don't have Access Key"

You need to create AWS access keys:

1. Go to AWS IAM Console: https://console.aws.amazon.com/iam/
2. Click **Users** → Select your user
3. Click **Security credentials** tab
4. Under **Access keys**, click **Create access key**
5. Select **Use case**: Command Line Interface (CLI)
6. Click **Create access key**
7. **IMPORTANT**: Save both Access Key ID and Secret Access Key (you can't see secret again)
8. Use these in `aws configure`

### Problem: "Access Denied" after aws configure

Your IAM user needs CodeCommit permissions:

1. Go to AWS IAM Console
2. Find your user
3. Click **Add permissions** → **Attach policies directly**
4. Search for and select: `AWSCodeCommitPowerUser`
5. Click **Add permissions**
6. Try pushing again

---

## Testing Your Fix

### Test 1: Verify Remote URL

```bash
git remote -v
```

✅ Should show `codecommit::us-east-1://team-idc-app`  
❌ Should NOT show `https://git-codecommit...`

### Test 2: Verify AWS Credentials

```bash
aws sts get-caller-identity
```

✅ Should show JSON with your account info  
❌ Should NOT be empty or show errors

### Test 3: Verify CodeCommit Access

```bash
aws codecommit get-repository --repository-name team-idc-app --region us-east-1
```

✅ Should show repository details  
❌ Should NOT show "Access Denied"

### Test 4: Test Push

```bash
git push codecommit main
```

✅ Should push successfully  
❌ Should NOT show 403 error

---

## Quick Reference

### Correct Setup Commands

```bash
# Install helper
pip3 install git-remote-codecommit

# Configure AWS
aws configure

# Fix remote
git remote remove codecommit
git remote add codecommit codecommit::us-east-1://team-idc-app

# Test
git push codecommit main
```

### Correct Remote URLs

```bash
# ✅ CORRECT
codecommit::us-east-1://team-idc-app

# ❌ WRONG (what you have now)
https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app
```

---

## Still Having Issues?

### Check This Checklist

- [ ] git-remote-codecommit is installed: `pip3 show git-remote-codecommit`
- [ ] AWS CLI is installed: `aws --version`
- [ ] AWS credentials configured: `aws configure list` shows values
- [ ] Can authenticate: `aws sts get-caller-identity` returns info
- [ ] Have CodeCommit permissions: `aws codecommit get-repository --repository-name team-idc-app --region us-east-1` works
- [ ] Remote uses codecommit:// protocol: `git remote -v` shows `codecommit::us-east-1://`
- [ ] On correct branch: `git branch` shows `* main`

If all checked ✅ but still not working, see detailed troubleshooting:
- [AWS_CODECOMMIT_AUTH.md](AWS_CODECOMMIT_AUTH.md) - Complete authentication guide
- [GITHUB_CODECOMMIT_SYNC.md](GITHUB_CODECOMMIT_SYNC.md) - Sync workflow guide

---

## Summary

**Your Issue**: Wrong remote URL format (HTTPS instead of codecommit://)

**The Fix**:
1. Install: `pip3 install git-remote-codecommit`
2. Configure: `aws configure`
3. Remove old: `git remote remove codecommit`
4. Add correct: `git remote add codecommit codecommit::us-east-1://team-idc-app`
5. Push: `git push codecommit main`

**Why**: The `codecommit://` protocol uses AWS CLI credentials (easier), while HTTPS uses Git credentials (more complex).

---

**Last Updated**: February 2026  
**Version**: 1.0
