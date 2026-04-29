/**
=========================================================
* Soft UI Dashboard React - v4.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { lazy, Suspense, useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import Icon from "components/AppIcon";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";

// Soft UI Dashboard React examples
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Soft UI Dashboard React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Soft UI Dashboard React routes
import routes from "routes";
import PrivateRoute from "components/PrivateRoute";

// Owner auth
import { OwnerAuthProvider, useOwnerAuth } from "context/OwnerAuthContext";
import { Navigate as Redir } from "react-router-dom";

function OwnerPrivateRoute({ children }) {
  const { isAuthenticated } = useOwnerAuth();
  return isAuthenticated ? children : <Redir to="/owner/login" replace />;
}

// Soft UI Dashboard React contexts
import { useSoftUIController, setMiniSidenav, setOpenConfigurator } from "context";

const LandingPage = lazy(() => import("layouts/landing"));
const OwnerDashboard = lazy(() => import("layouts/owner/dashboard"));
const OwnerTenants = lazy(() => import("layouts/owner/tenants"));
const OwnerPlans = lazy(() => import("layouts/owner/plans"));
const OwnerRevenue = lazy(() => import("layouts/owner/revenue"));
const OwnerNotifications = lazy(() => import("layouts/owner/notifications"));
const OwnerSupport = lazy(() => import("layouts/owner/support"));
const OwnerLogin = lazy(() => import("layouts/owner/login"));

function RouteFallback() {
  return (
    <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress size={32} />
    </SoftBox>
  );
}

// ─── Dark mode global CSS overrides ──────────────────────────────────────────
const darkModeStyles = {
  // Body + root bg
  "html[data-dark]": { backgroundColor: "#0f172a" },
  "html[data-dark] body":    { backgroundColor: "#0f172a !important" },

  // Cards & Papers (exclude chips, badges, tooltips)
  "html[data-dark] .MuiCard-root": {
    backgroundColor: "#1e293b !important",
    boxShadow: "0 2px 12px rgba(0,0,0,0.4) !important",
  },
  "html[data-dark] .MuiPaper-root:not(.MuiTooltip-tooltip)": {
    backgroundColor: "#1e293b !important",
  },

  // AppBar / Navbar
  "html[data-dark] .MuiAppBar-root": {
    background: "rgba(15,23,42,0.85) !important",
    backdropFilter: "saturate(200%) blur(30px) !important",
    boxShadow: "0 1px 0 rgba(255,255,255,0.06) !important",
  },

  // Sidenav drawer
  "html[data-dark] .MuiDrawer-paper": {
    backgroundColor: "rgba(15,23,42,0.92) !important",
    backgroundImage: "none !important",
    backdropFilter: "saturate(200%) blur(30px) !important",
  },
  "html[data-dark] .MuiDrawer-paper .MuiTypography-root": {
    color: "#e2e8f0 !important",
  },
  "html[data-dark] .MuiDrawer-paper .MuiDivider-root": {
    borderColor: "rgba(255,255,255,0.1) !important",
  },

  // Dialogs
  "html[data-dark] .MuiDialog-paper": { backgroundColor: "#1e293b !important" },
  "html[data-dark] .MuiDialogTitle-root":   { backgroundColor: "#1e293b !important", color: "#e2e8f0 !important" },
  "html[data-dark] .MuiDialogContent-root": { backgroundColor: "#1e293b !important", color: "#e2e8f0 !important" },
  "html[data-dark] .MuiDialogActions-root": { backgroundColor: "#1e293b !important" },
  "html[data-dark] .MuiDialog-paper .MuiDivider-root": { borderColor: "rgba(255,255,255,0.1) !important" },

  // Menus / Popover dropdowns
  "html[data-dark] .MuiMenu-paper, html[data-dark] .MuiPopover-paper": {
    backgroundColor: "#1e293b !important",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5) !important",
  },
  "html[data-dark] .MuiMenuItem-root": { color: "#e2e8f0 !important" },
  "html[data-dark] .MuiMenuItem-root:hover": { backgroundColor: "rgba(255,255,255,0.07) !important" },
  "html[data-dark] .MuiMenuItem-root.Mui-selected": { backgroundColor: "rgba(23,193,232,0.15) !important" },

  // Select
  "html[data-dark] .MuiSelect-icon": { color: "#94a3b8 !important" },

  // Inputs
  "html[data-dark] .MuiInputBase-root": {
    backgroundColor: "#2d3748 !important",
    color: "#e2e8f0 !important",
  },
  "html[data-dark] .MuiInputBase-input": { color: "#e2e8f0 !important" },
  "html[data-dark] .MuiInputBase-input::placeholder": { color: "#64748b !important", opacity: "1 !important" },
  "html[data-dark] .MuiOutlinedInput-notchedOutline": { borderColor: "#4a5568 !important" },
  "html[data-dark] .MuiInputBase-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#17c1e8 !important" },
  "html[data-dark] .MuiInputLabel-root": { color: "#94a3b8 !important" },
  "html[data-dark] .MuiInputLabel-root.Mui-focused": { color: "#17c1e8 !important" },
  "html[data-dark] .MuiInputAdornment-root .MuiSvgIcon-root": { color: "#64748b !important" },

  // Dividers
  "html[data-dark] .MuiDivider-root": { borderColor: "rgba(255,255,255,0.1) !important" },

  // Tabs
  "html[data-dark] .MuiTab-root:not(.Mui-selected)": { color: "#64748b !important" },
  "html[data-dark] .MuiTabs-root": { borderColor: "rgba(255,255,255,0.08) !important" },

  // Tooltip
  "html[data-dark] .MuiTooltip-tooltip": { backgroundColor: "#334155 !important" },

  // LinearProgress tracks
  "html[data-dark] .MuiLinearProgress-root": { backgroundColor: "#2d3748 !important" },

  // Breadcrumbs
  "html[data-dark] .MuiBreadcrumbs-root, html[data-dark] .MuiBreadcrumbs-root *": {
    color: "#94a3b8 !important",
  },

  // MUI Tables
  "html[data-dark] .MuiTableContainer-root": { backgroundColor: "#1e293b !important" },
  "html[data-dark] .MuiTableCell-root": {
    borderColor: "rgba(255,255,255,0.06) !important",
    color: "#e2e8f0 !important",
  },
  "html[data-dark] .MuiTableHead-root .MuiTableCell-root": { backgroundColor: "#151f32 !important" },

  // Badges background on Drawer (colored route icons keep their gradient)
  // Plain HTML tables used in layouts
  "html[data-dark] table thead tr": { background: "#151f32 !important" },
  "html[data-dark] table tbody tr": { background: "#1e293b !important", color: "#e2e8f0 !important" },
  "html[data-dark] table tbody tr:nth-of-type(even)": { background: "#1a2744 !important" },
  "html[data-dark] table tbody tr:hover": { background: "#243450 !important" },
  "html[data-dark] table td, html[data-dark] table th": {
    borderColor: "rgba(255,255,255,0.06) !important",
    color: "#e2e8f0 !important",
  },

  // Custom boxes with light backgrounds set via sx
  "html[data-dark] .MuiBox-root[style*='background: rgb(248, 249, 250)']":  { background: "#1a2744 !important" },
  "html[data-dark] .MuiBox-root[style*='background: #f8f9fa']": { background: "#1a2744 !important" },
  "html[data-dark] .MuiBox-root[style*='background: #f8f9fb']": { background: "#1a2744 !important" },
  "html[data-dark] .MuiBox-root[style*='background: rgb(248, 249, 251)']": { background: "#1a2744 !important" },

  // Scrollbar styling
  "html[data-dark] ::-webkit-scrollbar-track": { background: "#1e293b !important" },
  "html[data-dark] ::-webkit-scrollbar-thumb": { background: "#334155 !important", borderRadius: "4px" },
  "html[data-dark] ::-webkit-scrollbar-thumb:hover": { background: "#475569 !important" },

  // Badge backgrounds (keep colored — only fix the notification badge)
  // SoftTypography default text (dark.main = #344767) — override to light
  "html[data-dark] .MuiTypography-root.MuiTypography-button": { color: "#e2e8f0" },
  "html[data-dark] .MuiTypography-root.MuiTypography-caption": { color: "#94a3b8" },
  "html[data-dark] .MuiTypography-root.MuiTypography-body2":   { color: "#94a3b8" },
  "html[data-dark] .MuiTypography-root.MuiTypography-h4, html[data-dark] .MuiTypography-root.MuiTypography-h5, html[data-dark] .MuiTypography-root.MuiTypography-h6": {
    color: "#e2e8f0 !important",
  },

  // Checkbox, Switch
  "html[data-dark] .MuiCheckbox-root:not(.Mui-checked)": { color: "#4a5568 !important" },
};

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Toggle sidenav visibility
  const handleToggleSidenav = () => setMiniSidenav(dispatch, !miniSidenav);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const PUBLIC_ROUTES = ["/", "/authentication/sign-in", "/authentication/sign-up"];

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        const isPublic = PUBLIC_ROUTES.includes(route.route);
        return (
          <Route
            exact
            path={route.route}
            element={isPublic ? route.component : <PrivateRoute>{route.component}</PrivateRoute>}
            key={route.key}
          />
        );
      }

      return null;
    });

  // Owner dashboard: standalone shell — render outside the tenant Sidenav/theme wrappers
  if (pathname.startsWith("/owner")) {
    return (
      <OwnerAuthProvider>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/owner/login" element={<OwnerLogin />} />
            <Route path="/owner/dashboard"     element={<OwnerPrivateRoute><OwnerDashboard /></OwnerPrivateRoute>} />
            <Route path="/owner/tenants"       element={<OwnerPrivateRoute><OwnerTenants /></OwnerPrivateRoute>} />
            <Route path="/owner/plans"         element={<OwnerPrivateRoute><OwnerPlans /></OwnerPrivateRoute>} />
            <Route path="/owner/revenue"       element={<OwnerPrivateRoute><OwnerRevenue /></OwnerPrivateRoute>} />
            <Route path="/owner/notifications" element={<OwnerPrivateRoute><OwnerNotifications /></OwnerPrivateRoute>} />
            <Route path="/owner/support"       element={<OwnerPrivateRoute><OwnerSupport /></OwnerPrivateRoute>} />
            <Route path="/owner/*"             element={<Navigate to="/owner/login" />} />
          </Routes>
        </Suspense>
      </OwnerAuthProvider>
    );
  }

  const configsButton = (
    <SoftBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </SoftBox>
  );

  // Floating sidebar toggle button — only visible on xl screens
  const sidenavToggleButton = (
    <Tooltip title={miniSidenav ? "إظهار القائمة" : "إخفاء القائمة"} placement="right">
      <SoftBox
        display={{ xs: "none", xl: "flex" }}
        justifyContent="center"
        alignItems="center"
        width="2rem"
        height="2rem"
        bgColor="info"
        shadow="sm"
        borderRadius="50%"
        position="fixed"
        left={miniSidenav ? "0.5rem" : "15.2rem"}
        top="50%"
        zIndex={99}
        color="white"
        sx={{
          cursor: "pointer",
          transform: "translateX(0)",
          transition: "left 300ms ease, transform 220ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 220ms ease, background-color 220ms ease",
          willChange: "transform",
          border: "1px solid rgba(255,255,255,0.65)",
          "&:hover": {
            transform: "translateX(0.55rem)",
            backgroundColor: "#17c1e8",
            boxShadow: "0 8px 18px rgba(33, 150, 243, 0.32)",
          },
          "&:hover svg": {
            transform: "translateX(1px)",
          },
          "& svg": {
            transition: "transform 220ms ease",
          },
        }}
        onClick={handleToggleSidenav}
      >
        {direction === "rtl"
          ? (miniSidenav ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />)
          : (miniSidenav ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />)
        }
      </SoftBox>
    </Tooltip>
  );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={themeRTL}>
        <CssBaseline />
        <GlobalStyles styles={darkModeStyles} />
        {layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brandName="group allal"
              routes={routes}
            />
            <Configurator />
            {configsButton}
            {sidenavToggleButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            {getRoutes(routes)}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={darkModeStyles} />
      {layout === "dashboard" && (
        <>
          <Sidenav
            color={sidenavColor}
            brandName="group allal"
            routes={routes}
          />
          <Configurator />
          {configsButton}
          {sidenavToggleButton}
        </>
      )}
      {layout === "vr" && <Configurator />}
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
