# 🧪 Complete Testing Guide - Deploy & Test Before Showing Steve

## Overview
This guide helps you deploy and test the CloudiQS MSP solution in your own AWS environment BEFORE presenting to Steve. You'll test the complete workflow end-to-end.

## What You'll Need (Prerequisites)

### 1. Your Own AWS Account (For Testing)
**Why**: To test without affecting Steve's production
**What you need**:
- [ ] AWS Account (can be your personal account or a CloudiQS test account)
- [ ] Admin access to this account
- [ ] AWS CLI configured on your machine

### 2. Development Environment
**On your machine**:
- [ ] Node.js 14+ installed
- [ ] npm or yarn installed
- [ ] AWS Amplify CLI installed: `npm install -g @aws-amplify/cli`
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

### 3. AWS Services You'll Set Up
**In your test AWS account**:
- [ ] IAM Identity Center (AWS SSO) - For authentication
- [ ] Amazon SES - For email testing
- [ ] AWS Bedrock - For AI summaries (optional, can test fallback)
- [ ] CloudTrail - For audit logs (optional for basic testing)

---

## Phase 1: Local Testing (No AWS Required) - 30 Minutes

### Step 1.1: Install Dependencies

```bash
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp

# Install npm packages
npm install

# Verify installation
npm list --depth=0
```

**Expected output**: All dependencies installed without errors

---

### Step 1.2: Start Local Development Server

```bash
npm start
```

**Expected output**: 
```
Compiled successfully!
You can now view team in the browser.
  Local:            http://localhost:3000
```

**Action**: Open browser to http://localhost:3000

---

### Step 1.3: Test UI Components Locally

**Test 1: Landing Page**
1. Navigate to http://localhost:3000
2. Verify:
   - ✅ Purple gradient header displays
   - ✅ "CloudiQS MSP Platform" title visible
   - ✅ Platform statistics section (shows 0 initially)
   - ✅ Quick actions dropdown

**Screenshot**: Take screenshot of landing page

**Test 2: Navigation (Without Auth)**
- Click different menu items
- Note: Most features require authentication (will show login)

**Result**: UI loads correctly, styled properly ✅

---

### Step 1.4: Build Test

```bash
# Stop the dev server (Ctrl+C)

# Build for production
npm run build
```

**Expected output**:
```
Creating an optimized production build...
Compiled successfully.
```

**Verify**: Check `build/` directory exists with compiled files

---

## Phase 2: AWS Test Environment Setup - 1-2 Hours

### Step 2.1: Configure AWS CLI

```bash
# Configure AWS CLI with your test account
aws configure

# Enter:
# AWS Access Key ID: [your key]
# AWS Secret Access Key: [your secret]
# Default region: us-east-1
# Default output format: json

# Verify
aws sts get-caller-identity
```

**Expected output**: Shows your AWS account ID and user

---

### Step 2.2: Set Up IAM Identity Center (AWS SSO)

**Option A: Already Have IAM Identity Center**
```bash
# Get your Identity Center instance ARN
aws sso-admin list-instances

# Note the InstanceArn and IdentityStoreId
```

**Option B: Need to Set Up IAM Identity Center**
1. Go to AWS Console → IAM Identity Center
2. Click "Enable"
3. Choose "Identity Center directory"
4. Create an admin user for testing
5. Note the Identity Center ARN

**What to note**:
```
Identity Center Instance ARN: arn:aws:sso:::instance/ssoins-XXXX
Identity Store ID: d-XXXXXXXXXX
AWS Access Portal URL: https://d-XXXXXXXXXX.awsapps.com/start
```

**Create Test User**:
1. In IAM Identity Center → Users
2. Click "Add user"
3. Username: `test-admin`
4. Email: Your email address
5. First/Last name: Test Admin
6. Click "Add user"
7. Check your email and set password

**Create Test Groups**:
1. Groups → Add group
2. Create these groups:
   - `Admin` (for full access)
   - `Auditors` (for audit access)
3. Add your test user to Admin group

---

### Step 2.3: Set Up Amazon SES (Email Testing)

