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

import { useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
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

// Owner dashboard shell
import OwnerDashboard from "layouts/owner/dashboard";
import OwnerTenants  from "layouts/owner/tenants";
import OwnerPlans    from "layouts/owner/plans";
import OwnerRevenue  from "layouts/owner/revenue";
import OwnerNotifications from "layouts/owner/notifications";
import OwnerSupport from "layouts/owner/support";

// Soft UI Dashboard React contexts
import { useSoftUIController, setMiniSidenav, setOpenConfigurator } from "context";
import { useI18n } from "i18n";

// Images
import brand from "assets/images/logo-ct.png";

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const { t } = useI18n();
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

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  // Owner dashboard: standalone shell — render outside the tenant Sidenav/theme wrappers
  if (pathname.startsWith("/owner")) {
    return (
      <Routes>
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/tenants"   element={<OwnerTenants />} />
        <Route path="/owner/plans"     element={<OwnerPlans />} />
        <Route path="/owner/revenue"   element={<OwnerRevenue />} />
        <Route path="/owner/notifications" element={<OwnerNotifications />} />
        <Route path="/owner/support" element={<OwnerSupport />} />
        <Route path="/owner/*"         element={<Navigate to="/owner/dashboard" />} />
      </Routes>
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
        bgColor="white"
        shadow="sm"
        borderRadius="50%"
        position="fixed"
        left={miniSidenav ? "0.5rem" : "15.2rem"}
        top="50%"
        zIndex={99}
        color="dark"
        sx={{
          cursor: "pointer",
          transition: "left 300ms ease",
          border: "1px solid #e9ecef",
          "&:hover": { bgColor: "#f0f7ff", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
        }}
        onClick={handleToggleSidenav}
      >
        {miniSidenav
          ? <ChevronRightIcon fontSize="small" />
          : <ChevronLeftIcon fontSize="small" />
        }
      </SoftBox>
    </Tooltip>
  );

  return direction === "rtl" ? (
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={themeRTL}>
        <CssBaseline />
        {layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={brand}
              brandName={t("app.name")}
              routes={routes}
            />
            <Configurator />
            {configsButton}
            {sidenavToggleButton}
          </>
        )}
        {layout === "vr" && <Configurator />}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </ThemeProvider>
    </CacheProvider>
  ) : (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {layout === "dashboard" && (
        <>
            <Sidenav
              color={sidenavColor}
              brand={brand}
              brandName={t("app.name")}
              routes={routes}
          />
          <Configurator />
          {configsButton}
          {sidenavToggleButton}
        </>
      )}
      {layout === "vr" && <Configurator />}
      <Routes>
        {getRoutes(routes)}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </ThemeProvider>
  );
}
