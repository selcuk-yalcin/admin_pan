import PropTypes from "prop-types";
import React, { useEffect, useRef } from "react";

// //Import Scrollbar
import SimpleBar from "simplebar-react";

// MetisMenu
import MetisMenu from "metismenujs";
import { Link, useLocation } from "react-router-dom";
import withRouter from "../Common/withRouter";

//i18n
import { withTranslation } from "react-i18next";
import { useCallback } from "react";
import { LEGISLATION_CHATBOT_ENABLED } from "../../config/appHome";

const SidebarContent = (props) => {
  const ref = useRef();
  const path = useLocation();

  const activateParentDropdown = useCallback((item) => {
    item.classList.add("active");
    const parent = item.parentElement;
    const parent2El = parent.childNodes[1];
    if (parent2El && parent2El.id !== "side-menu") {
      parent2El.classList.add("mm-show");
    }

    if (parent) {
      parent.classList.add("mm-active");
      const parent2 = parent.parentElement;

      if (parent2) {
        parent2.classList.add("mm-show"); // ul tag

        const parent3 = parent2.parentElement; // li tag

        if (parent3) {
          parent3.classList.add("mm-active"); // li
          parent3.childNodes[0].classList.add("mm-active"); //a
          const parent4 = parent3.parentElement; // ul
          if (parent4) {
            parent4.classList.add("mm-show"); // ul
            const parent5 = parent4.parentElement;
            if (parent5) {
              parent5.classList.add("mm-show"); // li
              parent5.childNodes[0].classList.add("mm-active"); // a tag
            }
          }
        }
      }
      scrollElement(item);
      return false;
    }
    scrollElement(item);
    return false;
  }, []);

  const removeActivation = (items) => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;

      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        const parent2El =
          parent.childNodes && parent.childNodes.lenght && parent.childNodes[1]
            ? parent.childNodes[1]
            : null;
        if (parent2El && parent2El.id !== "side-menu") {
          parent2El.classList.remove("mm-show");
        }

        parent.classList.remove("mm-active");
        const parent2 = parent.parentElement;

        if (parent2) {
          parent2.classList.remove("mm-show");

          const parent3 = parent2.parentElement;
          if (parent3) {
            parent3.classList.remove("mm-active"); // li
            parent3.childNodes[0].classList.remove("mm-active");

            const parent4 = parent3.parentElement; // ul
            if (parent4) {
              parent4.classList.remove("mm-show"); // ul
              const parent5 = parent4.parentElement;
              if (parent5) {
                parent5.classList.remove("mm-show"); // li
                parent5.childNodes[0].classList.remove("mm-active"); // a tag
              }
            }
          }
        }
      }
    }
  };

  const activeMenu = useCallback(() => {
    const pathName = path.pathname;
    let matchingMenuItem = null;
    const ul = document.getElementById("side-menu");
    const items = ul.getElementsByTagName("a");
    removeActivation(items);

    for (let i = 0; i < items.length; ++i) {
      if (pathName === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  }, [path.pathname, activateParentDropdown]);

  useEffect(() => {
    ref.current.recalculate();
  }, []);

  // useEffect(() => {
  //   new MetisMenu("#side-menu");
  //   activeMenu();
  // }, []);
  useEffect(() => {
    const metisMenu = new MetisMenu("#side-menu");
    activeMenu();

    // Cleanup on component unmount
    return () => {
      metisMenu.dispose();
    };
  }, []);

  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    activeMenu();
  }, [activeMenu]);

  function scrollElement(item) {
    if (item) {
      const currentPosition = item.offsetTop;
      if (currentPosition > window.innerHeight) {
        ref.current.getScrollElement().scrollTop = currentPosition - 300;
      }
    }
  }

  return (
    <React.Fragment>
      <SimpleBar className="h-100" ref={ref}>
        <div id="sidebar-menu">
          <ul className="metismenu list-unstyled" id="side-menu">
            <li className="menu-title">{props.t("Ana Menü")} </li>

            <li>
              <Link to="/dashboard">
                <i className="bx bx-home-circle"></i>
                <span>{props.t("Dashboard")}</span>
              </Link>
            </li>

            {LEGISLATION_CHATBOT_ENABLED ? (
              <li>
                <Link to="/legislation-chatbot">
                  <i className="bx bx-book-bookmark"></i>
                  <span>{props.t("Mevzuat Asistanı")}</span>
                  <span className="badge rounded-pill bg-warning float-end">AI</span>
                </Link>
              </li>
            ) : null}

            <li style={{ display: "none" }}>
              <Link to="/#" className="has-arrow">
                <i className="bx bx-shield"></i>
                <span>{props.t("Risk Değerlendirme")}</span>
                <span className="badge rounded-pill float-end" style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',fontSize:9,letterSpacing:'.3px'}}>YAKINDA</span>
              </Link>
              <ul className="sub-menu" aria-expanded="false">
                <li>
                  <Link to="/risk-assessment">{props.t("Risk Assessment List")}</Link>
                </li>
                <li>
                  <Link to="/risk-assessment-form">{props.t("New Assessment")}</Link>
                </li>
              </ul>
            </li>

            <li>
              <Link to="/root-cause-manual">
                <i className="bx bx-search-alt"></i>
                <span>{props.t("DeepWhy")}</span>
                <span className="badge rounded-pill bg-warning float-end">AI</span>
              </Link>
            </li>

            <li>
              <Link to="/deep-training">
                <i className="bx bx-layout"></i>
                <span>{props.t("Deep Training")}</span>
                <span className="badge rounded-pill bg-warning float-end">AI</span>
              </Link>
            </li>

            <li>
              <Link to="/apps-filemanager">
                <i className="bx bx-file"></i>
                <span>{props.t("File Manager")}</span>
              </Link>
            </li>

            <li>
              <Link to="/calendar" className=" ">
                <i className="bx bx-calendar"></i>
                <span>{props.t("Calendar")}</span>
              </Link>
            </li>

            <li>
              <Link to="/pages-pricing">
                <i className="bx bx-dollar-circle"></i>
                <span>{props.t("Pricing")}</span>
              </Link>
            </li>

            <li className="menu-title">Pages</li>
            <li>
              <Link to="/#" className="has-arrow ">
                <i className="bx bx-user-circle"></i>
                <span>{props.t("Authentication")}</span>
              </Link>
              <ul className="sub-menu">
                <li>
                  <Link to="/pages-login">{props.t("Login")}</Link>
                </li>
                <li>
                  <Link to="/pages-register">{props.t("Register")}</Link>
                </li>
                <li>
                  <Link to="/page-recoverpw">
                    {props.t("Recover Password")}
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </SimpleBar>
    </React.Fragment>
  );
};

SidebarContent.propTypes = {
  location: PropTypes.object,
  t: PropTypes.any,
};

export default withRouter(withTranslation()(SidebarContent));
