import PropTypes from "prop-types";
import React from "react";

import { Routes, Route, Navigate } from "react-router-dom";
import { connect } from "react-redux";
import { useAuth } from "@clerk/clerk-react";

import { useSelector } from "react-redux";
import { createSelector } from "reselect";

// Import Routes all
import { authProtectedRoutes, publicRoutes } from "./routes/index";

// Import all middleware
import Authmiddleware from "./routes/route";

// layouts Format
import VerticalLayout from "./components/VerticalLayout/";
import HorizontalLayout from "./components/HorizontalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

// Import scss
import "./assets/scss/theme.scss";

// Import Firebase Configuration file
// import { initFirebaseBackend } from "./helpers/firebase_helper"

import fakeBackend from "./helpers/AuthType/fakeBackend"
// Activating fake backend
fakeBackend();

const App = (props) => {
  const LayoutProperties = createSelector(
    (state) => state.Layout,
    (layout) => ({
      layoutType: layout.layoutType,
    })
  );

  const {
    layoutType
  } = useSelector(LayoutProperties);

  const { isSignedIn, isLoaded } = useAuth();

  function getLayout(layoutType) {
    let layoutCls = VerticalLayout;
    switch (layoutType) {
      case "horizontal":
        layoutCls = HorizontalLayout;
        break;
      default:
        layoutCls = VerticalLayout;
        break;
    }
    return layoutCls;
  }

  const Layout = getLayout(layoutType);

  // Protected Route wrapper
  const ProtectedRoute = ({ children }) => {
    if (!isLoaded) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>Loading...</div>
        </div>
      );
    }
    
    if (!isSignedIn) {
      return <Navigate to="/login" replace />;
    }
    
    return children;
  };

  return (
    <React.Fragment>
      <Routes>
        {/* Public routes - accessible without authentication */}
        {publicRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={<NonAuthLayout>{route.component}</NonAuthLayout>}
            key={idx}
            exact={true}
          />
        ))}

        {/* Protected routes - require Clerk authentication */}
        {authProtectedRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={
              <ProtectedRoute>
                <Authmiddleware>
                  <Layout>{route.component}</Layout>
                </Authmiddleware>
              </ProtectedRoute>
            }
            key={idx}
            exact={true}
          />
        ))}
      </Routes>
    </React.Fragment>
  );
};

App.propTypes = {
  layout: PropTypes.any,
};

const mapStateToProps = (state) => {
  return {
    layout: state.Layout,
  };
};

export default connect(mapStateToProps, null)(App);
