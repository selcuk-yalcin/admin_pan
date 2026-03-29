import React, { memo } from "react";
import { KindeProvider } from "@kinde-oss/kinde-auth-react";

const KINDE_CLIENT_ID = import.meta.env.VITE_KINDE_CLIENT_ID || "bb1e7cbd3b9f41e1a5b4321f58da6dde";
const KINDE_DOMAIN = import.meta.env.VITE_KINDE_DOMAIN || "https://inferaworld.kinde.com";
const KINDE_REDIRECT_URI = import.meta.env.VITE_KINDE_REDIRECT_URI || "http://localhost:5173/kinde-callback";
const KINDE_LOGOUT_URI = import.meta.env.VITE_KINDE_LOGOUT_URI || "http://localhost:5173/login";

const KindeAuthProvider = memo(({ children }) => {
  return (
    <KindeProvider
      clientId={KINDE_CLIENT_ID}
      domain={KINDE_DOMAIN}
      redirectUri={KINDE_REDIRECT_URI}
      logoutUri={KINDE_LOGOUT_URI}
    >
      {children}
    </KindeProvider>
  );
});

export default KindeAuthProvider;
