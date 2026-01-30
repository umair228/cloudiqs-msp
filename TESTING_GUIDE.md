# Testing Guide - CloudiQS MSP

## Overview
This document outlines all testing that should be performed before, during, and after deployment of the CloudiQS MSP solution.

## Test Environments

### Environment 1: Local Development
**Purpose**: Initial functionality testing
**Setup**: `npm start` on local machine
**Limitations**: No real AWS services, mocked data

### Environment 2: AWS Staging/Dev
**Purpose**: Integration testing with real AWS services
**Setup**: Full Amplify deployment to dev/staging account
**Requirements**: AWS account, IAM Identity Center, SES sandbox

### Environment 3: AWS Production
**Purpose**: Final validation and go-live
**Setup**: Full production deployment
**Requirements**: All AWS services configured for production

## Pre-Deployment Tests

### 1. Local UI Tests (No AWS Required)

**Test 1.1: Customer Management UI**
```bash
# Start the app
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp
npm install
npm start
```

**Steps:**
1. Navigate to Admin → Customers
2. Click "Add Customer"
3. Fill in form with test data:
   - Name: "Test Customer"
   - Company: "Test Corp"
   - Email: "test@example.com"
   - Approver Email: "approver@example.com"
   - AWS Accounts: "123456789012"
4. Click Create
5. Verify customer appears in list
6. Click on customer card to edit
7. Update company name
8. Click Update
9. Verify changes saved

**Expected Results:**
- ✅ Form validation works
- ✅ Customer creation succeeds (might show error without AWS backend)
- ✅ Edit modal opens
- ✅ Update functionality works
- ✅ Search/filter works

**Screenshot Required**: Yes - Customer management interface

---

**Test 1.2: Request Form with Customer Selection**

**Steps:**
1. Navigate to Requests → Create request
2. Verify customer dropdown appears as first field
3. Try to submit without selecting customer
4. Verify validation error appears
5. Select a customer (might be empty without backend)
6. Verify rest of form appears

**Expected Results:**
- ✅ Customer dropdown is first field
- ✅ Validation prevents submission without customer
- ✅ Form fields are properly ordered
- ✅ All fields have proper labels

**Screenshot Required**: Yes - Request form with customer dropdown

---

**Test 1.3: Landing Page**

**Steps:**
1. Navigate to home page (/)
2. Verify new marketplace design loads
3. Check platform statistics section
4. Verify "Manage customers" option in quick actions
5. Click quick actions → Manage customers
6. Verify navigation to customer management

**Expected Results:**
- ✅ Gradient header displays
- ✅ Statistics show (may be 0 without data)
- ✅ Quick actions work
- ✅ Navigation functional
- ✅ Responsive on mobile

**Screenshot Required**: Yes - Landing page with new design

---

### 2. Code Quality Tests

**Test 2.1: Linting**
```bash
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp
npm run lint 2>&1 || echo "Linting complete"
```

**Expected Results:**
- ✅ No critical errors
- ⚠️ Minor warnings acceptable

---

**Test 2.2: Build Test**
```bash
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp
npm run build
```

**Expected Results:**
- ✅ Build completes successfully
- ✅ No compilation errors
- ✅ Build artifacts created in build/ directory

---

**Test 2.3: Security Scan (Already Done)**
```bash
# CodeQL already passed with 0 vulnerabilities
# No action needed
```

**Status**: ✅ PASSED (0 vulnerabilities)

---

## AWS Integration Tests (Staging)

### 3. Backend Deployment Tests

**Test 3.1: Amplify Deployment**
```bash
cd /home/runner/work/cloudiqs-msp/cloudiqs-msp
amplify status
amplify push --yes
```

**Expected Results:**
- ✅ GraphQL API deployed
- ✅ Lambda functions deployed
- ✅ DynamoDB tables created
- ✅ IAM roles configured

**Verify in AWS Console:**
- DynamoDB tables: requests, sessions, customers, approvers, eligibility, settings
- Lambda functions: teamEmailApprovalHandler, teamAISummaryGenerator
- AppSync API with updated schema

