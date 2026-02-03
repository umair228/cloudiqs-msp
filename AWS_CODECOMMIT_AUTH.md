# AWS CodeCommit Authentication Guide

## 🚨 Common Issue: "remote codecommit already exists" + 403 Error

**If you're seeing this exact scenario:**
```bash
$ git remote add codecommit codecommit::us-east-1://team-idc-app
error: remote codecommit already exists.

$ git remote -v
codecommit      https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app (fetch)
codecommit      https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app (push)

$ git push codecommit main
fatal: unable to access 'https://git-codecommit...': error 403
```

**👉 Your remote is using the WRONG URL format!**

**Quick Fix:**
```bash
# 1. Install helper
pip3 install git-remote-codecommit

# 2. Configure AWS
aws configure

# 3. Fix the remote URL
git remote remove codecommit
git remote add codecommit codecommit::us-east-1://team-idc-app

# 4. Push
git push codecommit main
```

**📖 For detailed fix steps, see: [TROUBLESHOOTING_CODECOMMIT.md](TROUBLESHOOTING_CODECOMMIT.md)**

---

## Problem: 403 Error When Pushing to CodeCommit

If you're getting this error:
```bash
fatal: unable to access 'https://git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app/': The requested URL returned error: 403
```

This means your AWS credentials are not properly configured or you don't have the right permissions. This guide will help you fix it.

---

## Quick Fix (Most Common Solution)

### Step 1: Install git-remote-codecommit Helper

The easiest way to authenticate with CodeCommit is using the `git-remote-codecommit` helper:

```bash
# Install the helper (requires Python 3)
pip3 install git-remote-codecommit

# Or using pip
pip install git-remote-codecommit
```

### Step 2: Update Your Git Remote

Change your remote URL to use the `codecommit://` protocol:

```bash
# Remove the old remote
git remote remove codecommit

# Add the new remote with codecommit:// protocol
git remote add codecommit codecommit::us-east-1://team-idc-app

# Verify
git remote -v
```

You should see:
```
codecommit  codecommit::us-east-1://team-idc-app (fetch)
codecommit  codecommit::us-east-1://team-idc-app (push)
origin      https://github.com/umair228/cloudiqs-msp.git (fetch)
origin      https://github.com/umair228/cloudiqs-msp.git (push)
```

### Step 3: Configure AWS Credentials

You need valid AWS credentials. Choose ONE of these methods:

#### Option A: AWS CLI Configure (Recommended for Development)

```bash
# Configure AWS credentials
aws configure

# You'll be prompted for:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region name: us-east-1
# - Default output format: json
```

#### Option B: Use AWS Profile

```bash
# Configure a named profile
aws configure --profile team-deployment

# Set the profile for this session
export AWS_PROFILE=team-deployment

# Or set it permanently in your shell config (~/.bashrc or ~/.zshrc)
echo 'export AWS_PROFILE=team-deployment' >> ~/.bashrc
```

#### Option C: IAM Role (For EC2 or Cloud9)

If you're on an EC2 instance or Cloud9:
```bash
# Verify the instance has an IAM role attached
aws sts get-caller-identity

# Should return:
# {
#     "UserId": "AIDAI...",
#     "Account": "123456789012",
#     "Arn": "arn:aws:sts::123456789012:assumed-role/YourRole/..."
# }
```

### Step 4: Verify Credentials

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test CodeCommit access
aws codecommit get-repository --repository-name team-idc-app --region us-east-1
```

If both commands succeed, you're ready to push!

### Step 5: Push to CodeCommit

```bash
git push codecommit main
```

---

## Detailed Troubleshooting

### Symptom: "aws: command not found"

**Cause**: AWS CLI is not installed.

**Fix**:
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### Symptom: "aws configure list" Shows Empty Values

**Cause**: No AWS credentials configured.

**Fix**:
```bash
# Method 1: Use aws configure
aws configure

# Method 2: Manually set credentials
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1

# Method 3: Use credentials file
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
EOF

cat > ~/.aws/config << EOF
[default]
region = us-east-1
output = json
EOF
```

### Symptom: "git-remote-codecommit: command not found"

**Cause**: The helper is not installed or not in PATH.

**Fix**:
```bash
# Install the helper
pip3 install git-remote-codecommit

# If still not found, check Python path
python3 -m pip install --user git-remote-codecommit

# Add Python user bin to PATH if needed
export PATH=$PATH:~/.local/bin

# Or for macOS
export PATH=$PATH:~/Library/Python/3.x/bin
```

### Symptom: "Access Denied" or "User is not authorized"

**Cause**: Your IAM user/role lacks CodeCommit permissions.

**Required IAM Permissions**:
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

**Fix**:
1. Go to AWS IAM Console
2. Find your user/role
3. Attach the `AWSCodeCommitPowerUser` managed policy, or
4. Create and attach a custom policy with the permissions above

### Symptom: Using Wrong Region

**Cause**: Your AWS CLI is configured for a different region than us-east-1.

**Fix**:
```bash
# Check current region
aws configure get region

# Set region to us-east-1
aws configure set region us-east-1

# Or use environment variable
export AWS_DEFAULT_REGION=us-east-1

# Verify
aws configure list
```

### Symptom: Expired Credentials (Temporary Credentials)

**Cause**: Using temporary credentials (STS) that have expired.

**Fix**:
```bash
# If using AWS SSO
aws sso login --profile your-profile

# If using assumed role, re-assume the role
aws sts assume-role \
    --role-arn arn:aws:iam::ACCOUNT:role/YourRole \
    --role-session-name your-session

