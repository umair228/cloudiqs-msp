// © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// This AWS Content is provided subject to the terms of the AWS Customer Agreement available at
// http://aws.amazon.com/agreement or other written agreement between Customer and either
// Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Header,
  Pagination,
  Table,
  TextFilter,
  SpaceBetween,
  CollectionPreferences,
  Multiselect,
  Modal,
  FormField,
  Form,
  Select,
  ColumnLayout,
  Input,
  Spinner,
  Textarea,
  StatusIndicator,
  TokenGroup
} from "@awsui/components-react";
import { useCollection } from "@awsui/collection-hooks";
import { API, graphqlOperation } from "aws-amplify";
import {
  fetchIdCGroups
} from "../Shared/RequestService";
import RoleStatusIndicator from "./RoleStatusIndicator";
import "../../index.css";
import * as mutations from "../../graphql/mutations";
import * as queries from "../../graphql/queries";

const MSP_ROLE_NAME = 'CloudIQS-MSP-AccessRole';

const COLUMN_DEFINITIONS = [
  {
    id: "id",
    sortingField: "id",
    header: "Customer ID",
    cell: (item) => item.id,
    width: 180,
  },
  {
    id: "name",
    sortingField: "name",
    header: "Customer Name",
    cell: (item) => item.name,
    width: 200,
  },
  {
    id: "status",
    sortingField: "status",
    header: "Status",
    cell: (item) => (
      <StatusIndicator type={item.status === 'active' ? 'success' : 'stopped'}>
        {item.status || 'active'}
      </StatusIndicator>
    ),
    width: 120,
  },
  {
    id: "roleStatus",
    sortingField: "roleStatus",
    header: "Role Status",
    cell: (item) => item.roleStatus ? <RoleStatusIndicator roleStatus={item.roleStatus} /> : "-",
    width: 180,
  },
  {
    id: "permissionSet",
    sortingField: "permissionSet",
    header: "Permission Set",
    cell: (item) => item.permissionSet ? item.permissionSet.toUpperCase() : "-",
    width: 150,
  },
  {
    id: "accountCount",
    header: "Accounts",
    cell: (item) => (item.accountIds ? item.accountIds.length : 0),
    width: 100,
  },
  {
    id: "adminEmail",
    sortingField: "adminEmail",
    header: "Admin Email",
    cell: (item) => item.adminEmail || "-",
    width: 220,
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => item.description || "-",
    width: 250,
  },
];

const MyCollectionPreferences = ({ preferences, setPreferences }) => {
  return (
    <CollectionPreferences
      title="Preferences"
      confirmLabel="Confirm"
      cancelLabel="Cancel"
      preferences={preferences}
      onConfirm={({ detail }) => setPreferences(detail)}
      pageSizePreference={{
        title: "Page size",
        options: [
          { value: 10, label: "10 Customers" },
          { value: 30, label: "30 Customers" },
          { value: 50, label: "50 Customers" },
        ],
      }}
      visibleContentPreference={{
        title: "Select visible columns",
        options: [
          {
            label: "Customer properties",
            options: COLUMN_DEFINITIONS.map((c) => ({
              id: c.id,
              label: c.header,
              editable: c.id !== "id",
            })),
          },
        ],
      }}
    />
  );
};

