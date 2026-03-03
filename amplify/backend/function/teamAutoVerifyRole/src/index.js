import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const lambdaClient = new LambdaClient({});

const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE;
const VERIFY_FUNCTION = process.env.VERIFY_ROLE_FUNCTION;

export const handler = async (event) => {
  console.log('Auto-verify: checking for approved customers pending verification');

  const response = await docClient.send(new ScanCommand({
    TableName: CUSTOMERS_TABLE,
    FilterExpression: 'roleStatus = :approved',
    ExpressionAttributeValues: {
      ':approved': 'approved'
    }
  }));

  const customers = response.Items || [];
  console.log(`Found ${customers.length} customers pending verification`);

  for (const customer of customers) {
    const approvedAt = new Date(customer.approvedAt);
    const now = new Date();
    const minutesSinceApproval = (now - approvedAt) / (1000 * 60);

    if (minutesSinceApproval > 30) {
      console.log(`Customer ${customer.id} approval expired (${minutesSinceApproval.toFixed(1)} min ago)`);
      continue;
    }

    for (const accountId of (customer.accountIds || [])) {
      const roleArn = `arn:aws:iam::${accountId}:role/CloudIQS-MSP-ReadOnlyRole`;

      try {
        const result = await lambdaClient.send(new InvokeCommand({
          FunctionName: VERIFY_FUNCTION,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            customerId: customer.id,
            roleArn: roleArn,
            externalId: customer.externalId
          })
        }));

        const payload = JSON.parse(Buffer.from(result.Payload).toString());
        if (payload.statusCode === 200) {
          const body = JSON.parse(payload.body);
          if (body.success) {
            console.log(`Customer ${customer.id} role verified successfully!`);
            break;
          }
        }
      } catch (error) {
        console.log(`Verification attempt failed for customer ${customer.id}: ${error.message}`);
      }
    }
  }

  return { verified: customers.length };
};
