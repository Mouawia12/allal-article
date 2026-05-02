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

import { useState, useEffect } from "react";

// react-router components
import { useLocation, Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @material-ui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Badge from "@mui/material/Badge";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Icon from "components/AppIcon";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

// Soft UI Dashboard React examples
import Breadcrumbs from "examples/Breadcrumbs";
import NotificationItem from "examples/Items/NotificationItem";

// Custom styles for DashboardNavbar
import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

// Soft UI Dashboard React context
import {
  useSoftUIController,
  setTransparentNavbar,
  setMiniSidenav,
  setOpenConfigurator,
} from "context";
import { useDarkMode } from "context/DarkModeContext";
import { useAuth } from "context/AuthContext";
import { useI18n } from "i18n";
import apiClient from "services/apiClient";

function notificationIcon(category) {
  return ({
    products: "inventory_2",
    inventory: "warehouse",
    orders: "shopping_cart",
    payments: "payment",
    accounting: "paid",
  })[category] || "notifications";
}

function notificationColor(severity) {
  if (severity === "critical") return "error";
  if (severity === "action_required") return "warning";
  if (severity === "success") return "success";
  return "info";
}

function DashboardNavbar({ absolute, light, isMini }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentNavbar, fixedNavbar, openConfigurator } = controller;
  const [openMenu, setOpenMenu] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState(null);
  const [notificationPreview, setNotificationPreview] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const { locale, languages, setLocale, t } = useI18n();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { isAuthenticated, logout } = useAuth();
  const { pathname } = useLocation();
  const route = pathname.split("/").slice(1);
  const favoritesActive = pathname === "/products/favorites";

  useEffect(() => {
    // Setting the navbar type
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    // A function that sets the transparent state of the navbar.
    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    /** 
     The event listener that's calling the handleTransparentNavbar function when 
     scrolling the window.
    */
    window.addEventListener("scroll", handleTransparentNavbar);

    // Call the handleTransparentNavbar function to set the state with the initial value.
    handleTransparentNavbar();

    // Remove event listener on cleanup
    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);
  const refreshNotifications = () => {
    if (!isAuthenticated) {
      setNotificationPreview([]);
      setUnreadCount(0);
      return;
    }
    setNotificationsLoading(true);
    apiClient.get("/api/notifications", { params: { filter: "unread", page: 0, size: 5 } })
      .then((r) => {
        const data = r.data || {};
        setNotificationPreview(Array.isArray(data.content) ? data.content : []);
        setUnreadCount(Number(data.totalElements ?? data.stats?.unread ?? 0));
      })
      .catch(() => {
        setNotificationPreview([]);
        setUnreadCount(0);
      })
      .finally(() => setNotificationsLoading(false));
  };

  useEffect(() => {
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 30000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, pathname]);

  const handleOpenMenu = (event) => {
    setOpenMenu(event.currentTarget);
    refreshNotifications();
  };
  const handleCloseMenu = () => setOpenMenu(false);
  const handleOpenLanguageMenu = (event) => setLanguageMenuAnchor(event.currentTarget);
  const handleCloseLanguageMenu = () => setLanguageMenuAnchor(null);
  const accountActionLabel = isAuthenticated ? "تسجيل الخروج" : "تسجيل الدخول";
  const accountActionIcon = isAuthenticated ? "logout" : "account_circle";

  // Render the notifications menu
  const renderMenu = () => (
    <Menu
      anchorEl={openMenu}
      anchorReference={null}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      open={Boolean(openMenu)}
      onClose={handleCloseMenu}
      sx={{ mt: 2, "& .MuiPaper-root": { width: 340, maxWidth: "calc(100vw - 32px)" } }}
    >
      {notificationsLoading && (
        <MenuItem disabled>
          <SoftTypography variant="caption" color="secondary" fontWeight="bold">
            جارٍ تحميل الإشعارات...
          </SoftTypography>
        </MenuItem>
      )}
      {!notificationsLoading && notificationPreview.length === 0 && (
        <MenuItem disabled>
          <SoftTypography variant="caption" color="secondary" fontWeight="bold">
            لا توجد إشعارات جديدة
          </SoftTypography>
        </MenuItem>
      )}
      {!notificationsLoading && notificationPreview.map((item) => (
        <NotificationItem
          key={item.id}
          component={Link}
          to={item.actionUrl || "/notifications"}
          onClick={handleCloseMenu}
          color={notificationColor(item.severity)}
          image={<Icon fontSize="small">{notificationIcon(item.category)}</Icon>}
          title={[item.title || "إشعار", item.body ? ` — ${item.body}` : ""]}
          date={item.createdAt || ""}
        />
      ))}
      {unreadCount > notificationPreview.length && (
        <MenuItem disabled>
          <SoftTypography variant="caption" color="secondary">
            +{unreadCount - notificationPreview.length} إشعارات أخرى غير مقروءة
          </SoftTypography>
        </MenuItem>
      )}
      <Divider sx={{ my: 0.5 }} />
      <MenuItem component={Link} to="/notifications" onClick={handleCloseMenu}>
        <SoftTypography variant="button" color="info" fontWeight="bold">
          عرض كل الإشعارات
        </SoftTypography>
      </MenuItem>
      <MenuItem onClick={() => { refreshNotifications(); }}>
        <SoftTypography variant="caption" color="secondary" fontWeight="bold">
          تحديث
        </SoftTypography>
      </MenuItem>
    </Menu>
  );

  const renderLanguageMenu = () => (
    <Menu
      anchorEl={languageMenuAnchor}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left",
      }}
      open={Boolean(languageMenuAnchor)}
      onClose={handleCloseLanguageMenu}
      sx={{ mt: 2 }}
    >
      <MenuItem disabled>
        <SoftTypography variant="caption" color="secondary">
          {t("language.current")}
        </SoftTypography>
      </MenuItem>
      {languages.map((language) => (
        <MenuItem
          key={language.code}
          selected={locale === language.code}
          onClick={() => {
            setLocale(language.code);
            handleCloseLanguageMenu();
          }}
        >
          <SoftTypography variant="button" fontWeight={locale === language.code ? "bold" : "regular"}>
            {language.label}
          </SoftTypography>
        </MenuItem>
      ))}
    </Menu>
  );

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <SoftBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          <Breadcrumbs icon="home" title={route[route.length - 1]} route={route} light={light} />
        </SoftBox>
        {isMini ? null : (
          <SoftBox sx={(theme) => navbarRow(theme, { isMini })}>
            <SoftBox pr={1}>
              <SoftInput
                placeholder="Type here..."
                icon={{ component: "search", direction: "left" }}
              />
            </SoftBox>
            <SoftBox color={light ? "white" : "inherit"}>
              <IconButton
                component={isAuthenticated ? "button" : Link}
                to={isAuthenticated ? undefined : "/authentication/sign-in"}
                onClick={isAuthenticated ? logout : undefined}
                sx={navbarIconButton}
                size="small"
                aria-label={accountActionLabel}
              >
                <Icon
                  sx={({ palette: { dark, white } }) => ({
                    color: light ? white.main : dark.main,
                  })}
                >
                  {accountActionIcon}
                </Icon>
                <SoftTypography
                  variant="button"
                  fontWeight="medium"
                  color={light ? "white" : "dark"}
                >
                  {accountActionLabel}
                </SoftTypography>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon className={light ? "text-white" : "text-dark"}>
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                onClick={handleConfiguratorOpen}
              >
                <Icon>settings</Icon>
              </IconButton>
              <Tooltip title="مفضلة الأصناف">
                <IconButton
                  component={Link}
                  to="/products/favorites"
                  size="small"
                  color="inherit"
                  sx={navbarIconButton}
                  aria-label="مفضلة الأصناف"
                >
                  <Icon
                    sx={({ palette: { dark, warning, white } }) => ({
                      color: favoritesActive ? warning.main : light ? white.main : dark.main,
                    })}
                  >
                    favorite
                  </Icon>
                </IconButton>
              </Tooltip>
              <Tooltip title={darkMode ? "الوضع المضيء" : "الوضع الليلي"}>
                <IconButton
                  size="small"
                  color="inherit"
                  sx={navbarIconButton}
                  onClick={toggleDarkMode}
                  aria-label={darkMode ? "الوضع المضيء" : "الوضع الليلي"}
                >
                  {darkMode ? (
                    <LightModeIcon
                      sx={{ fontSize: "1.25rem !important", color: "#fbcf33", transition: "color 0.2s" }}
                    />
                  ) : (
                    <DarkModeIcon
                      sx={({ palette: { dark: d, white: w } }) => ({
                        fontSize: "1.25rem !important",
                        color: light ? w.main : d.main,
                        transition: "color 0.2s",
                      })}
                    />
                  )}
                </IconButton>
              </Tooltip>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                aria-label={t("language.switcher")}
                onClick={handleOpenLanguageMenu}
              >
                <Icon>translate</Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarIconButton}
                aria-controls="notification-menu"
                aria-haspopup="true"
                variant="contained"
                onClick={handleOpenMenu}
              >
                <Badge badgeContent={unreadCount} color="error" overlap="circular">
                  <Icon className={light ? "text-white" : "text-dark"}>notifications</Icon>
                </Badge>
              </IconButton>
              {renderLanguageMenu()}
              {renderMenu()}
            </SoftBox>
          </SoftBox>
        )}
      </Toolbar>
    </AppBar>
  );
}

// Setting default values for the props of DashboardNavbar
DashboardNavbar.defaultProps = {
  absolute: false,
  light: false,
  isMini: false,
};

// Typechecking props for the DashboardNavbar
DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
