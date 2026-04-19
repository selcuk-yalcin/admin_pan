import React from "react";
import { Navigate } from "react-router-dom";

// Pages Component
import LegislationChatbot from "../pages/Chatbot/LegislationChatbot";
import RootCausePanel from "../pages/RootCauseAnalysis/RootCausePanel";
import RcaFrontendPage from "../pages/RootCauseAnalysis/RcaFrontendPage";
import RiskAssessmentPanel from "../pages/RiskAssessment/RiskAssessmentPanel";
import RiskAssessmentForm from "../pages/RiskAssessment/RiskAssessmentForm";

// File Manager
import FileManager from "../pages/FileManager/index";

// Profile
import UserProfile from "../pages/Authentication/user-profile";

// Pages Calendar
import Calendar from "../pages/Calendar/index";

// Authentication related pages
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";

// Inner Authentication
import Recoverpw from "../pages/AuthenticationInner/Recoverpw";

// Dashboard
import Dashboard from "../pages/Dashboard/index";

// Utility Pages
import PagesPricing from "../pages/Utility/pages-pricing";

const authProtectedRoutes = [
  { path: "/dashboard", component: <Dashboard /> },

  // Legislation Chatbot
  { path: "/legislation-chatbot", component: <LegislationChatbot /> },
  
  // Root Cause Analysis
  { path: "/root-cause-analysis", component: <RootCausePanel /> },
  { path: "/root-cause-smart", component: <Navigate to="/legislation-chatbot" replace /> },
  { path: "/root-cause-tools", component: <RcaFrontendPage /> },
  { path: "/rootcause-form", component: <Navigate to="/root-cause-tools?tab=form" replace /> },
  
  // Risk Assessment
  { path: "/risk-assessment", component: <RiskAssessmentPanel /> },
  { path: "/risk-assessment-form", component: <RiskAssessmentForm /> },
  { path: "/risk-assessment-form/:id", component: <RiskAssessmentForm /> },

  // File Manager
  { path: "/apps-filemanager", component: <FileManager /> },

  // Calendar
  { path: "/calendar", component: <Calendar /> },

  // Profile
  { path: "/profile", component: <UserProfile /> },

  // Pricing
  { path: "/pages-pricing", component: <PagesPricing /> },

  // Default route
  { path: "/", exact: true, component: <Navigate to="/dashboard" /> },
];

const publicRoutes = [
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
  { path: "/pages-login", component: <Login /> },
  { path: "/pages-register", component: <Register /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
];

export { authProtectedRoutes, publicRoutes };