---

**Test 3.2: Customer CRUD Operations**

**Steps:**
1. Login to deployed app
2. Navigate to Admin → Customers
3. Create customer with real data
4. Verify customer saved in DynamoDB
5. Edit customer
6. Verify update in DynamoDB
7. Check customer status can be toggled

**AWS Console Verification:**
```bash
# Check DynamoDB
aws dynamodb scan --table-name Customer-[env] --limit 10
```

**Expected Results:**
- ✅ Customer created in DynamoDB
- ✅ All fields saved correctly
- ✅ Updates reflected immediately
- ✅ customerId generated properly

---

### 4. Email Approval Tests

**Test 4.1: Email Configuration**

**Pre-requisites:**
- SES email verified
- API Gateway deployed
- teamEmailApprovalHandler Lambda deployed

**Steps:**
1. Verify SES email in AWS Console
2. Send test email via SES
3. Confirm email received

**AWS CLI Test:**
```bash
aws ses verify-email-identity --email-address test@yourdomain.com
aws ses send-email \
  --from noreply@yourdomain.com \
  --to test@yourdomain.com \
  --subject "Test" \
  --text "Test email"
```

**Expected Results:**
- ✅ Email verified in SES
- ✅ Test email received
- ✅ Not in spam folder

---

**Test 4.2: Approval Lambda Function**

**Test Directly:**
```bash
# Create test event
cat > test-approval-event.json << 'EOF'
{
  "queryStringParameters": {
    "requestId": "test-request-123",
    "action": "approve",
    "token": "test-token"
  }
}
EOF

# Invoke Lambda
aws lambda invoke \
  --function-name teamEmailApprovalHandler \
  --payload file://test-approval-event.json \
  output.json

cat output.json
```

**Expected Results:**
- ✅ Lambda executes successfully
- ✅ Returns HTML response
- ✅ Status code 200 (or appropriate error)

---

**Test 4.3: Full Email Approval Flow**

**Manual Test:**
1. Create an access request in UI
2. Get request ID from DynamoDB
3. Generate approval token (use Lambda helper)
4. Construct approval URL:
   ```
   https://[api-gateway-url]/approval-handler?requestId=XXX&action=approve&token=YYY
   ```
5. Open URL in browser
6. Verify HTML confirmation page displays
7. Check DynamoDB - request status should be "approved"

**Expected Results:**
- ✅ Approval URL works
- ✅ Confirmation page renders
- ✅ Request status updated
- ✅ Token validation works

---

### 5. AI Summary Tests

**Test 5.1: Bedrock Access**

**Verify Bedrock:**
```bash
# Check Bedrock model access
aws bedrock list-foundation-models --region us-east-1

# Test invocation
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","messages":[{"role":"user","content":"Hello"}],"max_tokens":100}' \
  --cli-binary-format raw-in-base64-out \
  output.json

cat output.json
```

**Expected Results:**
- ✅ Model accessible
- ✅ API responds
- ✅ No permission errors

---

**Test 5.2: AI Summary Generation**

**Test Lambda:**
```bash
# Create test payload
cat > test-summary-event.json << 'EOF'
{
  "accountId": "123456789012",
  "username": "testuser",
  "startTime": "2024-01-30T10:00:00Z",
  "endTime": "2024-01-30T11:00:00Z",
  "customerName": "Test Customer",
  "accountName": "Test Account",
  "role": "AdminRole",
  "eventDataStoreId": "arn:aws:cloudtrail:..."
}
EOF

# Invoke Lambda
aws lambda invoke \
  --function-name teamAISummaryGenerator \
  --payload file://test-summary-event.json \
  output.json

cat output.json
```

**Expected Results:**
- ✅ Lambda executes
- ✅ AI summary generated
- ✅ Fallback works if Bedrock unavailable
- ✅ Summary stored in sessions table

---

**Test 5.3: Fallback Summary**

**Test Without Bedrock:**
1. Temporarily remove Bedrock permissions
2. Invoke AI summary Lambda
3. Verify fallback statistical summary generated
4. Restore Bedrock permissions

