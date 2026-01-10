import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { Container } from "reactstrap";

const Register = () => {
  //meta title
  document.title = "Register | HSE AgenticAI Admin Panel";

  return (
    <React.Fragment>
      <div className="auth-page" style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <Container>
          <div className="d-flex justify-content-center">
            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto shadow-xl",
                  card: "rounded-lg",
                  headerTitle: "text-2xl font-bold",
                  headerSubtitle: "text-gray-600",
                  socialButtonsBlockButton: "border-2",
                  formButtonPrimary: "bg-primary hover:bg-primary-dark",
                  footerActionLink: "text-primary hover:text-primary-dark"
                },
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "iconButton"
                }
              }}
              routing="path"
              path="/sign-up"
              signInUrl="/sign-in"
              redirectUrl="/dashboard"
            />
          </div>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default Register;
