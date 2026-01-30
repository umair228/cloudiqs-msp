# CloudiQS MSP Access Management

## Overview
CloudiQS MSP Access Management is an extension of the AWS TEAM solution, designed specifically for Managed Service Providers (MSPs) to manage temporary, time-bound AWS account access across multiple customer environments.

## Key Features

### 🏢 Multi-Tenant Customer Management
- **Customer Registration**: Register and manage multiple customer AWS accounts
- **Customer Profiles**: Track customer information, contact details, and approval preferences
- **Account Association**: Link multiple AWS accounts to each customer
- **Tenant Isolation**: Complete data separation between customers

### 🔐 Secure Access Request Workflow
DevOps engineers can request access with:
- **Customer Selection**: Choose target customer account
- **Permission Sets**: Specify exact AWS permissions needed
- **Time Constraints**: Maximum 1-hour access duration
- **Justification**: Required detailed access reason
- **Ticket Reference**: Link to incident/ticket systems

### ✉️ Email-Based Customer Approval
- **Automated Notifications**: Customers receive email when access is requested
- **One-Click Approval**: Approve or reject via secure email links
- **Token Security**: HMAC-signed tokens prevent unauthorized approvals
- **Expiration**: Requests auto-expire after 1 hour if not approved
- **Confirmation**: Beautiful HTML response pages for approval/rejection

### 🤖 AI-Powered Access Summaries
- **AWS Bedrock Integration**: Uses Claude 3 Sonnet for intelligent analysis
- **Activity Analysis**: Summarizes CloudTrail logs in customer-friendly language
- **Business Impact Focus**: Explains what was done in non-technical terms
- **Completion Emails**: Customers receive AI-generated summaries after access ends
- **Fallback Mode**: Generates basic summaries when AI is unavailable

### 📊 Comprehensive Audit & Compliance
- **Per-Customer Logging**: Segregated audit trails for each customer
- **CloudTrail Integration**: Full AWS CloudTrail Lake support
- **Exportable Reports**: Generate audit reports per customer
- **Session Tracking**: Complete history of all access sessions
- **AI Summaries Storage**: Persistent storage of AI-generated activity summaries

### 🎨 Marketplace UI Design
- **Modern Interface**: Updated UI with marketplace-style design
- **Customer Dashboard**: Dedicated view for customer management
- **Multi-Customer Navigation**: Easy switching between customer contexts
- **Responsive Design**: Works on desktop, tablet, and mobile

## Architecture

### Data Model Extensions

#### Customer Entity
```graphql
type Customer {
  id: ID!
  name: String!
  email: String!
  awsAccountIds: [String]
  status: String
  approverEmail: String!
  companyName: String
  contactPerson: String
  notificationPreferences: AWSJSON
}
```

#### Enhanced Requests
- `customerId`: Links request to customer
- `customerName`: Customer display name
- `approvalToken`: Secure token for email approval
- `customerApprovalEmail`: Email used for approval

#### Enhanced Sessions
- `customerId`: Customer association
- `aiSummary`: AI-generated activity summary

### Lambda Functions

#### teamEmailApprovalHandler
- **Purpose**: Handles customer approval/rejection via email links
- **Input**: Request ID, action (approve/reject), security token
- **Output**: HTML confirmation page
- **Security**: HMAC-SHA256 token verification

#### teamAISummaryGenerator
- **Purpose**: Generates AI-powered summaries of access sessions
- **Input**: Session details, CloudTrail events
- **Output**: Natural language summary
- **Integration**: AWS Bedrock (Claude 3 Sonnet)
- **Fallback**: Simple statistical summary when AI unavailable

### Email Templates
Two new professional email templates:
1. **Approval Request**: Sent to customers when access is requested
2. **Completion Summary**: Sent after access ends with AI summary

## Setup Instructions

### Prerequisites
1. AWS Account with IAM Identity Center configured
2. AWS Bedrock access in your region
3. SES configured for sending emails
4. CloudTrail Lake enabled

### Deployment Steps

1. **Update GraphQL Schema**
   ```bash
   # The schema has been updated with Customer type and multi-tenant fields
   amplify api gql-compile
   ```

2. **Deploy Lambda Functions**
   ```bash
   # Deploy email approval handler
   amplify function add teamEmailApprovalHandler
   
   # Deploy AI summary generator
   amplify function add teamAISummaryGenerator
   ```

3. **Configure Environment Variables**
   ```bash
   # Set approval secret key
   APPROVAL_SECRET_KEY=<your-secure-random-key>
   
   # Set Bedrock region
   AWS_REGION=us-east-1
   ```

4. **Deploy Infrastructure**
   ```bash
   amplify push
   ```

5. **Configure API Gateway**
   - Create HTTP endpoint for `/approval-handler`
   - Link to `teamEmailApprovalHandler` Lambda
   - Enable CORS

### Configuration

#### Email Settings
Configure in Settings table:
- `sesSourceEmail`: Email address for notifications
- `sesSourceArn`: SES identity ARN (if cross-account)
- `sesNotificationsEnabled`: Enable/disable email notifications

#### Customer Setup
1. Navigate to Customer Management in the UI
2. Click "Add Customer"
3. Fill in customer details:
   - Customer Name
   - Company Name
   - Contact Person
   - Email
   - Approver Email (receives approval requests)
   - AWS Account IDs (comma-separated)

