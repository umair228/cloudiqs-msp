# Quick Start Guide - CloudiQS MSP

## Prerequisites
- AWS Account with admin access
- AWS CLI configured
- Node.js 14+ installed
- Amplify CLI installed (`npm install -g @aws-amplify/cli`)

## Initial Setup (5 Steps)

### Step 1: Configure Amplify
```bash
cd /path/to/cloudiqs-msp
amplify configure
amplify init
```

### Step 2: Deploy GraphQL API
```bash
# Compile the updated schema
amplify api gql-compile

# Deploy to AWS
amplify push --yes
```

### Step 3: Set Up Email Approval Handler

**Create Lambda Function:**
```bash
amplify add function

? Select which capability you want to add: Lambda function
? Provide a friendly name for your resource: teamEmailApprovalHandler
? Provide the AWS Lambda function name: teamEmailApprovalHandler
? Choose the runtime that you want to use: Python
? Do you want to configure advanced settings? Yes
? Do you want to access other resources in this project? Yes
? Select the categories you want access to: api
? Select the API resource: team
? Select the operations you want to permit: read, update

? Do you want to invoke this function on a recurring schedule? No
? Do you want to configure Lambda layers? No
? Do you want to configure environment variables? Yes
? Enter the environment variable name: APPROVAL_SECRET_KEY
? Enter the environment variable value: [GENERATE STRONG RANDOM KEY]
? Select what you want to do with environment variables: Add new
? Enter the environment variable name: API_TEAM_REQUESTSTABLE_NAME
? Enter the environment variable value: [Will be auto-configured]
```

**Copy the handler code:**
```bash
cp amplify/backend/function/teamEmailApprovalHandler/src/index.py \
   amplify/backend/function/teamEmailApprovalHandler-XXXX/src/index.py
```

### Step 4: Set Up AI Summary Generator

```bash
amplify add function

? Select which capability you want to add: Lambda function
? Provide a friendly name for your resource: teamAISummaryGenerator
? Provide the AWS Lambda function name: teamAISummaryGenerator
? Choose the runtime that you want to use: Python
? Do you want to configure advanced settings? Yes
? Do you want to access other resources in this project? Yes
? Select the categories you want access to: api
? Select the API resource: team
? Select the operations you want to permit: read, update

? Do you want to configure environment variables? Yes
? Enter the environment variable name: API_TEAM_SESSIONSTABLE_NAME
? Enter the environment variable value: [Will be auto-configured]
```

**Add IAM permissions for Bedrock:**
Edit `amplify/backend/function/teamAISummaryGenerator/teamAISummaryGenerator-cloudformation-template.json`

Add to the Lambda role's policies:
```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel"
  ],
  "Resource": "arn:aws:bedrock:*:*:model/anthropic.claude-3-sonnet-20240229-v1:0"
}
```

### Step 5: Deploy Functions
```bash
amplify push
```

## Email Configuration

### Configure SES
```bash
# Verify your domain or email
aws ses verify-email-identity --email-address noreply@yourdomain.com

# Request production access (if needed)
# Go to AWS Console → SES → Account Dashboard → Request Production Access
```

### Update Settings Table
Use AWS Console or CLI to add these settings:
```json
{
  "id": "settings",
  "sesSourceEmail": "noreply@yourdomain.com",
  "sesNotificationsEnabled": true,
  "sesSourceArn": "arn:aws:ses:region:account:identity/yourdomain.com"
}
```

## API Gateway Setup (For Email Approvals)

### Create REST API
```bash
# Create API
API_ID=$(aws apigateway create-rest-api \
  --name cloudiqs-msp-approvals \
  --query 'id' --output text)

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
  --rest-api-id $API_ID \
  --query 'items[0].id' --output text)

# Create resource
RESOURCE_ID=$(aws apigateway create-resource \
  --rest-api-id $API_ID \
  --parent-id $ROOT_ID \
  --path-part approval-handler \
  --query 'id' --output text)

# Create GET method
aws apigateway put-method \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --authorization-type NONE

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name teamEmailApprovalHandler \
  --query 'Configuration.FunctionArn' --output text)

# Integrate with Lambda
aws apigateway put-integration \
  --rest-api-id $API_ID \
  --resource-id $RESOURCE_ID \
  --http-method GET \
  --type AWS_PROXY \
  --integration-http-method POST \
  --uri "arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"

# Add Lambda permission
aws lambda add-permission \
  --function-name teamEmailApprovalHandler \
  --statement-id apigateway-access \
  --action lambda:InvokeFunction \
  --principal apigateway.amazonaws.com \
  --source-arn "arn:aws:execute-api:us-east-1:YOUR_ACCOUNT_ID:$API_ID/*/GET/approval-handler"

# Deploy API
aws apigateway create-deployment \
  --rest-api-id $API_ID \
  --stage-name prod

# Get the invoke URL
echo "Approval URL: https://$API_ID.execute-api.us-east-1.amazonaws.com/prod/approval-handler"
```

