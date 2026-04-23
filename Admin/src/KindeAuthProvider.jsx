import React, { memo, useMemo } from "react";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";

const KINDE_CLIENT_ID = import.meta.env.VITE_KINDE_CLIENT_ID || "bb1e7cbd3b9f41e1a5b4321f58da6dde";
const KINDE_DOMAIN = import.meta.env.VITE_KINDE_DOMAIN || "https://inferaworld.kinde.com";

function resolveRedirectUri() {
  const fromEnv = import.meta.env.VITE_KINDE_REDIRECT_URI;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/kinde-callback`;
  }
  return "http://localhost:5173/kinde-callback";
}

function resolveLogoutUri() {
  const fromEnv = import.meta.env.VITE_KINDE_LOGOUT_URI;
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/login`;
  }
  return "http://localhost:5173/login";
}

const KindeAuthProvider = memo(({ children }) => {
  const redirectUri = useMemo(() => resolveRedirectUri(), []);
  const logoutUri = useMemo(() => resolveLogoutUri(), []);

  return (
    <KindeProvider
      clientId={KINDE_CLIENT_ID}
      domain={KINDE_DOMAIN}
      redirectUri={redirectUri}
      logoutUri={logoutUri}
      forceChildrenRender
    >
      {children}
    </KindeProvider>
  );
});

export default KindeAuthProvider;
