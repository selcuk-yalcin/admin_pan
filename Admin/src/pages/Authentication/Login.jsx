import React, { useEffect } from "react";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const navigate = useNavigate();

  //meta title
  document.title = "Login | HSE AgenticAI Admin Panel";

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log('✅ User is already signed in, redirecting to dashboard...');
      navigate("/dashboard", { replace: true });
    }
  }, [isSignedIn, isLoaded, navigate]);

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
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div>Redirecting to dashboard...</div>
      </div>
    );
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
