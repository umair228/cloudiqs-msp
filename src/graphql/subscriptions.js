/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateApprovers = /* GraphQL */ `
  subscription OnCreateApprovers(
    $filter: ModelSubscriptionApproversFilterInput
  ) {
    onCreateApprovers(filter: $filter) {
      id
      name
      type
      approvers
      groupIds
      ticketNo
      modifiedBy
      customerId
      customerName
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateApprovers = /* GraphQL */ `
  subscription OnUpdateApprovers(
    $filter: ModelSubscriptionApproversFilterInput
  ) {
    onUpdateApprovers(filter: $filter) {
      id
      name
      type
      approvers
      groupIds
      ticketNo
      modifiedBy
      customerId
      customerName
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteApprovers = /* GraphQL */ `
  subscription OnDeleteApprovers(
    $filter: ModelSubscriptionApproversFilterInput
  ) {
    onDeleteApprovers(filter: $filter) {
      id
      name
      type
      approvers
      groupIds
      ticketNo
      modifiedBy
      customerId
      customerName
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateSettings = /* GraphQL */ `
  subscription OnCreateSettings($filter: ModelSubscriptionSettingsFilterInput) {
    onCreateSettings(filter: $filter) {
      id
      duration
      expiry
      comments
      ticketNo
      approval
      modifiedBy
      sesNotificationsEnabled
      snsNotificationsEnabled
      slackNotificationsEnabled
      slackAuditNotificationsChannel
      sesSourceEmail
      sesSourceArn
      slackToken
      teamAdminGroup
      teamAuditorGroup
      teamCustomerAdminGroup
      activationMode
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateSettings = /* GraphQL */ `
  subscription OnUpdateSettings($filter: ModelSubscriptionSettingsFilterInput) {
    onUpdateSettings(filter: $filter) {
      id
      duration
      expiry
      comments
      ticketNo
      approval
      modifiedBy
      sesNotificationsEnabled
      snsNotificationsEnabled
      slackNotificationsEnabled
      slackAuditNotificationsChannel
      sesSourceEmail
      sesSourceArn
      slackToken
      teamAdminGroup
      teamAuditorGroup
      teamCustomerAdminGroup
      activationMode
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteSettings = /* GraphQL */ `
  subscription OnDeleteSettings($filter: ModelSubscriptionSettingsFilterInput) {
    onDeleteSettings(filter: $filter) {
      id
      duration
      expiry
      comments
      ticketNo
      approval
      modifiedBy
      sesNotificationsEnabled
      snsNotificationsEnabled
      slackNotificationsEnabled
      slackAuditNotificationsChannel
      sesSourceEmail
      sesSourceArn
      slackToken
      teamAdminGroup
      teamAuditorGroup
      teamCustomerAdminGroup
      activationMode
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onCreateCustomers = /* GraphQL */ `
  subscription OnCreateCustomers(
    $filter: ModelSubscriptionCustomersFilterInput
  ) {
    onCreateCustomers(filter: $filter) {
      id
      name
      description
      accountIds
      approverGroupIds
      adminEmail
      adminName
      status
      settings
      createdAt
      modifiedBy
      metadata
      permissionSet
      roleStatus
      roleArn
      externalId
      cloudFormationTemplate
      invitationToken
      invitationSentAt
      invitationExpiresAt
      approvedAt
      roleEstablishedAt
      lastRoleVerification
      roleVerificationError
      updatedAt
      __typename
    }
  }
`;
export const onUpdateCustomers = /* GraphQL */ `
  subscription OnUpdateCustomers(
    $filter: ModelSubscriptionCustomersFilterInput
  ) {
    onUpdateCustomers(filter: $filter) {
      id
      name
      description
      accountIds
      approverGroupIds
      adminEmail
      adminName
      status
      settings
      createdAt
      modifiedBy
      metadata
      permissionSet
      roleStatus
      roleArn
      externalId
      cloudFormationTemplate
      invitationToken
      invitationSentAt
      invitationExpiresAt
      approvedAt
      roleEstablishedAt
      lastRoleVerification
      roleVerificationError
      updatedAt
      __typename
    }
  }
`;
export const onDeleteCustomers = /* GraphQL */ `
  subscription OnDeleteCustomers(
    $filter: ModelSubscriptionCustomersFilterInput
  ) {
    onDeleteCustomers(filter: $filter) {
      id
      name
      description
      accountIds
      approverGroupIds
      adminEmail
      adminName
      status
      settings
      createdAt
      modifiedBy
      metadata
      permissionSet
      roleStatus
      roleArn
      externalId
      cloudFormationTemplate
      invitationToken
      invitationSentAt
      invitationExpiresAt
      approvedAt
      roleEstablishedAt
      lastRoleVerification
      roleVerificationError
      updatedAt
      __typename
    }
  }
`;
export const onCreateEligibility = /* GraphQL */ `
  subscription OnCreateEligibility(
    $filter: ModelSubscriptionEligibilityFilterInput
  ) {
    onCreateEligibility(filter: $filter) {
      id
      name
      type
      accounts {
        name
        id
        customerId
        customerName
        __typename
      }
      ous {
        name
        id
        customerId
        customerName
        __typename
      }
      permissions {
        name
        id
        customerId
        customerName
        __typename
      }
      ticketNo
      approvalRequired
      duration
      modifiedBy
      customerId
      customerName
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateEligibility = /* GraphQL */ `
  subscription OnUpdateEligibility(
    $filter: ModelSubscriptionEligibilityFilterInput
  ) {
    onUpdateEligibility(filter: $filter) {
      id
      name
      type
      accounts {
        name
        id
        customerId
        customerName
        __typename
      }
      ous {
        name
        id
        customerId
        customerName
        __typename
      }
      permissions {
        name
        id
        customerId
        customerName
        __typename
      }
      ticketNo
      approvalRequired
      duration
      modifiedBy
      customerId
      customerName
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onDeleteEligibility = /* GraphQL */ `
  subscription OnDeleteEligibility(
    $filter: ModelSubscriptionEligibilityFilterInput
  ) {
    onDeleteEligibility(filter: $filter) {
      id
      name
      type
      accounts {
        name
        id
        customerId
        customerName
        __typename
      }
      ous {
        name
        id
        customerId
        customerName
        __typename
      }
      permissions {
        name
        id
        customerId
        customerName
        __typename
      }
      ticketNo
      approvalRequired
      duration
      modifiedBy
      customerId
      customerName
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const onUpdateRequests = /* GraphQL */ `
  subscription OnUpdateRequests {
    onUpdateRequests {
      id
      email
      accountId
      accountName
      role
      roleId
      startTime
      duration
      justification
      status
      comment
      username
      approver
      approverId
      approvers
      approver_ids
      revoker
      revokerId
      endTime
      ticketNo
      revokeComment
      session_duration
      customerId
      customerName
      assignmentPrincipalId
      assignmentPrincipalType
      assignmentRequestId
      activationError
      activationStartedAt
      activationCompletedAt
      revocationCompletedAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onCreateRequests = /* GraphQL */ `
  subscription OnCreateRequests {
    onCreateRequests {
      id
      email
      accountId
      accountName
      role
      roleId
      startTime
      duration
      justification
      status
      comment
      username
      approver
      approverId
      approvers
      approver_ids
      revoker
      revokerId
      endTime
      ticketNo
      revokeComment
      session_duration
      customerId
      customerName
      assignmentPrincipalId
      assignmentPrincipalType
      assignmentRequestId
      activationError
      activationStartedAt
      activationCompletedAt
      revocationCompletedAt
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onUpdateSessions = /* GraphQL */ `
  subscription OnUpdateSessions($id: String) {
    onUpdateSessions(id: $id) {
      id
      startTime
      endTime
      username
      accountId
      role
      approver_ids
      queryId
      expireAt
      customerId
      customerName
      createdAt
      updatedAt
      owner
      __typename
    }
  }
`;
export const onPublishPolicy = /* GraphQL */ `
  subscription OnPublishPolicy {
    onPublishPolicy {
      id
      policy {
        accounts {
          name
          id
          customerId
          customerName
          __typename
        }
        permissions {
          name
          id
          customerId
          customerName
          __typename
        }
        approvalRequired
        duration
        __typename
      }
      username
      __typename
    }
  }
`;
export const onPublishOUs = /* GraphQL */ `
  subscription OnPublishOUs {
    onPublishOUs {
      ous
      __typename
    }
  }
`;
export const onPublishPermissions = /* GraphQL */ `
  subscription OnPublishPermissions {
    onPublishPermissions {
      id
      permissions {
        Name
        Arn
        Duration
        __typename
      }
      __typename
    }
  }
`;