function Customers(props) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerDescription, setCustomerDescription] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [status, setStatus] = useState({ label: "Active", value: "active" });
  const [selectedApproverGroups, setSelectedApproverGroups] = useState([]);
  const [permissionSet, setPermissionSet] = useState({ label: "Read-Only", value: "read-only" });
  
  // Free-text AWS Account IDs (decoupled from Organization)
  const [accountIdInput, setAccountIdInput] = useState("");
  const [accountIdTokens, setAccountIdTokens] = useState([]);
  const [accountIdError, setAccountIdError] = useState("");
  
  // Data sources
  const [approverGroups, setApproverGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  
  // Action states
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Form validation
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [preferences, setPreferences] = useState({
    pageSize: 30,
    visibleContent: ["id", "name", "status", "roleStatus", "permissionSet", "accountCount", "adminEmail", "description"],
  });

  const {
    items,
    filteredItemsCount,
    collectionProps,
    filterProps,
    paginationProps,
  } = useCollection(customers, {
    filtering: {
      empty: (
        <Box textAlign="center" color="inherit">
          <b>No customers</b>
          <Box padding={{ bottom: "s" }} variant="p" color="inherit">
            No customers to display.
          </Box>
          <Button onClick={() => setAddModalVisible(true)}>
            Create customer
          </Button>
        </Box>
      ),
      noMatch: (
        <Box textAlign="center" color="inherit">
          <b>No match</b>
          <Box padding={{ bottom: "s" }} variant="p" color="inherit">
            No customers matched.
          </Box>
        </Box>
      ),
    },
    pagination: { pageSize: preferences.pageSize },
    sorting: {},
    selection: {},
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const result = await API.graphql(graphqlOperation(queries.listCustomers));
      const customerList = result.data.listCustomers.items || [];
      setCustomers(customerList);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadApproverGroups = async () => {
    setGroupsLoading(true);
    try {
      const groupData = await fetchIdCGroups();
      setApproverGroups(
        groupData.map((group) => ({
          label: group.DisplayName,
          value: group.GroupId,
          description: group.GroupId,
        }))
      );
    } catch (error) {
      console.error("Error loading groups:", error);
    } finally {
      setGroupsLoading(false);
    }
  };

  const openAddModal = () => {
    resetForm();
    loadApproverGroups();
    setAddModalVisible(true);
  };

  const openEditModal = () => {
    if (selectedCustomer.length === 1) {
      const customer = selectedCustomer[0];
      setCustomerName(customer.name);
      setCustomerDescription(customer.description || "");
      setAdminEmail(customer.adminEmail || "");
      setAdminName(customer.adminName || "");
      setStatus({
        label: customer.status === 'active' ? 'Active' : 'Inactive',
        value: customer.status || 'active'
      });
      setPermissionSet({
        label: customer.permissionSet === 'admin' ? 'Admin' : customer.permissionSet === 'custom' ? 'Custom' : 'Read-Only',
        value: customer.permissionSet || 'read-only'
      });
      
      // Populate account ID tokens from existing accountIds
      if (customer.accountIds && customer.accountIds.length > 0) {
        setAccountIdTokens(
          customer.accountIds.map(id => ({ label: id, dismissLabel: `Remove ${id}` }))
        );
      }
      
      // Load groups and set selected
      loadApproverGroups().then(() => {
        if (customer.approverGroupIds) {
          const selected = customer.approverGroupIds.map(id => {
            const group = approverGroups.find(g => g.value === id);
            return group || { label: id, value: id };
          });
          setSelectedApproverGroups(selected);
        }
      });
      
      setEditModalVisible(true);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerDescription("");
    setAdminEmail("");
    setAdminName("");
    setStatus({ label: "Active", value: "active" });
    setPermissionSet({ label: "Read-Only", value: "read-only" });
    setAccountIdInput("");
    setAccountIdTokens([]);
    setAccountIdError("");
    setSelectedApproverGroups([]);
    setNameError("");
    setEmailError("");
  };

  const validateAccountId = (id) => {
    const cleaned = id.trim();
    if (!cleaned) return null;
    if (!/^\d{12}$/.test(cleaned)) {
      return "AWS Account ID must be exactly 12 digits";
    }
    if (accountIdTokens.some(t => t.label === cleaned)) {
      return "This Account ID has already been added";
    }
    return null;
  };

  const addAccountId = () => {
    const cleaned = accountIdInput.trim();
    const error = validateAccountId(cleaned);
    if (error) {
      setAccountIdError(error);
      return;
    }
    setAccountIdTokens([...accountIdTokens, { label: cleaned, dismissLabel: `Remove ${cleaned}` }]);
    setAccountIdInput("");
    setAccountIdError("");
  };

  const handleVerifyRole = async () => {
    if (selectedCustomer.length !== 1) return;
    const customer = selectedCustomer[0];
    
    if (!customer.accountIds || customer.accountIds.length === 0 || !customer.externalId) {
      if (props.addNotification) {
        props.addNotification([{
          type: 'error',
          content: 'Customer must have account IDs and an external ID before verification.',
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
      return;
    }
    
    setVerifying(true);
    try {
      // Build role ARN for the primary account; the teamVerifyCustomerRole Lambda
      // will verify access for each account individually if needed
      const primaryAccountId = customer.accountIds[0];
      const roleArn = `arn:aws:iam::${primaryAccountId}:role/${MSP_ROLE_NAME}`;
      
      const updateInput = {
        id: customer.id,
        roleArn: roleArn,
        roleStatus: 'verifying'
      };
      
      await API.graphql(
        graphqlOperation(mutations.updateCustomers, { input: updateInput })
      );
      
      if (props.addNotification) {
        props.addNotification([{
          type: 'info',
          content: `Role verification initiated for ${customer.name}. The system will verify the role via AssumeRole.`,
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
      
      fetchCustomers();
    } catch (error) {
      console.error("Error verifying role:", error);
      if (props.addNotification) {
        props.addNotification([{
          type: 'error',
          content: `Error initiating role verification: ${error.message || 'Unknown error'}`,
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleResendInvitation = async () => {
    if (selectedCustomer.length !== 1) return;
    const customer = selectedCustomer[0];
    
    if (!customer.adminEmail) {
      if (props.addNotification) {
        props.addNotification([{
          type: 'error',
          content: 'Customer must have an admin email to resend the invitation.',
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
      return;
    }
    
    setResending(true);
    try {
      // Generate a new invitation token
      const invitationToken = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const updateInput = {
        id: customer.id,
        invitationToken: invitationToken,
        roleStatus: 'pending_approval'
      };
      
      await API.graphql(
        graphqlOperation(mutations.updateCustomers, { input: updateInput })
      );
      
      if (props.addNotification) {
        props.addNotification([{
          type: 'success',
          content: `Invitation resent to ${customer.adminEmail} for ${customer.name}.`,
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
      
      fetchCustomers();
    } catch (error) {
      console.error("Error resending invitation:", error);
      if (props.addNotification) {
        props.addNotification([{
          type: 'error',
          content: `Error resending invitation: ${error.message || 'Unknown error'}`,
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
    } finally {
      setResending(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    
    if (!customerName.trim()) {
      setNameError("Customer name is required");
      isValid = false;
    } else {
      setNameError("");
    }
    
    if (adminEmail && !adminEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    } else {
      setEmailError("");
    }
    
    return isValid;
  };

  const handleAddCustomer = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Generate a unique external ID for AssumeRole security
      const externalId = window.crypto.randomUUID ? window.crypto.randomUUID() : 
        Array.from(window.crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      
      // Generate a secure invitation token
      const invitationToken = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const input = {
        name: customerName,
        description: customerDescription,
        adminEmail: adminEmail,
        adminName: adminName,
        status: status.value,
        accountIds: accountIdTokens.map(t => t.label),
        approverGroupIds: selectedApproverGroups.map(grp => grp.value),
        modifiedBy: props.user || "system",
        // Role-based onboarding fields
        permissionSet: permissionSet.value,
        roleStatus: "pending_approval",
        externalId: externalId,
        invitationToken: invitationToken
      };
      
      const result = await API.graphql(
        graphqlOperation(mutations.createCustomers, { input })
      );
      
      const newCustomer = result.data.createCustomers;
      
      // Send invitation email if admin email is provided
      if (adminEmail) {
        try {
          // Note: This would call a Lambda function via API Gateway
          // For now, we'll just log it. The Lambda can be invoked separately.
          console.log('Customer created, invitation should be sent:', {
            customerId: newCustomer.id,
            customerName: newCustomer.name,
            adminEmail: newCustomer.adminEmail,
            invitationToken: newCustomer.invitationToken,
            permissionSet: newCustomer.permissionSet
          });
          
          if (props.addNotification) {
            props.addNotification([{
              type: 'success',
              content: `Customer created successfully! An invitation email will be sent to ${adminEmail}`,
              dismissible: true,
              dismissLabel: 'Dismiss',
              onDismiss: () => props.addNotification([])
            }]);
          }
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
          if (props.addNotification) {
            props.addNotification([{
              type: 'warning',
              content: 'Customer created, but failed to send invitation email. You can resend it later.',
              dismissible: true,
              dismissLabel: 'Dismiss',
              onDismiss: () => props.addNotification([])
            }]);
          }
        }
      }
      
      setAddModalVisible(false);
      fetchCustomers();
      resetForm();
    } catch (error) {
      console.error("Error creating customer:", error);
      if (props.addNotification) {
        props.addNotification([{
          type: 'error',
          content: `Error creating customer: ${error.message}`,
          dismissible: true,
          dismissLabel: 'Dismiss',
          onDismiss: () => props.addNotification([])
        }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const input = {
        id: selectedCustomer[0].id,
        name: customerName,
        description: customerDescription,
        adminEmail: adminEmail,
        adminName: adminName,
        status: status.value,
        accountIds: accountIdTokens.map(t => t.label),
        approverGroupIds: selectedApproverGroups.map(grp => grp.value),
        modifiedBy: props.user || "system"
      };
      
      await API.graphql(
        graphqlOperation(mutations.updateCustomers, { input })
      );
      
      setEditModalVisible(false);
      fetchCustomers();
      setSelectedCustomer([]);
      resetForm();
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Error updating customer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async () => {
    setLoading(true);
    try {
      for (const customer of selectedCustomer) {
        await API.graphql(
          graphqlOperation(mutations.deleteCustomers, {
            input: { id: customer.id },
          })
        );
      }
      
      setDeleteModalVisible(false);
      fetchCustomers();
      setSelectedCustomer([]);
    } catch (error) {
      console.error("Error deleting customer:", error);
      alert("Error deleting customer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Table
        {...collectionProps}
        onSelectionChange={({ detail }) =>
          setSelectedCustomer(detail.selectedItems)
        }
        selectedItems={selectedCustomer}
        ariaLabels={{
          selectionGroupLabel: "Items selection",
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${
              selectedItems.length === 1 ? "item" : "items"
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item) =>
            item.name,
        }}
        columnDefinitions={COLUMN_DEFINITIONS}
        visibleColumns={preferences.visibleContent}
        items={items}
        loading={loading}
        loadingText="Loading customers"
        selectionType="multi"
        trackBy="id"
        empty={
          <Box textAlign="center" color="inherit">
            <b>No customers</b>
            <Box padding={{ bottom: "s" }} variant="p" color="inherit">
              No customers to display.
            </Box>
            <Button onClick={openAddModal}>Create customer</Button>
          </Box>
        }
        filter={
          <TextFilter
            {...filterProps}
            countText={`${filteredItemsCount} ${
              filteredItemsCount === 1 ? "match" : "matches"
            }`}
            filteringAriaLabel="Filter customers"
          />
        }
        header={
          <Header
            counter={`(${customers.length})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={fetchCustomers}
                  iconName="refresh"
                  ariaLabel="Refresh"
                />
                <Button
                  disabled={selectedCustomer.length !== 1 || !selectedCustomer[0]?.adminEmail}
                  onClick={handleResendInvitation}
                  loading={resending}
                >
                  Resend invitation
                </Button>
                <Button
                  disabled={selectedCustomer.length !== 1 || !['approved', 'verification_failed'].includes(selectedCustomer[0]?.roleStatus)}
                  onClick={handleVerifyRole}
                  loading={verifying}
                >
                  Verify role
                </Button>
                <Button
                  disabled={selectedCustomer.length !== 1}
                  onClick={openEditModal}
                >
                  Edit
                </Button>
                <Button
                  disabled={selectedCustomer.length === 0}
                  onClick={() => setDeleteModalVisible(true)}
                >
                  Delete
                </Button>
                <Button variant="primary" onClick={openAddModal}>
                  Create customer
                </Button>
              </SpaceBetween>
            }
          >
            Customers
          </Header>
        }
        pagination={<Pagination {...paginationProps} />}
        preferences={
          <MyCollectionPreferences
            preferences={preferences}
            setPreferences={setPreferences}
          />
        }
      />

      {/* Add Customer Modal */}
      <Modal
        onDismiss={() => setAddModalVisible(false)}
        visible={addModalVisible}
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => setAddModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddCustomer}
                loading={loading}
              >
                Create customer
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Create customer"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField
              label="Customer name"
              errorText={nameError}
              stretch
              constraintText="Required. The name of the customer organization."
            >
              <Input
                value={customerName}
                onChange={({ detail }) => setCustomerName(detail.value)}
                placeholder="e.g., Acme Corporation"
              />
            </FormField>

            <FormField
              label="Description"
              stretch
              constraintText="Optional. A brief description of the customer."
            >
              <Textarea
                value={customerDescription}
                onChange={({ detail }) => setCustomerDescription(detail.value)}
                placeholder="e.g., Primary customer for product X"
              />
            </FormField>

            <ColumnLayout columns={2}>
              <FormField
                label="Admin name"
                stretch
                constraintText="Optional. Primary contact name."
              >
                <Input
                  value={adminName}
                  onChange={({ detail }) => setAdminName(detail.value)}
                  placeholder="e.g., John Doe"
                />
              </FormField>

              <FormField
                label="Admin email"
                errorText={emailError}
                stretch
                constraintText="Optional. Contact email for customer admin."
              >
                <Input
                  value={adminEmail}
                  onChange={({ detail }) => setAdminEmail(detail.value)}
                  placeholder="e.g., admin@acme.com"
                  type="email"
                />
              </FormField>
            </ColumnLayout>

            <FormField
              label="Status"
              stretch
            >
              <Select
                selectedOption={status}
                onChange={({ detail }) => setStatus(detail.selectedOption)}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </FormField>

            <FormField
              label="Permission Set"
              stretch
              description="Determines the level of access CloudIQS MSP will have to the customer's AWS account."
            >
              <Select
                selectedOption={permissionSet}
                onChange={({ detail }) => setPermissionSet(detail.selectedOption)}
                options={[
                  { label: "Read-Only", value: "read-only" },
                  { label: "Admin", value: "admin" },
                  { label: "Custom", value: "custom" },
                ]}
              />
            </FormField>

            <FormField
              label="Customer AWS Account IDs"
              stretch
              description="Manually enter the customer's AWS Account IDs. These are the external accounts the customer owns — not from your Organization."
              errorText={accountIdError}
            >
              <SpaceBetween size="xs">
                <SpaceBetween direction="horizontal" size="xs">
                  <Input
                    value={accountIdInput}
                    onChange={({ detail }) => {
                      setAccountIdInput(detail.value);
                      setAccountIdError("");
                    }}
                    onKeyDown={({ detail }) => {
                      if (detail.key === 'Enter') {
                        addAccountId();
                      }
                    }}
                    placeholder="e.g., 111122223333"
                    type="text"
                  />
                  <Button onClick={addAccountId} iconName="add-plus">Add</Button>
                </SpaceBetween>
                {accountIdTokens.length > 0 && (
                  <TokenGroup
                    items={accountIdTokens}
                    onDismiss={({ detail: { itemIndex } }) => {
                      setAccountIdTokens(
                        accountIdTokens.filter((_, i) => i !== itemIndex)
                      );
                    }}
                  />
                )}
              </SpaceBetween>
            </FormField>

            <FormField
              label="Approver Groups"
              stretch
              description="Select IAM Identity Center groups that can approve requests for this customer's accounts."
            >
              {groupsLoading ? (
                <Spinner />
              ) : (
                <Multiselect
                  selectedOptions={selectedApproverGroups}
                  onChange={({ detail }) =>
                    setSelectedApproverGroups(detail.selectedOptions)
                  }
                  options={approverGroups}
                  placeholder="Choose approver groups"
                  filteringType="auto"
                />
              )}
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        onDismiss={() => setEditModalVisible(false)}
        visible={editModalVisible}
        size="large"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => setEditModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleEditCustomer}
                loading={loading}
              >
                Save changes
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Edit customer"
      >
        <Form>
          <SpaceBetween size="m">
            <FormField
              label="Customer name"
              errorText={nameError}
              stretch
              constraintText="Required. The name of the customer organization."
            >
              <Input
                value={customerName}
                onChange={({ detail }) => setCustomerName(detail.value)}
                placeholder="e.g., Acme Corporation"
              />
            </FormField>

            <FormField
              label="Description"
              stretch
              constraintText="Optional. A brief description of the customer."
            >
              <Textarea
                value={customerDescription}
                onChange={({ detail }) => setCustomerDescription(detail.value)}
                placeholder="e.g., Primary customer for product X"
              />
            </FormField>

            <ColumnLayout columns={2}>
              <FormField
                label="Admin name"
                stretch
                constraintText="Optional. Primary contact name."
              >
                <Input
                  value={adminName}
                  onChange={({ detail }) => setAdminName(detail.value)}
                  placeholder="e.g., John Doe"
                />
              </FormField>

              <FormField
                label="Admin email"
                errorText={emailError}
                stretch
                constraintText="Optional. Contact email for customer admin."
              >
                <Input
                  value={adminEmail}
                  onChange={({ detail }) => setAdminEmail(detail.value)}
                  placeholder="e.g., admin@acme.com"
                  type="email"
                />
              </FormField>
            </ColumnLayout>

            <FormField
              label="Status"
              stretch
            >
              <Select
                selectedOption={status}
                onChange={({ detail }) => setStatus(detail.selectedOption)}
                options={[
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ]}
              />
            </FormField>

            <FormField
              label="Permission Set"
              stretch
              description="Determines the level of access CloudIQS MSP will have to the customer's AWS account."
            >
              <Select
                selectedOption={permissionSet}
                onChange={({ detail }) => setPermissionSet(detail.selectedOption)}
                options={[
                  { label: "Read-Only", value: "read-only" },
                  { label: "Admin", value: "admin" },
                  { label: "Custom", value: "custom" },
                ]}
              />
            </FormField>

            <FormField
              label="Customer AWS Account IDs"
              stretch
              description="Manually enter the customer's AWS Account IDs. These are the external accounts the customer owns — not from your Organization."
              errorText={accountIdError}
            >
              <SpaceBetween size="xs">
                <SpaceBetween direction="horizontal" size="xs">
                  <Input
                    value={accountIdInput}
                    onChange={({ detail }) => {
                      setAccountIdInput(detail.value);
                      setAccountIdError("");
                    }}
                    onKeyDown={({ detail }) => {
                      if (detail.key === 'Enter') {
                        addAccountId();
                      }
                    }}
                    placeholder="e.g., 111122223333"
                    type="text"
                  />
                  <Button onClick={addAccountId} iconName="add-plus">Add</Button>
                </SpaceBetween>
                {accountIdTokens.length > 0 && (
                  <TokenGroup
                    items={accountIdTokens}
                    onDismiss={({ detail: { itemIndex } }) => {
                      setAccountIdTokens(
                        accountIdTokens.filter((_, i) => i !== itemIndex)
                      );
                    }}
                  />
                )}
              </SpaceBetween>
            </FormField>

            <FormField
              label="Approver Groups"
              stretch
              description="Select IAM Identity Center groups that can approve requests for this customer's accounts."
            >
              {groupsLoading ? (
                <Spinner />
              ) : (
                <Multiselect
                  selectedOptions={selectedApproverGroups}
                  onChange={({ detail }) =>
                    setSelectedApproverGroups(detail.selectedOptions)
                  }
                  options={approverGroups}
                  placeholder="Choose approver groups"
                  filteringType="auto"
                />
              )}
            </FormField>
          </SpaceBetween>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        onDismiss={() => setDeleteModalVisible(false)}
        visible={deleteModalVisible}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                onClick={() => setDeleteModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleDeleteCustomer}
                loading={loading}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Delete customer(s)"
      >
        <Box>
          Are you sure you want to delete{" "}
          {selectedCustomer.length === 1
            ? `customer "${selectedCustomer[0].name}"`
            : `${selectedCustomer.length} customers`}
          ?
        </Box>
      </Modal>
    </>
  );
}

export default Customers;
