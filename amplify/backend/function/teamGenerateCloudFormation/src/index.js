/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	MSP_ACCOUNT_ID
Amplify Params - DO NOT EDIT */

import yaml from 'js-yaml';

const MSP_ACCOUNT_ID = process.env.MSP_ACCOUNT_ID || '722560225075';

function generateCloudFormationTemplate(permissionSet, externalId, customerName, customerAccountId) {
  const template = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: `CloudIQS MSP Access Role for ${customerName}`,
    
    Parameters: {
      ExternalId: {
        Type: 'String',
        Default: externalId,
        Description: 'Security token for role assumption - DO NOT MODIFY'
      }
    },
    
    Resources: {
      CloudIQSMSPRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
          RoleName: 'CloudIQS-MSP-AccessRole',
          Description: `Allows CloudIQS MSP to access this account with ${permissionSet} permissions`,
          AssumeRolePolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${MSP_ACCOUNT_ID}:root`
              },
              Action: 'sts:AssumeRole',
              Condition: {
                StringEquals: {
                  'sts:ExternalId': { Ref: 'ExternalId' }
                }
              }
            }]
          },
          ManagedPolicyArns: getManagedPolicies(permissionSet),
          Tags: [
            { Key: 'ManagedBy', Value: 'CloudIQS-MSP' },
            { Key: 'Customer', Value: customerName },
            { Key: 'PermissionSet', Value: permissionSet }
          ]
        }
      }
    },
    
    Outputs: {
      RoleArn: {
        Description: 'ARN of the created role - Provide this to CloudIQS MSP',
        Value: { 'Fn::GetAtt': ['CloudIQSMSPRole', 'Arn'] },
        Export: { Name: 'CloudIQS-MSP-RoleArn' }
      },
      ExternalId: {
        Description: 'External ID used for role assumption',
        Value: { Ref: 'ExternalId' }
      },
      AccountId: {
        Description: 'AWS Account ID',
        Value: { Ref: 'AWS::AccountId' }
      }
    }
  };
  
  return yaml.dump(template, { lineWidth: -1 });
}

function getManagedPolicies(permissionSet) {
  switch (permissionSet) {
    case 'read-only':
      return ['arn:aws:iam::aws:policy/ReadOnlyAccess'];
    case 'admin':
      return ['arn:aws:iam::aws:policy/AdministratorAccess'];
    case 'custom':
      // For custom permissions, we'll start with read-only and let admins customize later
      return ['arn:aws:iam::aws:policy/ReadOnlyAccess'];
    default:
      return ['arn:aws:iam::aws:policy/ReadOnlyAccess'];
  }
}

export const handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    const { customerId, customerName, permissionSet, externalId, customerAccountId } = event;
    
    // Validate required fields
    if (!customerId || !customerName || !permissionSet || !externalId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['customerId', 'customerName', 'permissionSet', 'externalId']
        })
      };
    }
    
    // Validate permission set
    const validPermissionSets = ['read-only', 'admin', 'custom'];
    if (!validPermissionSets.includes(permissionSet)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid permission set',
          validValues: validPermissionSets
        })
      };
    }
    
    const cfnTemplate = generateCloudFormationTemplate(
      permissionSet, 
      externalId, 
      customerName,
      customerAccountId
    );
    
    console.log('Generated CloudFormation template successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        customerId,
        customerName,
        permissionSet,
        cloudFormationTemplate: cfnTemplate
      })
    };
  } catch (error) {
    console.error('Error generating CloudFormation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
