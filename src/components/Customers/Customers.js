// © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// CloudiQS MSP Customer Management Component
import React, { useEffect, useState } from "react";
import { API } from "aws-amplify";
import {
  Box,
  Button,
  Cards,
  Container,
  Header,
  Modal,
  SpaceBetween,
  StatusIndicator,
  TextFilter,
  FormField,
  Input,
  Textarea,
} from "@awsui/components-react";
import { listCustomers } from "../../graphql/queries";
import { createCustomer, updateCustomer } from "../../graphql/mutations";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteringText, setFilteringText] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    contactPerson: "",
    approverEmail: "",
    awsAccountIds: "",
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await API.graphql({
        query: listCustomers,
      });
      setCustomers(response.data.listCustomers.items);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
    setLoading(false);
  };

  const handleCreateCustomer = async () => {
    try {
      const input = {
        ...formData,
        awsAccountIds: formData.awsAccountIds.split(',').map(id => id.trim()),
        status: "active",
        notificationPreferences: JSON.stringify({
          emailEnabled: true,
          slackEnabled: false,
        }),
      };

      if (selectedCustomer) {
        await API.graphql({
          query: updateCustomer,
          variables: { input: { ...input, id: selectedCustomer.id } },
        });
      } else {
        await API.graphql({
          query: createCustomer,
          variables: { input },
        });
      }

      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        companyName: "",
        contactPerson: "",
        approverEmail: "",
        awsAccountIds: "",
      });
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      companyName: customer.companyName || "",
      contactPerson: customer.contactPerson || "",
      approverEmail: customer.approverEmail || "",
      awsAccountIds: (customer.awsAccountIds || []).join(", "),
    });
    setShowModal(true);
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name?.toLowerCase().includes(filteringText.toLowerCase()) ||
    customer.companyName?.toLowerCase().includes(filteringText.toLowerCase())
  );

  return (
    <Container
      header={
        <Header
          variant="h1"
          actions={
            <Button
              variant="primary"
              onClick={() => {
                setSelectedCustomer(null);
                setFormData({
                  name: "",
                  email: "",
                  companyName: "",
                  contactPerson: "",
                  approverEmail: "",
                  awsAccountIds: "",
                });
                setShowModal(true);
              }}
            >
              Add Customer
            </Button>
          }
        >
          Customer Management
        </Header>
      }
    >
      <SpaceBetween size="l">
        <TextFilter
          filteringText={filteringText}
          filteringPlaceholder="Search customers"
          onChange={({ detail }) => setFilteringText(detail.filteringText)}
        />

        <Cards
          loading={loading}
          items={filteredCustomers}
          cardDefinition={{
            header: (item) => item.name,
            sections: [
              {
                id: "company",
                header: "Company",
                content: (item) => item.companyName || "N/A",
              },
              {
                id: "contact",
                header: "Contact Person",
                content: (item) => item.contactPerson || "N/A",
              },
              {
                id: "email",
                header: "Email",
                content: (item) => item.email,
              },
              {
                id: "approver",
                header: "Approver Email",
                content: (item) => item.approverEmail,
              },
              {
                id: "accounts",
                header: "AWS Accounts",
                content: (item) => (item.awsAccountIds || []).length,
              },
              {
                id: "status",
                header: "Status",
                content: (item) => (
                  <StatusIndicator type={item.status === "active" ? "success" : "stopped"}>
                    {item.status || "unknown"}
                  </StatusIndicator>
                ),
              },
            ],
          }}
          cardsPerRow={[{ cards: 1 }, { minWidth: 500, cards: 2 }]}
          trackBy="id"
          variant="full-page"
          onCardClick={({ detail }) => handleEdit(detail)}
        />

        <Modal
          visible={showModal}
          onDismiss={() => setShowModal(false)}
          header={selectedCustomer ? "Edit Customer" : "Add Customer"}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="link" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateCustomer}>
                  {selectedCustomer ? "Update" : "Create"}
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Customer Name" stretch>
              <Input
                value={formData.name}
                onChange={({ detail }) =>
                  setFormData({ ...formData, name: detail.value })
                }
                placeholder="Enter customer name"
              />
            </FormField>

            <FormField label="Company Name" stretch>
              <Input
                value={formData.companyName}
                onChange={({ detail }) =>
                  setFormData({ ...formData, companyName: detail.value })
                }
                placeholder="Enter company name"
              />
            </FormField>

            <FormField label="Contact Person" stretch>
              <Input
                value={formData.contactPerson}
                onChange={({ detail }) =>
                  setFormData({ ...formData, contactPerson: detail.value })
                }
                placeholder="Enter contact person name"
              />
            </FormField>

            <FormField label="Email" stretch>
              <Input
                value={formData.email}
                onChange={({ detail }) =>
                  setFormData({ ...formData, email: detail.value })
                }
                placeholder="customer@example.com"
                type="email"
              />
            </FormField>

            <FormField label="Approver Email" stretch>
              <Input
                value={formData.approverEmail}
                onChange={({ detail }) =>
                  setFormData({ ...formData, approverEmail: detail.value })
                }
                placeholder="approver@example.com"
                type="email"
              />
            </FormField>

            <FormField
              label="AWS Account IDs"
              description="Comma-separated list of AWS account IDs"
              stretch
            >
              <Textarea
                value={formData.awsAccountIds}
                onChange={({ detail }) =>
                  setFormData({ ...formData, awsAccountIds: detail.value })
                }
                placeholder="123456789012, 234567890123"
                rows={3}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </Container>
  );
}
