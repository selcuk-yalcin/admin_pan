import PropTypes from "prop-types";
import React, { useEffect } from "react";

import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { connect } from "react-redux";

import { useSelector } from "react-redux";
import { createSelector } from "reselect";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";

// Import Routes all
import { authProtectedRoutes, publicRoutes, fullScreenRoutes } from "./routes/index";

// Import all middleware
import Authmiddleware from "./routes/route";

// layouts Format
import VerticalLayout from "./components/VerticalLayout/";
import HorizontalLayout from "./components/HorizontalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

// Import scss
import "./assets/scss/theme.scss";

const selectLayoutFromState = createSelector(
  (state) => state.Layout,
  (layout) => ({
    layoutType: layout.layoutType,
  })
);

const App = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useKindeAuth();

  const { layoutType } = useSelector(selectLayoutFromState);

  // Redirect to login if not authenticated and trying to access protected route
  useEffect(() => {
    const publicPaths = ['/', '/login', '/register', '/logout', '/kinde-callback', '/forgot-password', '/page-recoverpw', '/pages-login', '/pages-register'];
    const isPublicPath = publicPaths.some((path) =>
      path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
    );
    
    if (!isLoading && !isAuthenticated && !isPublicPath) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

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

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="sr-only">Yükleniyor...</span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <Routes>
        {publicRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={<NonAuthLayout>{route.component}</NonAuthLayout>}
            key={idx}
            exact={true}
          />
        ))}

        {authProtectedRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={
              <Authmiddleware>
                <Layout>{route.component}</Layout>
              </Authmiddleware>
            }
            key={idx}
            exact={true}
          />
        ))}

        {fullScreenRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={
              <Authmiddleware>
                {route.component}
              </Authmiddleware>
            }
            key={`fs-${idx}`}
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
