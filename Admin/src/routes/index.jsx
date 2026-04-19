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

// Kinde Authentication
import KindeLogin from "../pages/Authentication/KindeLogin";
import KindeLogout from "../pages/Authentication/KindeLogout";
import KindeCallback from "../pages/Authentication/KindeCallback";

// Inner Authentication
import Recoverpw from "../pages/AuthenticationInner/Recoverpw";

// Dashboard
import Dashboard from "../pages/Dashboard/index";

// Utility Pages
import PagesPricing from "../pages/Utility/pages-pricing";

const authProtectedRoutes = [
  // Ana sayfa - Legislation Chatbot'a yönlendir
  { path: "/", component: <Navigate to="/legislation-chatbot" /> },
  
  // Dashboard - gizli (URL'den erişilebilir ama menüde görünmez)
  { path: "/dashboard", component: <Dashboard /> },
  
  // Root Cause Analysis
  { path: "/root-cause-analysis", component: <RootCausePanel /> },
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
];

// Full-screen routes - auth protected but NO admin layout (no sidebar, header, footer)
const fullScreenRoutes = [
  { path: "/legislation-chatbot", component: <LegislationChatbot /> },
];

const publicRoutes = [
  { path: "/", component: <KindeLogin /> },
  { path: "/logout", component: <KindeLogout /> },
  { path: "/login", component: <KindeLogin /> },
  { path: "/kinde-callback", component: <KindeCallback /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <KindeLogin /> },
  { path: "/pages-login", component: <KindeLogin /> },
  { path: "/pages-register", component: <KindeLogin /> },
  { path: "/page-recoverpw", component: <Recoverpw /> },
];

export { authProtectedRoutes, publicRoutes, fullScreenRoutes };