```bash
# Verify your email address for testing
aws ses verify-email-identity --email-address YOUR_EMAIL@example.com

# Check verification status
aws ses get-identity-verification-attributes --identities YOUR_EMAIL@example.com
```

**Check your email**: Click verification link from AWS

**Verify it worked**:
```bash
aws ses list-verified-email-addresses
```

**Send test email**:
```bash
aws ses send-email \
  --from YOUR_EMAIL@example.com \
  --to YOUR_EMAIL@example.com \
  --subject "Test Email" \
  --text "This is a test from SES"
```

**Check your inbox**: Should receive the test email

**Important**: In SES sandbox mode, you can only send to verified addresses. This is fine for testing!

---

### Step 2.4: Set Up AWS Bedrock (Optional for AI)

**Check if Bedrock is available in your region**:
```bash
aws bedrock list-foundation-models --region us-east-1 2>/dev/null || echo "Bedrock not available"
```

**If available, request model access**:
1. Go to AWS Console → Bedrock
2. Navigate to "Model access"
3. Click "Edit"
4. Select "Claude 3 Sonnet"
5. Click "Save changes"
6. Wait for "Access granted" (usually instant)

**Test Bedrock access**:
```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","messages":[{"role":"user","content":"Hello"}],"max_tokens":100}' \
  --cli-binary-format raw-in-base64-out \
  /tmp/bedrock-test.json

cat /tmp/bedrock-test.json
```

**If Bedrock not available**: That's OK! The solution has a fallback that generates statistical summaries.

---

### Step 2.5: Initialize Amplify

```bash
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp

# Initialize Amplify (if not already done)
amplify configure

# Follow prompts:
# Sign in to AWS Console (opens browser)
# Specify region: us-east-1
# Create IAM user: amplify-test-user
# Save the access keys

# Initialize the project
amplify init

# Project name: cloudiqs-msp-test
# Environment: dev
# Default editor: Visual Studio Code (or your preference)
# App type: javascript
# Framework: react
# Source directory: src
# Distribution directory: build
# Build command: npm run build
# Start command: npm start
# Use AWS profile: default (or your profile)
```

**This creates**: Amplify configuration in your AWS account

---

### Step 2.6: Deploy Backend

```bash
# Deploy API and functions
amplify push

# Confirm when asked
# ✔ Are you sure you want to continue? (Y/n) · yes
```

**This will**:
- Create DynamoDB tables (requests, sessions, customers, approvers, eligibility, settings)
- Deploy Lambda functions
- Create AppSync GraphQL API
- Set up authentication

**Expected time**: 10-15 minutes

**Verify deployment**:
```bash
amplify status
```

**Should show**:
```
Current Environment: dev

| Category | Resource name      | Operation | Provider plugin |
| -------- | ------------------ | --------- | --------------- |
| Api      | team               | No Change | awscloudformation|
| Auth     | team06dbb7fc       | No Change | awscloudformation|
| Function | teamRouter         | No Change | awscloudformation|
...
```

---

### Step 2.7: Configure IAM Identity Center Integration

**Get your Cognito User Pool ID**:
```bash
amplify auth console
# Opens browser to Cognito
# Note the User Pool ID
```

**Configure SAML Integration**:
1. In IAM Identity Center → Applications
2. Click "Add application"
3. Choose "Custom SAML 2.0 application"
4. Application name: `CloudiQS-MSP-Test`
5. Download the IAM Identity Center SAML metadata file
6. In Cognito User Pool → Sign-in experience → Federated identity providers
7. Click "Add SAML provider"
8. Upload the metadata file
9. Complete the setup following Amplify Auth SAML documentation

**Simplified Alternative for Testing**:
Create a test user directly in Cognito:
```bash
# Get User Pool ID
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 | jq -r '.UserPools[] | select(.Name | contains("team")) | .Id')

# Create test user
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username test-admin \
  --user-attributes Name=email,Value=YOUR_EMAIL@example.com \
  --temporary-password TempPass123!

# Add user to Admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username test-admin \
  --group-name Admin
```

---

## Phase 3: End-to-End Testing - 2 Hours

### Step 3.1: Test Authentication

**Start the app**:
```bash
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp
npm start
```

