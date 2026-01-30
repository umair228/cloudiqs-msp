// © 2023 Amazon Web Services, Inc. or its affiliates. All Rights Reserved.
// This AWS Content is provided subject to the terms of the AWS Customer Agreement available at
// http://aws.amazon.com/agreement or other written agreement between Customer and either
// Amazon Web Services, Inc. or Amazon Web Services EMEA SARL or both.
import React, { useEffect, useState } from "react";
import { Amplify, Auth, Hub } from "aws-amplify";
import { Spin, Layout } from "antd";
import awsconfig from "./aws-exports";
import Nav from "./components/Navigation/Nav";
import home from "./media/Home.svg";
import "./index.css";
import { Button } from "@awsui/components-react";

const { Header, Content } = Layout;

Amplify.configure(awsconfig);

function Home(props) {
  const handleFederatedSignIn = async () => {
    try {
      await Auth.federatedSignIn();
    } catch (error) {
      console.log("Federated sign in not available:", error.message);
      alert("Authentication is not configured. Please run 'amplify push' to set up AWS Cognito.");
    }
  };

  return (
    <Layout className="site-layout">
      <Header className="site-layout-background" style={{ padding: 0 }} />
      <Content className="layout">
        <Spin spinning={props.loading} size="large">
          <Button
            className="homebutton"
            variant="primary"
            onClick={handleFederatedSignIn}
          >
            Federated Sign In
          </Button>
          <img src={home} alt="Homepage" className="home" />
        </Spin>
      </Content>
    </Layout>
  );
}
function App() {
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState(null);
  const [cognitoGroups, setcognitoGroups] = useState([]);
  const [userId, setUserId] = useState(null);
  const [groupIds, setGroupIds] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      // eslint-disable-next-line default-case
      switch (event) {
        case "signIn":
          console.log("User signed in");
          break;
        // eslint-disable-next-line no-fallthrough
        case "cognitoHostedUI":
          setData();
          break;
        case "signOut":
          console.log("User signed out");
          setLoading(false);
          break;
        case "signIn_failure":
          console.log("User sign in failure");
          break;
        case "cognitoHostedUI_failure":
          console.log("Sign in failure");
          break;
      }
    });

    setData();
  }, []);

  function setData() {
    getUser().then((userData) => {
      if (userData && userData.signInUserSession && userData.signInUserSession.idToken) {
        setUser(userData);
        const payload = userData.signInUserSession.idToken.payload;
        setcognitoGroups(payload["cognito:groups"]);
        setUserId(payload.userId);
        setGroupIds((payload.groupIds).split(','));
        setGroups((payload.groups).split(','));
        setLoading(false);
      } else {
        console.log("User data not available or incomplete");
        setLoading(false);
      }
    });
  }

  async function getUser() {
    try {
      const userData = await Auth.currentAuthenticatedUser();
      return userData;
    } catch {
      setLoading(false);
      console.log("Not signed in");
      return null;
    }
  }

  return (
    <div>
      {groups ? (
        <Nav
          user={user}
          groupIds={groupIds}
          userId={userId}
          groups={groups}
          cognitoGroups={cognitoGroups}
        />
      ) : (
        <Home loading={loading} />
      )}
    </div>
  );
}

export default App;
