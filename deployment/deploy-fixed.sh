#!/usr/bin/env bash
# Custom deployment script for TEAM application
# This version handles branch switching and repository setup

set -e  # Exit on error, but don't show commands

echo "========================================="
echo "TEAM Application Deployment"
echo "========================================="
echo ""

# Load parameters
. "/Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team/deployment/parameters.sh"

# Set AWS Profile
if [ -z "$TEAM_ACCOUNT" ]; then 
  export AWS_PROFILE=$ORG_MASTER_PROFILE
else 
  export AWS_PROFILE=$TEAM_ACCOUNT_PROFILE
fi

echo "Using AWS Profile: $AWS_PROFILE"
echo "Region: $REGION"
echo "Account: $TEAM_ACCOUNT"
echo ""

# Navigate to project root
cd /Users/umair/2026/Upwork/Steve/CLOUDIQS-MSP/iam-identity-center-team

# Check if using external repository or CodeCommit
if [ -z "$SECRET_NAME" ]; then
  echo "========================================="
  echo "Step 1: Setting up CodeCommit Repository"
  echo "========================================="
  echo ""
  
  # Save current branch
  CURRENT_BRANCH=$(git branch --show-current)
  echo "Current branch: $CURRENT_BRANCH"
  
  # Check if main branch exists locally
  if git show-ref --verify --quiet refs/heads/main; then
    echo "Main branch exists locally"
  else
    echo "Creating main branch from current branch..."
    git branch main
  fi
  
  # Stash any uncommitted changes
  echo "Stashing uncommitted changes..."
  git stash push -m "Deployment stash at $(date)"
  
  # Switch to main branch
  echo "Switching to main branch..."
  git checkout main
  
  # Create or update CodeCommit repository
  echo ""
  echo "Creating CodeCommit repository: team-idc-app"
  aws codecommit create-repository \
    --region $REGION \
    --repository-name team-idc-app \
    --repository-description "Temporary Elevated Access Management (TEAM) Application" 2>/dev/null || echo "Repository may already exist, continuing..."
  
  # Update git remote
  echo "Updating git remote to CodeCommit..."
  git remote remove codecommit 2>/dev/null || true
  git remote add codecommit codecommit::$REGION://team-idc-app
  
  # Push to CodeCommit
  echo "Pushing code to CodeCommit..."
  git push codecommit main --force
  
  echo ""
  echo "✓ Code pushed to CodeCommit successfully!"
  echo ""
  
  # Switch back to original branch
  echo "Switching back to branch: $CURRENT_BRANCH"
  git checkout $CURRENT_BRANCH
  
  # Restore stashed changes
  echo "Restoring uncommitted changes..."
  git stash pop 2>/dev/null || echo "No stashed changes to restore"
  
  cd ./deployment
  
  echo ""
  echo "========================================="
  echo "Step 2: Deploying CloudFormation Stack"
  echo "========================================="
  echo ""
  
  # Deploy CloudFormation stack
  if [[ ! -z "$TAGS" ]]; then
    if [[ ! -z "$UI_DOMAIN" ]]; then
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          tags="$TAGS" \
          teamAccount="$TEAM_ACCOUNT" \
          customAmplifyDomain="$UI_DOMAIN" \
        --tags $TAGS \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    else
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          tags="$TAGS" \
          teamAccount="$TEAM_ACCOUNT" \
        --tags $TAGS \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    fi
  else
    if [[ ! -z "$UI_DOMAIN" ]]; then
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          teamAccount="$TEAM_ACCOUNT" \
          tags="$TAGS" \
          customAmplifyDomain="$UI_DOMAIN" \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    else
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          teamAccount="$TEAM_ACCOUNT" \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    fi
  fi
else
  # Using external repository
  echo "Using external repository from secret: $SECRET_NAME"
  cd ./deployment
  
  if [[ ! -z "$TAGS" ]]; then
    if [[ ! -z "$UI_DOMAIN" ]]; then
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          tags="$TAGS" \
          teamAccount="$TEAM_ACCOUNT" \
          customAmplifyDomain="$UI_DOMAIN" \
          customRepository="Yes" \
          customRepositorySecretName="$SECRET_NAME" \
        --tags $TAGS \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    else
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          tags="$TAGS" \
          teamAccount="$TEAM_ACCOUNT" \
          customRepository="Yes" \
          customRepositorySecretName="$SECRET_NAME" \
        --tags $TAGS \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    fi
  else
    if [[ ! -z "$UI_DOMAIN" ]]; then
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          teamAccount="$TEAM_ACCOUNT" \
          tags="$TAGS" \
          customAmplifyDomain="$UI_DOMAIN" \
          customRepository="Yes" \
          customRepositorySecretName="$SECRET_NAME" \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    else
      aws cloudformation deploy --region $REGION --template-file template.yml \
        --stack-name TEAM-IDC-APP \
        --parameter-overrides \
          Login=$IDC_LOGIN_URL \
          CloudTrailAuditLogs=$CLOUDTRAIL_AUDIT_LOGS \
          teamAdminGroup="$TEAM_ADMIN_GROUP" \
          teamAuditGroup="$TEAM_AUDITOR_GROUP" \
          teamAccount="$TEAM_ACCOUNT" \
          customRepository="Yes" \
          customRepositorySecretName="$SECRET_NAME" \
        --no-fail-on-empty-changeset --capabilities CAPABILITY_NAMED_IAM
    fi
  fi
fi

echo ""
echo "========================================="
echo "✓ Deployment Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Run ./integration.sh to get SAML configuration"
echo "2. Configure IAM Identity Center SAML application"
echo "3. Run ./cognito.sh to link Cognito with Identity Center"
echo ""