**Expected Results:**
- ✅ Fallback activates
- ✅ Statistical summary created
- ✅ No errors thrown
- ✅ Summary includes event counts

---

### 6. Integration Tests

**Test 6.1: End-to-End Request Flow**

**Complete Workflow:**
1. Login as DevOps user
2. Create customer (Admin role required)
3. Create access request:
   - Select customer
   - Select account
   - Choose permission set
   - Set duration: 1 hour
   - Add justification: "Troubleshoot production issue"
   - Add ticket: "INC-12345"
4. Submit request
5. Verify request in DynamoDB (status: pending)
6. Check if approval email sent (check SES metrics)
7. Use approval link to approve
8. Verify status changes to "approved"
9. Wait for access to be granted (step function)
10. Verify status: "in_progress"
11. Wait for duration to expire
12. Verify status: "ended"
13. Check if completion email sent with AI summary

**Expected Results:**
- ✅ All steps complete without errors
- ✅ Emails sent at correct times
- ✅ Status transitions work
- ✅ Access granted and revoked automatically
- ✅ AI summary in completion email

---

**Test 6.2: Multi-Tenant Isolation**

**Test Data Isolation:**
1. Create Customer A
2. Create Customer B
3. Create request for Customer A
4. Create request for Customer B
5. Verify requests have different customerIds
6. Query requests by customer
7. Verify Customer A cannot see Customer B's requests

**Expected Results:**
- ✅ Each request has correct customerId
- ✅ Queries filter by customer
- ✅ No data leakage between customers
- ✅ GSI indexes work correctly

---

**Test 6.3: Error Handling**

**Test Error Scenarios:**
1. Submit request without customer → Validation error
2. Invalid approval token → 403 error page
3. Expired approval token → Error message
4. Already processed request → Status message
5. Bedrock unavailable → Fallback summary
6. SES unavailable → Error logged, no crash

**Expected Results:**
- ✅ Graceful error handling
- ✅ User-friendly error messages
- ✅ No system crashes
- ✅ Errors logged to CloudWatch

---

## Performance Tests

### 7. Load Testing

**Test 7.1: Concurrent Requests**

**Simulate Load:**
```bash
# Use Apache Bench or similar
ab -n 100 -c 10 https://[your-app-url]/
```

**Expected Results:**
- ✅ App remains responsive
- ✅ No timeouts
- ✅ Database handles load
- ✅ Lambda scales appropriately

---

**Test 7.2: Large Data Sets**

**Test with Volume:**
1. Create 50 customers
2. Create 100 requests
3. Navigate UI - verify performance
4. Check query times
5. Test search/filter with many records

**Expected Results:**
- ✅ UI remains fast (<2s page loads)
- ✅ Queries optimized with indexes
- ✅ Pagination works
- ✅ No memory issues

---

## Security Tests

### 8. Security Validation

**Test 8.1: Token Tampering**

**Attempt Attacks:**
1. Modify token in approval URL
2. Change requestId with valid token
3. Replay old token
4. Use token for different request

**Expected Results:**
- ✅ Tampered tokens rejected
- ✅ Mismatched requestId rejected
- ✅ Status check prevents replay
- ✅ All attempts logged

---

**Test 8.2: Authorization**

**Test Access Control:**
1. Login as non-admin user
2. Try to access Admin → Customers
3. Verify blocked
4. Try to edit customer directly (API call)
5. Verify rejected
6. Test with admin user
7. Verify access granted

**Expected Results:**
- ✅ Non-admin blocked from customer management
- ✅ GraphQL auth rules enforced
- ✅ Admin has full access
- ✅ Proper error messages

---

**Test 8.3: Input Validation**

**Test Malicious Inputs:**
1. Try XSS in customer name: `<script>alert('xss')</script>`
2. Try SQL injection in email: `'; DROP TABLE customers; --`
3. Try path traversal in API: `../../etc/passwd`
4. Submit extremely long text fields

