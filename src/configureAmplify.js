import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";

let isConfigured = false;

function splitRedirects(value) {
  if (!value || typeof value !== "string") {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickRedirect(candidates, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const currentOrigin = window.location.origin;
  const currentOriginWithSlash = `${currentOrigin}/`;

  const exactMatch = candidates.find((url) => url === currentOriginWithSlash);
  if (exactMatch) {
    return exactMatch;
  }

  const sameOriginMatch = candidates.find((url) =>
    url.startsWith(currentOrigin)
  );
  if (sameOriginMatch) {
    return sameOriginMatch;
  }

  return currentOriginWithSlash;
}

export default function configureAmplify() {
  if (isConfigured) {
    return;
  }

  const nextConfig = { ...awsconfig };
  if (nextConfig.oauth) {
    const signInCandidates = splitRedirects(nextConfig.oauth.redirectSignIn);
    const signOutCandidates = splitRedirects(nextConfig.oauth.redirectSignOut);

    nextConfig.oauth = {
      ...nextConfig.oauth,
      redirectSignIn: pickRedirect(
        signInCandidates,
        nextConfig.oauth.redirectSignIn
      ),
      redirectSignOut: pickRedirect(
        signOutCandidates,
        nextConfig.oauth.redirectSignOut
      ),
    };
  }

  Amplify.configure(nextConfig);
  isConfigured = true;
}
