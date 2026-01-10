import React from "react";
import { SignUp } from "@clerk/clerk-react";

const Register = () => {
  //meta title
  document.title = "Register | HSE AgenticAI Admin Panel";

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <SignUp />
    </div>
  );
};

export default Register;