**Test login**:
1. Navigate to http://localhost:3000
2. Click "Federated Sign In" (or your login button)
3. Enter test credentials:
   - Username: test-admin
   - Password: (your Cognito password)
4. If prompted, change password

**Expected**: Successfully logged in, see navigation menu

**Screenshot**: Take screenshot of logged-in interface

---

### Step 3.2: Test Customer Management

**Create Test Customer**:
1. Navigate to Admin → Customers
2. Click "Add Customer"
3. Fill in form:
   - Customer Name: `Test Corp`
   - Company Name: `Test Corporation`
   - Contact Person: `John Doe`
   - Email: `test@testcorp.com`
   - Approver Email: YOUR_EMAIL@example.com (use your verified SES email!)
   - AWS Account IDs: `123456789012` (fake account for testing)
   - Click "Create"

**Verify**:
- ✅ Customer appears in list
- ✅ Shows active status
- ✅ Display information correct

**Screenshot**: Customer management page with test customer

**Verify in DynamoDB**:
```bash
# List customers table
TABLE_NAME=$(aws dynamodb list-tables | jq -r '.TableNames[] | select(contains("Customer"))')
aws dynamodb scan --table-name $TABLE_NAME --limit 5
```

**Should see**: Your test customer in the database

---

### Step 3.3: Test Access Request Creation

**Create Test Request**:
1. Navigate to Requests → Create request
2. Fill in form:
   - Customer: Select "Test Corp"
   - Account: Select available account (or shows empty if no accounts configured)
   - Role: (May not have options without IAM Identity Center fully configured)
   - Start time: Now
   - Duration: 1 hour
   - Justification: "Testing the CloudiQS MSP workflow"
   - Ticket No: "TEST-001"
3. Click Submit

**Expected outcome**:
- If IAM Identity Center fully configured: Request created successfully
- If not configured: May get validation errors about accounts/roles

**For testing without full IAM setup**:
You can test the UI flow and verify:
- ✅ Customer dropdown works
- ✅ Form validation works
- ✅ Customer data is included in request

---

### Step 3.4: Test Email Approval Handler (Manual Test)

**Since email approval requires API Gateway setup, test Lambda directly**:

**Create test event file**:
```bash
cat > /tmp/approval-test.json << 'EOF'
{
  "queryStringParameters": {
    "requestId": "test-request-123",
    "action": "approve",
    "token": "test-token"
  }
}
EOF
```

**Test Lambda locally** (if you deployed teamEmailApprovalHandler):
```bash
# Get function name
FUNCTION_NAME=$(aws lambda list-functions | jq -r '.Functions[] | select(.FunctionName | contains("EmailApproval")) | .FunctionName')

# Invoke
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload file:///tmp/approval-test.json \
  /tmp/approval-response.json

cat /tmp/approval-response.json
```

**Expected**: HTML response (will error on invalid token, but proves Lambda works)

---

### Step 3.5: Test AI Summary Generation

**Test Bedrock Lambda** (if deployed):
```bash
cat > /tmp/ai-summary-test.json << 'EOF'
{
  "accountId": "123456789012",
  "username": "test-user",
  "startTime": "2024-01-30T10:00:00Z",
  "endTime": "2024-01-30T11:00:00Z",
  "customerName": "Test Corp",
  "accountName": "Test Account",
  "role": "AdminRole"
}
EOF

# Get function name
FUNCTION_NAME=$(aws lambda list-functions | jq -r '.Functions[] | select(.FunctionName | contains("AISummary")) | .FunctionName')

# Invoke
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload file:///tmp/ai-summary-test.json \
  /tmp/summary-response.json

cat /tmp/summary-response.json
```

**Expected**:
- If Bedrock configured: AI-generated summary
- If not: Fallback statistical summary

**Both are valid** - proves the system works!

---

### Step 3.6: Test Landing Page Statistics

**Navigate to home page**:
1. Go to http://localhost:3000
2. Verify statistics show:
   - Total Customers: 1 (your test customer)
   - Active Customers: 1
   - AWS Accounts: 1

**Screenshot**: Landing page with statistics

---

### Step 3.7: Test Navigation & UI

