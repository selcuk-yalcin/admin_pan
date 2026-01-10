import React from "react";
import { SignIn } from "@clerk/clerk-react";

const Login = () => {
  //meta title
  document.title = "Login | HSE AgenticAI Admin Panel";

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <SignIn 
        afterSignInUrl="/dashboard"
        signUpUrl="/sign-up"
      />
    </div>
  );
};

export default Login;
