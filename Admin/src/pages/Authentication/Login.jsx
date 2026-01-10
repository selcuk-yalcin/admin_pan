import React, { useEffect } from "react";
import { SignIn, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  //meta title
  document.title = "Login | HSE AgenticAI Admin Panel";

  useEffect(() => {
    if (isSignedIn) {
      navigate("/dashboard");
    }
  }, [isSignedIn, navigate]);

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