# Then export the new credentials
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
```

---

## Alternative Authentication Methods

### Method 1: HTTPS with Git Credentials (Not Recommended)

⚠️ **Not recommended** - use git-remote-codecommit instead.

1. Go to IAM Console → Your User → Security Credentials
2. Generate "Git credentials for AWS CodeCommit"
3. Use these credentials when prompted by git

### Method 2: SSH Keys

1. Generate SSH key:
```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com" -f ~/.ssh/codecommit_rsa
```

2. Add public key to IAM:
   - Go to IAM Console → Your User → Security Credentials
   - Upload SSH public key (~/.ssh/codecommit_rsa.pub)

3. Configure SSH:
```bash
cat >> ~/.ssh/config << EOF
Host git-codecommit.*.amazonaws.com
  User YOUR_SSH_KEY_ID_FROM_IAM
  IdentityFile ~/.ssh/codecommit_rsa
EOF
```

4. Update git remote:
```bash
git remote remove codecommit
git remote add codecommit ssh://YOUR_SSH_KEY_ID@git-codecommit.us-east-1.amazonaws.com/v1/repos/team-idc-app
```

---

## Step-by-Step Setup from Scratch

### For New Users: Complete Setup

```bash
# 1. Install prerequisites
pip3 install git-remote-codecommit
aws --version  # Should show AWS CLI version

# 2. Configure AWS credentials
aws configure
# Enter your Access Key, Secret Key, region (us-east-1), format (json)

# 3. Verify credentials work
aws sts get-caller-identity
# Should show your user/role ARN

# 4. Test CodeCommit access
aws codecommit get-repository --repository-name team-idc-app --region us-east-1
# Should show repository details

# 5. Clone or update remote
# If cloning fresh:
git clone codecommit::us-east-1://team-idc-app

# If updating existing repo:
git remote remove codecommit
git remote add codecommit codecommit::us-east-1://team-idc-app

# 6. Verify remote
git remote -v

# 7. Test push
git push codecommit main
```

---

## Common Error Messages and Solutions

### Error: "fatal: could not read Username"

**Solution**: You're using HTTPS URLs without git-remote-codecommit. Switch to codecommit:// protocol.

### Error: "The security token included in the request is invalid"

**Solution**: Your credentials have expired. Run `aws configure` again or refresh your session tokens.

### Error: "CredentialRetrievalError: Error when retrieving credentials"

**Solution**: 
```bash
# Check credential file permissions
chmod 600 ~/.aws/credentials
chmod 600 ~/.aws/config

# Verify credentials are valid
aws sts get-caller-identity
```

### Error: "Repository not found"

**Solution**: Check repository name and region:
```bash
# List repositories
aws codecommit list-repositories --region us-east-1

# Verify repository name is exactly: team-idc-app
```

---

## Verification Checklist

Use this checklist to verify everything is set up correctly:

- [ ] AWS CLI installed: `aws --version`
- [ ] git-remote-codecommit installed: `pip3 show git-remote-codecommit`
- [ ] AWS credentials configured: `aws configure list`
- [ ] Credentials work: `aws sts get-caller-identity` returns your identity
- [ ] CodeCommit access: `aws codecommit get-repository --repository-name team-idc-app --region us-east-1` succeeds
- [ ] Git remote uses codecommit:// protocol: `git remote -v` shows `codecommit::us-east-1://team-idc-app`
- [ ] Can push: `git push codecommit main` succeeds

---

## Getting AWS Credentials

If you don't have AWS credentials:

### For Team Members

1. Ask your AWS administrator for:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Or IAM user name to create your own keys

2. Or use AWS SSO:
```bash
# Configure SSO
aws configure sso

# Login
aws sso login --profile your-profile

# Use the profile
export AWS_PROFILE=your-profile
```

### For AWS Administrators

To create credentials for a user:

1. Go to IAM Console
2. Select Users → Choose user
3. Security Credentials tab
4. Create access key
5. Attach policy: `AWSCodeCommitPowerUser`

---

## Security Best Practices

1. **Never commit credentials to git**
   - AWS credentials should only be in `~/.aws/credentials`
   - Add `~/.aws/` to your global gitignore

2. **Use named profiles**
   - Separate profiles for different accounts/roles
   - Example: `aws configure --profile production`

3. **Rotate credentials regularly**
   - Create new access keys every 90 days
   - Delete old access keys

4. **Use IAM roles when possible**
   - For EC2 instances
   - For Cloud9 environments
   - For Lambda functions

5. **Enable MFA**
   - Add MFA to your IAM user
   - Use temporary credentials with MFA

---

## Additional Resources

- [AWS CodeCommit Documentation](https://docs.aws.amazon.com/codecommit/)
- [git-remote-codecommit on PyPI](https://pypi.org/project/git-remote-codecommit/)
- [AWS CLI Configuration](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html)
- [IAM Policies for CodeCommit](https://docs.aws.amazon.com/codecommit/latest/userguide/auth-and-access-control-iam-identity-based-access-control.html)

---

## Quick Reference

```bash
# Install helper
pip3 install git-remote-codecommit

# Configure AWS
aws configure

# Update remote
git remote remove codecommit
git remote add codecommit codecommit::us-east-1://team-idc-app

# Test
aws sts get-caller-identity
aws codecommit get-repository --repository-name team-idc-app --region us-east-1

# Push
git push codecommit main
```

---

**Last Updated**: February 2026  
**Version**: 1.0

For additional help, see:
- [REDEPLOYMENT_GUIDE.md](REDEPLOYMENT_GUIDE.md)
- [QUICK_DEPLOY.md](QUICK_DEPLOY.md)