**Test all menu items**:
- [ ] Requests → Create request (opens form)
- [ ] Requests → My requests (lists requests)
- [ ] Approvals → Approve requests (if any pending)
- [ ] Approvals → My approvals (lists your approvals)
- [ ] Elevated access → Active access (lists active sessions)
- [ ] Elevated access → Ended access (lists ended sessions)
- [ ] Admin → Customers (customer management) ✅
- [ ] Admin → Approver policy (policy configuration)
- [ ] Admin → Eligibility policy (eligibility configuration)
- [ ] Admin → Settings (settings page)

**Verify**:
- ✅ All pages load without errors
- ✅ Customer dropdown appears in request form
- ✅ Navigation works smoothly
- ✅ No console errors

---

## Phase 4: Verify Email Templates (Without Sending)

### Step 4.1: Review Email Template Code

**View approval email template**:
```bash
cat /home/runner/work/cloudiqs-msp/cloudiqs-msp/amplify/backend/function/teamNotifications/src/email_templates.py
```

**Verify**:
- ✅ Beautiful HTML design
- ✅ Approve/reject buttons included
- ✅ Customer-friendly language
- ✅ AI summary section placeholder

---

## Phase 5: What to Document for Steve

### Create a Test Report

**Document your findings**:

```markdown
# CloudiQS MSP Test Report

**Tested By**: Umair Khan
**Date**: [Date]
**Environment**: Test AWS Account

## Test Results

### ✅ Passed Tests
1. Local UI loads correctly
2. Build completes successfully
3. Customer management CRUD operations
4. Request form includes customer selection
5. Landing page displays statistics
6. Navigation works across all pages
7. Email templates are professional
8. Lambda functions deploy successfully
9. DynamoDB tables created correctly

### ⚠️ Partial/Limited Tests
1. End-to-end request flow (needs full IAM Identity Center setup)
2. Email approval flow (needs API Gateway setup)
3. AI summaries (tested fallback mode only)

### 🔧 Requires Steve's Production Setup
1. Production AWS account access
2. Production IAM Identity Center configuration
3. Production SES domain verification
4. Production API Gateway setup
5. Real customer AWS account IDs

## Screenshots
[Include your screenshots here]

## Ready for Production: YES
All core functionality verified. Production deployment requires Steve's AWS account details.
```

---

## What to Ask Steve (Production Deployment)

### Critical Information Needed:

**1. AWS Account Details**
```
Question: "What's your AWS account ID for production deployment?"
Expected answer: 12-digit number

Question: "Which AWS region should we use?"
Expected answer: us-east-1 (or another region)

Question: "Do you have a separate staging environment?"
Expected answer: Yes/No, if yes, get staging account details
```

**2. IAM Identity Center**
```
Question: "Is IAM Identity Center (AWS SSO) already set up?"
Expected answer: Yes/No
If yes: "What's the Identity Center instance ARN?"
If no: "I can set it up during deployment"
```

**3. Email Configuration**
```
Question: "What email address should send notifications?"
Expected answer: noreply@cloudiqs.com

Question: "Is this domain verified in Amazon SES?"
Expected answer: Yes/No
If no: "We'll verify it during setup (takes 5 minutes)"
```

**4. AWS Bedrock**
```
Question: "Do you want AI-powered summaries for customers?"
Expected answer: Yes/No
If yes: "I'll request Bedrock access (usually instant approval)"
If no: "We'll use statistical summaries instead"
```

**5. First Customers**
```
Question: "Which 2-3 customers should we onboard first as a pilot?"
Expected answer: Customer names

Question: "What are their AWS account IDs?"
Expected answer: List of account IDs

Question: "What email should receive approval requests for each customer?"
Expected answer: List of approver emails
```

**6. Timeline**
```
Question: "When would you like to go live?"
Expected answer: Specific date or "ASAP"

Question: "Should we test with one customer first, then roll out to others?"
Expected answer: Yes (recommended) or No
```

---

## Quick Pre-Demo Checklist

Before showing to Steve:

