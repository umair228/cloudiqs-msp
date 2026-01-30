// © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// This AWS Content is provided subject to the terms of the AWS Customer Agreement available at
// http://aws.amazon.com/agreement or other written agreement between Customer and either
// Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import { React, useState, useEffect } from "react";
import Box from "@awsui/components-react/box";
import { useHistory } from "react-router-dom";
import Button from "@awsui/components-react/button";
import ColumnLayout from "@awsui/components-react/column-layout";
import Container from "@awsui/components-react/container";
import FormField from "@awsui/components-react/form-field";
import Grid from "@awsui/components-react/grid";
import SpaceBetween from "@awsui/components-react/space-between";
import Cards from "@awsui/components-react/cards";
import Header from "@awsui/components-react/header";
import Badge from "@awsui/components-react/badge";
import Select from "@awsui/components-react/select";
import { API } from "aws-amplify";
import { listCustomers } from "../../graphql/queries";
import team from "../../media/team.png";
import "../../media/landing-page.css";

const selections = [
  { id: "1", label: "Create access request" },
  { id: "2", label: "Approve requests" },
  { id: "3", label: "Manage customers" },
];

function Landing(props) {
  const history = useHistory();
  const [selectedOption, setSelectedOption] = useState(selections[0]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalAccounts: 0,
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await API.graphql({
        query: listCustomers,
      });
      const customerList = response.data.listCustomers.items;
      setCustomers(customerList);
      
      // Calculate stats
      const activeCustomers = customerList.filter(c => c.status === 'active');
      const totalAccounts = customerList.reduce((sum, c) => 
        sum + (c.awsAccountIds?.length || 0), 0
      );
      
      setStats({
        totalCustomers: customerList.length,
        activeCustomers: activeCustomers.length,
        totalAccounts: totalAccounts,
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  return (
    <Box margin={{ bottom: "l" }}>
      <div className="custom-home__header" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        paddingBottom: '60px'
      }}>
        <Box>
          <Grid
            gridDefinition={[
              { offset: { l: 2, xxs: 1 }, colspan: { l: 8, xxs: 10 } },
              {
                colspan: { xl: 6, l: 5, s: 6, xxs: 10 },
                offset: { l: 2, xxs: 1 },
              },
              {
                colspan: { xl: 2, l: 3, s: 4, xxs: 10 },
                offset: { s: 0, xxs: 1 },
              },
            ]}
          >
            <Box fontWeight="light" padding={{ top: "xs" }}>
              <span className="custom-home__category" style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                CloudiQS MSP Platform
              </span>
            </Box>
            <div className="custom-home__header-title">
              <Box
                variant="h1"
                fontWeight="bold"
                padding="n"
                fontSize="heading-xl"
                color="inherit"
                style={{ color: 'white' }}
              >
                Multi-Customer AWS Access Management
              </Box>
              <Box
                fontWeight="normal"
                padding={{ bottom: "s" }}
                fontSize="display-l"
                color="inherit"
                style={{ color: 'white' }}
              >
                Secure, Time-Bound Access Control
              </Box>
              <Box variant="p" fontWeight="light">
                <span className="custom-home__header-sub-title" style={{ 
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontSize: '16px',
                  lineHeight: '1.6'
                }}>
                  CloudiQS MSP provides enterprise-grade, temporary elevated access 
                  management across multiple customer AWS environments with 
                  AI-powered audit trails and email-based approvals.
                </span>
              </Box>
            </div>
            <div className="custom-home__header-cta">
              <Container margin={{ left: "xxl" }} style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
              }}>
                <SpaceBetween size="xl">
                  <Box variant="h2" padding="n" style={{ color: '#667eea' }}>
                    Quick Actions
                  </Box>
                  <FormField stretch={true} label="What would you like to do?">
                    <Select
                      selectedAriaLabel="Selected"
                      options={selections}
                      selectedOption={selectedOption}
                      ariaRequired={true}
                      onChange={(e) =>
                        setSelectedOption(e.detail.selectedOption)
                      }
                    />
                  </FormField>
                  <Button
                    href="#"
                    variant="primary"
                    onClick={() => {
                      if (selectedOption.id === "1") {
                        history.push("/requests/request");
                      } else if (selectedOption.id === "2") {
                        history.push("/approvals/approve");
                      } else if (selectedOption.id === "3") {
                        history.push("/admin/customers");
                      }
                      props.setActiveHref("/sessions/active")
                    }}
                  >
                    Get Started
                  </Button>
                </SpaceBetween>
              </Container>
            </div>
          </Grid>
        </Box>
      </div>

      <Box padding={{ top: "xxxl", horizontal: "s" }}>
        <Grid
          gridDefinition={[
            { colspan: { l: 12, xxs: 12 } }
          ]}
        >
          <SpaceBetween size="xxl">
            {/* Platform Statistics */}
            <div>
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: "s", top: "n" }}
              >
                Platform Overview
              </Box>
              <ColumnLayout columns={3} borders="vertical">
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Box variant="h1" fontSize="display-l" color="text-status-info">
                    {stats.totalCustomers}
                  </Box>
                  <Box variant="p" color="text-body-secondary">
                    Total Customers
                  </Box>
                </div>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Box variant="h1" fontSize="display-l" color="text-status-success">
                    {stats.activeCustomers}
                  </Box>
                  <Box variant="p" color="text-body-secondary">
                    Active Customers
                  </Box>
                </div>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Box variant="h1" fontSize="display-l" color="text-status-warning">
                    {stats.totalAccounts}
                  </Box>
                  <Box variant="p" color="text-body-secondary">
                    AWS Accounts
                  </Box>
                </div>
              </ColumnLayout>
            </div>

            {/* Recent Customers */}
            {customers.length > 0 && (
              <div>
                <Container
                  header={
                    <Header
                      variant="h2"
                      actions={
                        <Button
                          onClick={() => history.push("/admin/customers")}
                        >
                          View All Customers
                        </Button>
                      }
                    >
                      Recent Customers
                    </Header>
                  }
                >
                  <Cards
                    items={customers.slice(0, 4)}
                    cardDefinition={{
                      header: (item) => (
                        <div>
                          {item.name}
                          {item.status === 'active' && (
                            <Badge color="green" style={{ marginLeft: '10px' }}>Active</Badge>
                          )}
                        </div>
                      ),
                      sections: [
                        {
                          id: "company",
                          content: (item) => item.companyName || "N/A",
                        },
                        {
                          id: "accounts",
                          header: "AWS Accounts",
                          content: (item) => (item.awsAccountIds?.length || 0),
                        },
                      ],
                    }}
                    cardsPerRow={[
                      { cards: 1 },
                      { minWidth: 500, cards: 2 },
                      { minWidth: 1000, cards: 4 }
                    ]}
                    trackBy="id"
                  />
                </Container>
              </div>
            )}

            {/* How it works */}
            <div>
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: "s", top: "n" }}
              >
                How it works
              </Box>
              <Container className="picbox">
                <div>
                  <img src={team} alt="team" className="pic" />
                </div>
              </Container>
            </div>

            {/* Key Features */}
            <div>
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: "s", top: "n" }}
              >
                Key Features
              </Box>
              <Container>
                <ColumnLayout columns={2} variant="text-grid">
                  <div>
                    <Box variant="h3" padding={{ top: "n" }}>
                      🏢 Multi-Tenant Management
                    </Box>
                    <Box variant="p">
                      Manage access across multiple customer AWS accounts with 
                      complete data isolation and customer-specific policies.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: "n" }}>
                      ✉️ Email-Based Approvals
                    </Box>
                    <Box variant="p">
                      Customers approve access requests via secure email links 
                      without needing portal access.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: "n" }}>
                      🤖 AI-Powered Summaries
                    </Box>
                    <Box variant="p">
                      AWS Bedrock generates customer-friendly summaries of 
                      access activities for transparency.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: "n" }}>
                      🔐 Time-Bound Access
                    </Box>
                    <Box variant="p">
                      Automatic credential expiration with maximum 1-hour access 
                      windows for enhanced security.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: "n" }}>
                      📊 Comprehensive Auditing
                    </Box>
                    <Box variant="p">
                      Per-customer audit trails with CloudTrail integration and 
                      exportable compliance reports.
                    </Box>
                  </div>
                  <div>
                    <Box variant="h3" padding={{ top: "n" }}>
                      ⚡ Quick Access Workflow
                    </Box>
                    <Box variant="p">
                      Streamlined request process with ticket references, 
                      justifications, and automated notifications.
                    </Box>
                  </div>
                </ColumnLayout>
              </Container>
            </div>
          </SpaceBetween>
        </Grid>
      </Box>
    </Box>
  );
}
export default Landing;
