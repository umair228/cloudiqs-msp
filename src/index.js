// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. // SPDX-License-Identifier: MIT-0
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "@awsui/global-styles/index.css";
import configureAmplify from "./configureAmplify";

configureAmplify();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