## Usage Guide

### For DevOps Engineers

1. **Request Access**
   - Go to Requests → New Request
   - Select customer from dropdown
   - Choose AWS account and permission set
   - Specify duration (max 1 hour)
   - Provide detailed justification
   - Add ticket reference
   - Submit request

2. **Wait for Approval**
   - Customer receives email notification
   - Request expires in 1 hour if not approved

3. **Access Granted**
   - Receive notification when approved
   - Access AWS account via IAM Identity Center
   - All actions are logged

4. **Automatic Revocation**
   - Access automatically expires after duration
   - Customer receives completion email with AI summary

### For Customers

1. **Receive Approval Request**
   - Email contains all request details
   - AI summary (if previous access exists)
   - One-click approve/reject buttons

2. **Review Request**
   - Check requester identity
   - Verify justification
   - Review requested permissions

3. **Take Action**
   - Click "Approve Request" or "Reject Request"
   - Receive confirmation page
   - Requester is notified automatically

4. **Receive Completion Summary**
   - After access ends, receive email
   - AI-generated activity summary
   - Action count and service usage
   - Audit trail information

## Security Features

### Token-Based Approval
- HMAC-SHA256 signed tokens
- Request ID verification
- Time-based validation
- Single-use tokens (status check)

### Tenant Isolation
- Customer ID filtering in all queries
- Row-level security in DynamoDB
- Separate audit logs per customer
- Authorization checks in Lambda functions

### Audit Logging
- All access sessions logged
- CloudTrail integration
- Per-customer log segregation
- Exportable audit reports
- AI summaries stored with sessions

## AI Integration Details

### AWS Bedrock Configuration
- **Model**: Claude 3 Sonnet (anthropic.claude-3-sonnet-20240229-v1:0)
- **Max Tokens**: 500
- **Temperature**: 0.5 (balanced creativity/accuracy)

### Summary Generation
1. Fetch CloudTrail events for session
2. Extract key actions and services
3. Generate customer-friendly prompt
4. Call Bedrock API
5. Store summary in sessions table
6. Include in completion email

### Fallback Behavior
If Bedrock unavailable:
- Generate statistical summary
- Show action counts
- List services accessed
- Identify error rates

## Compliance & Audit

### Audit Trail Components
1. **Request History**: All access requests with timestamps
2. **Approval Records**: Who approved, when, and why
3. **CloudTrail Events**: Complete AWS API activity
4. **AI Summaries**: Persistent natural language descriptions
5. **Customer Context**: All data tagged with customer ID

### Exportable Reports
- Per-customer access history
- Session activity logs
- Approval/rejection statistics
- AI summary archive

## API Reference

### GraphQL Queries

#### List Customers
```graphql
query ListCustomers {
  listCustomers {
    items {
      id
      name
      email
      companyName
      approverEmail
      awsAccountIds
      status
    }
  }
}
```

#### Get Customer Requests
```graphql
query GetCustomerRequests($customerId: String!, $status: String!) {
  requestByCustomerAndStatus(customerId: $customerId, status: $status) {
    items {
      id
      email
      accountName
      role
      status
      startTime
      duration
    }
  }
}
```

### REST API

#### Email Approval Handler
```
GET /approval-handler
  ?requestId=<id>
  &action=<approve|reject>
  &token=<hmac-token>

Response: 200 OK (HTML page)
```

## Troubleshooting

### Common Issues

#### Emails Not Sending
- Verify SES email addresses are verified
- Check SES sending limits
- Review CloudWatch logs for errors
- Ensure IAM permissions for SES

#### AI Summaries Not Generating
- Verify Bedrock access in region
- Check model availability
- Review IAM permissions for Bedrock
- Fallback summary will be used automatically

#### Approval Links Not Working
- Check APPROVAL_SECRET_KEY environment variable
- Verify API Gateway endpoint is accessible
- Ensure Lambda has DynamoDB permissions
- Check request status (must be 'pending')

## Roadmap

### Phase 1 (Current)
- ✅ Multi-tenant data model
- ✅ Customer management UI
- ✅ Email-based approvals
- ✅ AI summaries with Bedrock
- ✅ Enhanced audit logging

### Phase 2 (Future)
- [ ] Customer portal (optional)
- [ ] Slack integration for approvals
- [ ] Advanced AI insights and recommendations
- [ ] Risk scoring for access requests
- [ ] Automated compliance reports
- [ ] Multi-region support
- [ ] Custom approval workflows per customer

## Support

For issues, questions, or feature requests:
- GitHub Issues: [Repository Issues](https://github.com/umair228/cloudiqs-msp/issues)
- Email: support@cloudiqs.com

## License

This project extends the AWS TEAM solution and is licensed under MIT-0. See LICENSE file.

## Credits

- Based on AWS TEAM by AWS Samples
- Extended by CloudiQS for MSP use cases
- AI integration powered by AWS Bedrock
- UI components from AWS UI Components React

## Changelog

### v1.0.0 - Multi-Tenant MSP Release
- Added Customer entity and management
- Implemented email-based customer approvals
- Integrated AI-powered access summaries
- Enhanced audit logging with customer isolation
- Updated UI with marketplace design
- Added comprehensive documentation
