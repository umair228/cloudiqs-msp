// © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// CloudiQS MSP – Temporary Elevated Access Management for AWS IAM Identity Center
import { React, useState } from "react";
import Box from "@awsui/components-react/box";
import { useHistory } from "react-router-dom";
import Button from "@awsui/components-react/button";
import ColumnLayout from "@awsui/components-react/column-layout";
import Container from "@awsui/components-react/container";
import FormField from "@awsui/components-react/form-field";
import Grid from "@awsui/components-react/grid";
import SpaceBetween from "@awsui/components-react/space-between";
import Select from "@awsui/components-react/select";
import logo from "../../media/logo-transparent.png";
import "../../media/landing-page.css";

const quickActions = [
  { id: "1", label: "Create elevated access request" },
  { id: "2", label: "Approve or review requests" },
];

const workflowSteps = [
  {
    step: 1,
    title: "Request access",
    description: "Submit a time-bound elevated access request for an AWS account and permission set you are eligible for.",
  },
  {
    step: 2,
    title: "Approval",
    description: "Approvers for the account (or customer) review and approve or reject the request with justification.",
  },
  {
    step: 3,
    title: "Activate & use",
    description: "When approved, access is activated at the requested time. Use the AWS access portal to start sessions.",
  },
  {
    step: 4,
    title: "Audit",
    description: "All session activity is logged. Auditors and approvers can review request and session history.",
  },
];

const benefits = [
  {
    title: "Multi-tenant for MSPs",
    description: "Organize AWS accounts by customer. Assign approvers and eligibility per customer. Every request and session is tagged with customer context.",
  },
  {
    title: "Customer-scoped auditing",
    description: "Filter and export audit logs by customer. Track who requested what, when, and for which customer organization.",
  },
  {
    title: "Approval workflow",
    description: "Time-bound elevated access with configurable approval policies, eligibility, and automatic access removal when the duration ends.",
  },
  {
    title: "Secure access",
    description: "Single sign-on via IAM Identity Center and Cognito SAML. Group-based authorization for requesters, approvers, auditors, and admins.",
  },
];

function Landing(props) {
  const history = useHistory();
  const [selectedOption, setSelectedOption] = useState(quickActions[0]);

  const handleNext = () => {
    if (selectedOption.id === "1") {
      history.push("/requests/request");
    } else if (selectedOption.id === "2") {
      history.push("/approvals/approve");
    }
    props.setActiveHref("/sessions/active");
  };

  return (
    <Box margin={{ bottom: "l" }}>
      {/* Hero */}
      <div className="custom-home__header">
        <Box padding={{ vertical: "xxl", horizontal: "l" }}>
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
              <span className="custom-home__category">
                Multitenant temporary elevated access for AWS
              </span>
            </Box>
            <div className="custom-home__header-title">
              <Box padding={{ bottom: "s" }} className="landing-hero__logo-wrap">
                <img src={logo} alt="CloudiQS" className="landing-hero__logo" />
              </Box>
              <Box
                variant="h1"
                fontWeight="bold"
                padding="n"
                fontSize="heading-xl"
                color="inherit"
              >
                CloudiQS MSP
              </Box>
              <Box
                fontWeight="normal"
                padding={{ bottom: "s" }}
                fontSize="display-l"
                color="inherit"
              >
                Temporary Elevated Access Management
              </Box>
              <Box variant="p" fontWeight="light">
                <span className="custom-home__header-sub-title">
                  Request, approve, and manage time-bound elevated access to AWS
                  accounts at scale. Built for Managed Service Providers with
                  multi-customer support, customer-scoped approvers, and
                  per-customer audit trails—integrated with IAM Identity Center.
                </span>
              </Box>
            </div>
            <div className="custom-home__header-cta">
              <Container>
                <SpaceBetween size="l">
                  <Box variant="strong" color="inherit">
                    Quick actions
                  </Box>
                  <FormField stretch={true} label="What do you want to do?">
                    <Select
                      selectedAriaLabel="Selected"
                      options={quickActions}
                      selectedOption={selectedOption}
                      ariaRequired={true}
                      onChange={(e) =>
                        setSelectedOption(e.detail.selectedOption)
                      }
                    />
                  </FormField>
                  <Button variant="primary" onClick={handleNext}>
                    Continue
                  </Button>
                </SpaceBetween>
              </Container>
            </div>
          </Grid>
        </Box>
      </div>

      {/* Main content */}
      <Box padding={{ top: "xxxl", horizontal: "l", bottom: "xxxl" }}>
        <Grid
          gridDefinition={[
            { colspan: { xl: 8, l: 10, xxs: 12 } },
            { colspan: { xl: 4, l: 2, xxs: 12 } },
          ]}
        >
          <SpaceBetween size="xxl">
            {/* How it works */}
            <div className="landing-section">
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: "m", top: "n" }}
              >
                How it works
              </Box>
              <div className="landing-steps">
                {workflowSteps.map((item) => (
                  <div key={item.step} className="landing-step">
                    <div className="landing-step__number">{item.step}</div>
                    <div className="landing-step__body">
                      <Box variant="strong" padding={{ bottom: "xxs" }}>
                        {item.title}
                      </Box>
                      <Box variant="p" color="text-body-secondary">
                        {item.description}
                      </Box>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div className="landing-section">
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: "m", top: "n" }}
              >
                Why CloudiQS MSP
              </Box>
              <Container>
                <ColumnLayout columns={2} variant="text-grid">
                  {benefits.map((item) => (
                    <div key={item.title} className="landing-benefit">
                      <Box variant="h3" padding={{ top: "n", bottom: "xs" }}>
                        {item.title}
                      </Box>
                      <Box variant="p" color="text-body-secondary">
                        {item.description}
                      </Box>
                    </div>
                  ))}
                </ColumnLayout>
              </Container>
            </div>

            {/* Visual / product image */}
            <div className="landing-section landing-section--center">
              <Box
                variant="h1"
                tagOverride="h2"
                padding={{ bottom: "m", top: "n" }}
              >
                One console for access lifecycle
              </Box>
              <Container className="landing-picbox">
                <img src={logo} alt="CloudiQS MSP" className="landing-pic" />
              </Container>
            </div>
          </SpaceBetween>
        </Grid>
      </Box>
    </Box>
  );
}

export default Landing;