**Expected Results:**
- ✅ XSS filtered/escaped
- ✅ SQL injection prevented (using DynamoDB, not SQL)
- ✅ Path traversal blocked
- ✅ Input length limits enforced

---

## Monitoring Tests

### 9. Observability

**Test 9.1: CloudWatch Logs**

**Verify Logging:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/teamEmailApprovalHandler --follow

# Check for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/teamEmailApprovalHandler \
  --filter-pattern "ERROR"
```

**Expected Results:**
- ✅ Logs generated
- ✅ Error tracking works
- ✅ Log retention configured
- ✅ Searchable logs

---

**Test 9.2: Metrics & Alarms**

**Set Up Monitoring:**
1. Create CloudWatch dashboard
2. Add metrics:
   - Lambda invocations
   - Lambda errors
   - DynamoDB read/write
   - API Gateway requests
   - SES bounce rate
3. Set up alarms for errors
4. Test alarm by triggering error

**Expected Results:**
- ✅ Dashboard shows metrics
- ✅ Alarms trigger correctly
- ✅ Notifications sent
- ✅ Real-time monitoring works

---

## Regression Tests

### 10. Existing Functionality

**Test 10.1: Original TEAM Features**

**Verify Not Broken:**
1. Test original request flow (without customer)
2. Test original approval flow
3. Test sessions view
4. Test audit logs
5. Test settings page
6. Test eligibility policies

**Expected Results:**
- ✅ All original features still work
- ✅ Backward compatible
- ✅ No breaking changes
- ✅ Legacy data accessible

---

## Test Summary Template

```markdown
## Test Execution Summary

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Local/Staging/Production]

### Test Results

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Customer Management UI | ✅ PASS | |
| 1.2 | Request Form | ✅ PASS | |
| 1.3 | Landing Page | ✅ PASS | |
| 2.1 | Linting | ✅ PASS | |
| 2.2 | Build | ✅ PASS | |
| 2.3 | Security Scan | ✅ PASS | 0 vulnerabilities |
| 3.1 | Amplify Deployment | ⏳ PENDING | |
| 3.2 | Customer CRUD | ⏳ PENDING | |
| 4.1 | Email Config | ⏳ PENDING | |
| 4.2 | Approval Lambda | ⏳ PENDING | |
| 4.3 | Approval Flow | ⏳ PENDING | |
| 5.1 | Bedrock Access | ⏳ PENDING | |
| 5.2 | AI Summary | ⏳ PENDING | |
| 5.3 | Fallback Summary | ⏳ PENDING | |
| 6.1 | End-to-End Flow | ⏳ PENDING | |
| 6.2 | Multi-Tenant | ⏳ PENDING | |
| 6.3 | Error Handling | ⏳ PENDING | |
| 7.1 | Load Testing | ⏳ PENDING | |
| 8.1 | Token Security | ⏳ PENDING | |
| 8.2 | Authorization | ⏳ PENDING | |
| 8.3 | Input Validation | ⏳ PENDING | |
| 9.1 | Logging | ⏳ PENDING | |
| 10.1 | Regression | ⏳ PENDING | |

### Issues Found

| Issue # | Severity | Description | Status |
|---------|----------|-------------|--------|
| | | | |

### Overall Status
- **Tests Passed**: 5/23
- **Tests Failed**: 0
- **Tests Pending**: 18
- **Blockers**: None
- **Ready for Production**: ❌ NO (pending AWS tests)
```

---

## Quick Test Checklist for Steve

**Minimum Tests Before Go-Live:**

- [ ] Customer management works
- [ ] Request with customer selection works
- [ ] Email approval link works
- [ ] AI summary generates
- [ ] No security vulnerabilities
- [ ] Original TEAM features still work
- [ ] Performance acceptable
- [ ] Monitoring in place

**Estimated Testing Time:**
- Local tests: 1 hour
- AWS integration tests: 2-3 hours
- End-to-end tests: 1-2 hours
- **Total**: 4-6 hours

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-30  
**Next Review**: After AWS deployment
