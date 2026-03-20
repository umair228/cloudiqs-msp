# One-Click Deployment (AWS CLI + Amplify) for CloudiQS MSP

This guide gives you a practical **one-click deployment flow** for this repository.

It is designed so that **your current GitHub codebase is the source of truth**.  
Operationally, deployment uses this flow:

`your local repo (same code as GitHub main) -> CodeCommit main -> Amplify auto build/deploy`

It uses:
- **AWS CLI** (required)
- Existing scripts in `deployment/`
- **AWS Amplify Hosting** provisioned through CloudFormation

---

## What gets deployed

Running the deployment flow provisions:
- Code repository integration for Amplify build/deploy
- CloudFormation stack: `TEAM-IDC-APP`
- Amplify app/backend environment and CI/CD pipeline
- TEAM IAM Identity Center integration resources (as defined by templates/scripts)

---

## 1) Prerequisites

Install and configure:

```bash
aws --version
jq --version
git --version
```

You must have AWS credentials with permissions to deploy the required resources.

If you are deploying in an AWS Organizations setup with delegated admin, prepare both account profiles:
- Management account profile
- TEAM account profile

---

## 2) Configure deployment parameters

From your local repository root:

```bash
cd deployment
cp parameters-template.sh parameters.sh
```

Edit `parameters.sh` and set at least:
- `IDC_LOGIN_URL`
- `REGION`
- `TEAM_ACCOUNT`
- `ORG_MASTER_PROFILE`
- `TEAM_ACCOUNT_PROFILE`
- `TEAM_ADMIN_GROUP`
- `TEAM_AUDITOR_GROUP`
- `CLOUDTRAIL_AUDIT_LOGS`
- Optional: `TAGS`, `UI_DOMAIN`, `SECRET_NAME` (only for external repositories)

> For private deployment within your managed AWS identity, leave `SECRET_NAME` unset so Amplify is sourced from private AWS CodeCommit.

> If your deployment is management-account-only, use `parameters-mgmt-template.sh` as your base.

---

## 3) (Organizations only) enable delegated admin services

If you use a separate TEAM account, run:

```bash
cd deployment
chmod +x init.sh
./init.sh
```

This script enables trusted access and registers delegated admin for:
- `account.amazonaws.com`
- `cloudtrail.amazonaws.com`
- `sso.amazonaws.com`

---

## 4) One-click deployment

Run the deployment script:

```bash
cd deployment
chmod +x deploy.sh
./deploy.sh
```

That command performs the end-to-end deployment workflow (AWS CLI + CloudFormation + Amplify pipeline bootstrap).

Important behavior:
- `deploy.sh` pushes your current local `main` branch to CodeCommit repository `team-idc-app`.
- Amplify is connected through the deployed stack and automatically builds/deploys from CodeCommit.
- No AWS samples upstream repository pull is required for this flow.

---

## 5) Verify deployment

Use AWS CLI to validate resources:

```bash
# CloudFormation status
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region <REGION> \
  --query 'Stacks[0].StackStatus' \
  --output text

# Stack outputs
aws cloudformation describe-stacks \
  --stack-name TEAM-IDC-APP \
  --region <REGION> \
  --query 'Stacks[0].Outputs'

# Amplify app list
aws amplify list-apps --region <REGION>
```

Expected result:
- `TEAM-IDC-APP` stack reaches `CREATE_COMPLETE` or `UPDATE_COMPLETE`
- Amplify app exists and starts build/deploy

---

## 6) Update and redeploy (one command)

After changes:

```bash
cd deployment
chmod +x update.sh
./update.sh
```

Update behavior in this repository:
- Pushes your current local `main` to CodeCommit `team-idc-app`
- Re-runs CloudFormation deployment for `TEAM-IDC-APP`
- Triggers Amplify pipeline deployment automatically

---

## 7) Destroy / cleanup

```bash
cd deployment
chmod +x destroy.sh
./destroy.sh
```

This removes Amplify/CloudFormation resources created by the deployment flow.

---

## 8) Full single-command example (copy/paste)

After you have `deployment/parameters.sh` ready, this is the full one-click execution:

```bash
cd deployment && chmod +x init.sh deploy.sh && ./init.sh && ./deploy.sh
```

For non-Organizations or already-initialized environments:

```bash
cd deployment && chmod +x deploy.sh && ./deploy.sh
```

---

## Related references

- Repo scripts: `deployment/init.sh`, `deployment/deploy.sh`, `deployment/update.sh`, `deployment/destroy.sh`
- Existing docs in this repo: `docs/docs/deployment/`
