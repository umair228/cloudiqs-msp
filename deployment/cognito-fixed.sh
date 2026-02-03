#!/usr/bin/env bash
# Fixed cognito.sh script with interactive SAML metadata URL input

set -e

echo "=========================================="
echo "Cognito SAML Identity Provider Setup"
echo "=========================================="
echo ""

. "./parameters.sh"

if [ -z "$TEAM_ACCOUNT" ]; then 
  export AWS_PROFILE=$ORG_MASTER_PROFILE
else 
  export AWS_PROFILE=$TEAM_ACCOUNT_PROFILE
fi

echo "Using AWS Profile: $AWS_PROFILE"
echo "Region: $REGION"
echo ""

# Get Cognito User Pool ID
echo "Finding Cognito User Pool..."
cognitoUserpoolId=$(aws cognito-idp list-user-pools --region $REGION --max-results 10 --output json | jq -r '.UserPools[] | select(.Name | contains("team06dbb7fc")) | .Id')

if [ -z "$cognitoUserpoolId" ]; then
  echo "❌ Error: Could not find Cognito User Pool"
  echo "Make sure the Amplify backend has been deployed successfully"
  exit 1
fi

echo "✓ Found User Pool: $cognitoUserpoolId"

# Get Client ID
echo "Finding App Client..."
clientID=$(aws cognito-idp list-user-pool-clients --region $REGION --user-pool-id $cognitoUserpoolId --output json | jq -r '.UserPoolClients[] | select(.ClientName | contains("clientWeb")) | .ClientId')

if [ -z "$clientID" ]; then
  echo "❌ Error: Could not find App Client"
  exit 1
fi

echo "✓ Found Client ID: $clientID"

# Get Amplify App details
echo "Finding Amplify App..."
amplifyAppId=$(aws amplify list-apps --region $REGION --output json | jq -r '.apps[] | select(.name=="TEAM-IDC-APP") | .appId')
amplifyDomain=$(aws amplify list-apps --region $REGION --output json | jq -r '.apps[] | select(.name=="TEAM-IDC-APP") | .defaultDomain')
amplifyDomain="main.$amplifyDomain"

echo "✓ Found Amplify Domain: $amplifyDomain"

# Check for custom domain
amplifyCustomDomains=$(aws amplify list-domain-associations --region $REGION --app-id $amplifyAppId --output json 2>/dev/null || echo '{"domainAssociations":[]}')
amplifyCustomDomain=$(echo $amplifyCustomDomains | jq -r 'select(.domainAssociations | length > 0) | .domainAssociations[0].domainName')

if [ -n "$amplifyCustomDomain" ]; then
  amplifyCustomDomainPrefix=$(echo $amplifyCustomDomains | jq -r 'select(.domainAssociations | length > 0) | .domainAssociations[0].subDomains[] | select(.subDomainSetting.branchName=="main") | .subDomainSetting.prefix')
  amplifyDomain=$([ -z "$amplifyCustomDomainPrefix" ] && echo $amplifyCustomDomain || echo $amplifyCustomDomainPrefix.$amplifyCustomDomain)
  echo "✓ Using custom domain: $amplifyDomain"
fi

echo ""
echo "=========================================="
echo "IAM Identity Center SAML Configuration"
echo "=========================================="
echo ""
echo "You need to provide the SAML metadata URL from IAM Identity Center."
echo ""
echo "To get this URL:"
echo "1. Go to IAM Identity Center Console"
echo "2. Navigate to Applications → TEAM IDC APP"
echo "3. Click 'Edit configuration'"
echo "4. Copy the 'AWS IAM Identity Center SAML metadata file URL'"
echo ""
echo "The URL looks like:"
echo "https://portal.sso.us-east-1.amazonaws.com/saml/metadata/[instance-id]"
echo ""
read -p "Enter the SAML Metadata URL: " METADATA_URL

if [ -z "$METADATA_URL" ]; then
  echo "❌ Error: SAML Metadata URL is required"
  exit 1
fi

echo ""
echo "Creating details.json file..."

# Create details.json with the metadata URL
cat > details.json << EOF
{
  "MetadataURL": "$METADATA_URL"
}
EOF

echo "✓ Created details.json"
echo ""

# Check if identity provider already exists
echo "Checking if SAML identity provider already exists..."
EXISTING_IDP=$(aws cognito-idp describe-identity-provider \
  --region $REGION \
  --user-pool-id $cognitoUserpoolId \
  --provider-name IDC 2>/dev/null || echo "")

if [ -n "$EXISTING_IDP" ]; then
  echo "⚠️  SAML identity provider 'IDC' already exists"
  read -p "Do you want to update it? (y/n): " UPDATE_IDP
  
  if [ "$UPDATE_IDP" = "y" ] || [ "$UPDATE_IDP" = "Y" ]; then
    echo "Updating identity provider..."
    aws cognito-idp update-identity-provider \
      --region $REGION \
      --user-pool-id $cognitoUserpoolId \
      --provider-name IDC \
      --provider-details file://details.json \
      --attribute-mapping email=Email
    echo "✓ Updated identity provider"
  else
    echo "Skipping identity provider creation"
  fi
else
  echo "Creating SAML identity provider..."
  aws cognito-idp create-identity-provider \
    --region $REGION \
    --user-pool-id $cognitoUserpoolId \
    --provider-name IDC \
    --provider-type SAML \
    --provider-details file://details.json \
    --attribute-mapping email=Email \
    --idp-identifiers team
  echo "✓ Created identity provider 'IDC'"
fi

echo ""
echo "Updating Cognito App Client..."
aws cognito-idp update-user-pool-client \
  --region $REGION \
  --user-pool-id $cognitoUserpoolId \
  --client-id $clientID \
  --refresh-token-validity 1 \
  --supported-identity-providers IDC \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes "phone" "email" "openid" "profile" "aws.cognito.signin.user.admin" \
  --logout-urls "https://$amplifyDomain/" \
  --callback-urls "https://$amplifyDomain/" \
  --allowed-o-auth-flows-user-pool-client

echo "✓ Updated App Client"
echo ""
echo "=========================================="
echo "✓ Configuration Complete!"
echo "=========================================="
echo ""
echo "Your TEAM application is now configured for SAML authentication!"
echo ""
echo "Next steps:"
echo "1. Open: https://$amplifyDomain"
echo "2. Click 'Federated Sign In'"
echo "3. Sign in with your Identity Center credentials"
echo ""
echo "If you encounter any issues:"
echo "- Verify users/groups are assigned to TEAM IDC APP in Identity Center"
echo "- Check attribute mappings (Subject and Email) are configured"
echo "- Ensure the SAML metadata URL is correct"
echo ""

# Clean up
rm -f details.json
echo "✓ Cleaned up temporary files"