Save this URL - it will be used in email templates!

## AWS Bedrock Setup

### Request Model Access
1. Go to AWS Console → Bedrock
2. Navigate to "Model access"
3. Click "Edit"
4. Select "Claude 3 Sonnet"
5. Submit request (usually instant approval)
6. Wait for "Access granted" status

### Test Access
```bash
aws bedrock-runtime invoke-model \
  --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","messages":[{"role":"user","content":"Hello"}],"max_tokens":100}' \
  --cli-binary-format raw-in-base64-out \
  output.json

cat output.json
```

## Update Email Templates

Edit `amplify/backend/function/teamNotifications/src/index.py` to import and use new templates:

```python
from email_templates import get_customer_approval_email_template, get_access_completion_email_template

# In the notification function, use:
html_body = get_customer_approval_email_template(
    customer_name=customer_name,
    requester_email=requester_email,
    # ... other parameters
    approve_url=f"https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/approval-handler?requestId={request_id}&action=approve&token={token}",
    reject_url=f"https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/approval-handler?requestId={request_id}&action=reject&token={token}"
)
```

## Testing

### Test Customer Creation
1. Start the app: `npm start`
2. Navigate to Admin → Customers
3. Click "Add Customer"
4. Fill in details
5. Verify in DynamoDB

### Test Request with Customer
1. Go to Requests → Create request
2. Select a customer from dropdown
3. Complete form
4. Submit
5. Check DynamoDB for customerId field

### Test Email Approval (Manual)
1. Get a request ID from DynamoDB
2. Generate a test token
3. Visit: `https://YOUR_API_GATEWAY/approval-handler?requestId=XXX&action=approve&token=YYY`
4. Should see HTML confirmation page

### Test AI Summary
```python
import boto3
import json

lambda_client = boto3.client('lambda')

response = lambda_client.invoke(
    FunctionName='teamAISummaryGenerator',
    InvocationType='RequestResponse',
    Payload=json.dumps({
        'accountId': '123456789012',
        'username': 'testuser',
        'startTime': '2024-01-30T10:00:00Z',
        'endTime': '2024-01-30T11:00:00Z',
        'customerName': 'Test Customer',
        'accountName': 'Production',
        'role': 'AdminRole'
    })
)

print(json.loads(response['Payload'].read()))
```

## Common Issues

### Issue: "No eligible accounts found"
**Solution**: Ensure eligibility policies are set up in Admin → Eligibility policy

### Issue: Email not sending
**Solution**: 
- Verify SES email address
- Check SES sending limits (sandbox mode allows only verified addresses)
- Review CloudWatch logs for teamNotifications function

### Issue: Bedrock access denied
**Solution**:
- Verify model access is granted in Bedrock console
- Check Lambda IAM role has bedrock:InvokeModel permission
- Ensure correct region

### Issue: API Gateway 403
**Solution**:
- Verify Lambda permission for API Gateway
- Check API Gateway deployment
- Test Lambda directly first

## Next Steps

1. ✅ Deploy infrastructure (completed above)
2. Test email approval flow end-to-end
3. Configure CloudTrail Lake for audit logs
4. Set up monitoring and alarms
5. Create user documentation
6. Train team on new features
7. Gradual rollout to customers

## Environment Variables Reference

### Required
- `APPROVAL_SECRET_KEY`: Strong random string (min 32 chars)
- `API_TEAM_REQUESTSTABLE_NAME`: Auto-set by Amplify
- `API_TEAM_SESSIONSTABLE_NAME`: Auto-set by Amplify

### Optional
- `AWS_REGION`: Region for Bedrock (default: us-east-1)

## Support

- **Documentation**: See MSP_README.md
- **Issues**: GitHub repository issues
- **AWS Support**: For service-specific questions

## Useful Commands

```bash
# View Lambda logs
amplify function logs teamEmailApprovalHandler

# Update function code
amplify push function teamEmailApprovalHandler

# Test locally
amplify mock function teamAISummaryGenerator

# View API status
amplify status

# Pull latest backend
amplify pull
```

---

**Setup Time**: ~30-60 minutes  
**Difficulty**: Intermediate  
**Prerequisites**: AWS experience, CLI comfort