### UI/Frontend
- [ ] Landing page loads with proper branding
- [ ] Customer management works
- [ ] Request form includes customer selection
- [ ] All navigation items work
- [ ] No console errors
- [ ] Mobile responsive

### Backend
- [ ] DynamoDB tables created
- [ ] Lambda functions deployed
- [ ] GraphQL API working
- [ ] Authentication functional

### Documentation
- [ ] Test report written
- [ ] Screenshots captured
- [ ] Questions for Steve prepared
- [ ] Timeline estimate ready

### Demo Prep
- [ ] Test environment ready to show
- [ ] Can create customer live
- [ ] Can show request flow
- [ ] Can explain email approval
- [ ] Can show AI summaries (or fallback)

---

## Demo Script for Steve

**Introduction (2 minutes)**:
"Steve, I've completed the CloudiQS MSP implementation and tested it in a test AWS environment. Let me show you what we built."

**Show Landing Page (2 minutes)**:
"Here's the new marketplace-style landing page. It shows platform statistics - customers, active accounts, etc."

**Show Customer Management (5 minutes)**:
"This is where you manage customers. I'll create a test customer right now..."
[Create customer live]
"See how easy it is? Customer name, company, AWS accounts, approver email."

**Show Request Workflow (5 minutes)**:
"Now when DevOps needs access, they select the customer first..."
[Show request form]
"Notice the customer dropdown at the top. Then account, permissions, duration - max 1 hour."

**Show Email Template (3 minutes)**:
"When a request is submitted, the customer gets this beautiful email..."
[Show email template code or mockup]
"They click approve or reject. No portal access needed!"

**Show AI Summaries (3 minutes)**:
"After access ends, customers get an AI-generated summary..."
[Show example summary]
"Plain English, explains what was done. Very customer-friendly."

**Next Steps (5 minutes)**:
"To deploy to your production AWS account, I need..."
[Go through questions from above]
"Once I have these details, deployment takes 30-60 minutes. Can have it live same day."

---

## Troubleshooting Common Issues

### Issue: "amplify push fails"
**Solution**:
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check CloudFormation stacks
aws cloudformation list-stacks --stack-status-filter CREATE_IN_PROGRESS UPDATE_IN_PROGRESS

# View errors
amplify status
amplify push --debug
```

### Issue: "Cannot create customer"
**Solution**:
- Check browser console for errors
- Verify API is deployed: `amplify status`
- Check GraphQL endpoint in network tab
- Verify authentication token is valid

### Issue: "Email not sending"
**Solution**:
```bash
# Verify email address
aws ses get-identity-verification-attributes --identities YOUR_EMAIL

# Check SES sending limits
aws ses get-send-quota

# Check you're not in sandbox mode (or use verified emails only)
```

### Issue: "Bedrock access denied"
**Solution**:
- Go to AWS Console → Bedrock → Model access
- Request access to Claude 3 Sonnet
- Wait for approval (usually instant)
- Retry test

---

## Time Estimates

### Total Testing Time: 4-6 hours

- **Phase 1** (Local): 30 minutes
- **Phase 2** (AWS Setup): 1-2 hours
- **Phase 3** (E2E Testing): 2 hours
- **Phase 4** (Email Review): 30 minutes
- **Phase 5** (Documentation): 30 minutes

### Can be done in one day!

**Morning (3 hours)**:
- Set up AWS test environment
- Deploy application
- Basic functionality testing

**Afternoon (2 hours)**:
- Complete end-to-end tests
- Document findings
- Prepare for Steve demo

**Next Day**:
- Demo to Steve
- Get production details
- Deploy to production

---

## Summary

You now have a complete testing guide to:
1. ✅ Set up test environment
2. ✅ Deploy application
3. ✅ Test all features
4. ✅ Verify functionality
5. ✅ Document results
6. ✅ Prepare for Steve
7. ✅ Know what questions to ask

**Next Action**: Start with Phase 1 (Local Testing) - takes only 30 minutes!

**After Testing**: Schedule demo with Steve, show him working system, get production AWS details, deploy to production!

---

**Document Version**: 1.0
**Purpose**: Complete testing guide before Steve demo
**Time Required**: 4-6 hours for full testing
**Outcome**: Working demo + production readiness
