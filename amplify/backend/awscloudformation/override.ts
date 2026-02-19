import { AmplifyRootStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyRootStackTemplate) {
  // Amplify's @auth transformer does not reliably generate appsync:GraphQL IAM
  // permissions for the Cognito unauthenticated role on custom (non-@model) Query
  // fields. The three invitation endpoints are accessed by external customers who
  // click an email link and carry only Cognito Identity Pool guest credentials
  // (unauthenticated IAM). Without this explicit grant AppSync rejects the request
  // with "Not Authorized to access <field> on type Query" even though the custom
  // VTL resolver (amplify/backend/api/team/resolvers/Query.getInvitationDetails.auth.1.req.vtl)
  // correctly accepts any IAM-signed request.
  //
  // Naming conventions used below:
  //   "UnauthRole"  – logical ID of the Cognito unauthenticated IAM role in the
  //                   Amplify-generated root CloudFormation stack.
  //   "apiteam"     – logical ID of the AppSync API nested stack in the root stack,
  //                   derived from Amplify's convention: category("api") + resource("team"),
  //                   all lowercase.  Change this if the API resource is ever renamed.
  //
  // A standalone AWS::IAM::Policy resource is added so that the existing UnauthRole
  // resource is not modified (addCfnResource keeps concerns cleanly separated).
  resources.addCfnResource(
    {
      type: 'AWS::IAM::Policy',
      properties: {
        PolicyName: 'AppSyncPublicInvitationAccess',
        // Attach to the Cognito unauthenticated role.  { Ref: 'UnauthRole' } resolves
        // to the role *name* at deploy time (CloudFormation Ref on IAM::Role = name).
        Roles: [{ Ref: 'UnauthRole' }],
        PolicyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: 'appsync:GraphQL',
              Resource: [
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:appsync:',
                      { Ref: 'AWS::Region' },
                      ':',
                      { Ref: 'AWS::AccountId' },
                      ':apis/',
                      { 'Fn::GetAtt': ['apiteam', 'Outputs.GraphQLAPIIdOutput'] },
                      '/types/Query/fields/getInvitationDetails',
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:appsync:',
                      { Ref: 'AWS::Region' },
                      ':',
                      { Ref: 'AWS::AccountId' },
                      ':apis/',
                      { 'Fn::GetAtt': ['apiteam', 'Outputs.GraphQLAPIIdOutput'] },
                      '/types/Query/fields/approveInvitation',
                    ],
                  ],
                },
                {
                  'Fn::Join': [
                    '',
                    [
                      'arn:aws:appsync:',
                      { Ref: 'AWS::Region' },
                      ':',
                      { Ref: 'AWS::AccountId' },
                      ':apis/',
                      { 'Fn::GetAtt': ['apiteam', 'Outputs.GraphQLAPIIdOutput'] },
                      '/types/Query/fields/rejectInvitation',
                    ],
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    'AppSyncPublicInvitationPolicy',
  );
}
