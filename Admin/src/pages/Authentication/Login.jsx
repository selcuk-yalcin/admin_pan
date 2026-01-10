import React from "react";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

const Login = () => {
  const { isSignedIn, isLoaded } = useAuth();

  //meta title
  document.title = "Login | HSE AgenticAI Admin Panel";

  // Don't render SignIn if user is already logged in
  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <SignIn />
    </div>
  );
};

export default Login;
