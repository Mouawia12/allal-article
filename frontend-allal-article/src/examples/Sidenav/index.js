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

import { useEffect, useState } from "react";

// react-router-dom components
import { useLocation, NavLink } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Icon from "components/AppIcon";
import TranslateIcon from "@mui/icons-material/Translate";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

// Soft UI Dashboard React examples
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";
import SidenavCard from "examples/Sidenav/SidenavCard";

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";
import sidenavLogoLabel from "examples/Sidenav/styles/sidenav";

// Soft UI Dashboard React context
import { useSoftUIController, setMiniSidenav } from "context";
import { useI18n } from "i18n";

function Sidenav({ color, brand, brandName, routes, ...rest }) {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentSidenav } = controller;
  const { locale, languages, setLocale, t } = useI18n();
  const [languageAnchor, setLanguageAnchor] = useState(null);
  const location = useLocation();
  const { pathname } = location;
  const collapseName = pathname.split("/").slice(1)[0];

  const closeSidenav = () => setMiniSidenav(dispatch, true);
  const openLanguageMenu = (event) => setLanguageAnchor(event.currentTarget);
  const closeLanguageMenu = () => setLanguageAnchor(null);

  useEffect(() => {
    // Only auto-close on small screens — never auto-open (respect user's choice)
    function handleMiniSidenav() {
      if (window.innerWidth < 1200) {
        setMiniSidenav(dispatch, true);
      }
    }

    window.addEventListener("resize", handleMiniSidenav);

    // On initial mount: close sidebar if on small screen
    handleMiniSidenav();

    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch]);

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = routes.map(({ type, name, icon, title, noCollapse, key, route, href }) => {
    let returnValue;

    if (type === "collapse") {
      returnValue = href ? (
        <Link
          href={href}
          key={key}
          target="_blank"
          rel="noreferrer"
          sx={{ textDecoration: "none" }}
        >
          <SidenavCollapse
            color={color}
            name={name}
            icon={icon}
            active={key === collapseName}
            noCollapse={noCollapse}
          />
        </Link>
      ) : (
        <NavLink to={route} key={key}>
          <SidenavCollapse
            color={color}
            key={key}
            name={name}
            icon={icon}
            active={key === collapseName}
            noCollapse={noCollapse}
          />
        </NavLink>
      );
    } else if (type === "title") {
      returnValue = (
        <SoftTypography
          key={key}
          display="block"
          variant="caption"
          fontWeight="bold"
          textTransform="uppercase"
          opacity={0.6}
          pl={3}
          mt={2}
          mb={1}
          ml={1}
        >
          {title}
        </SoftTypography>
      );
    } else if (type === "divider") {
      returnValue = <Divider key={key} />;
    }

    return returnValue;
  });

  return (
    <SidenavRoot {...rest} variant="permanent" ownerState={{ transparentSidenav, miniSidenav }}>
      <SoftBox pt={3} pb={1} px={4} textAlign="center">
        <SoftBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <SoftTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </SoftTypography>
        </SoftBox>
        <SoftBox component={NavLink} to="/" display="flex" alignItems="center">
          {brand && <SoftBox component="img" src={brand} alt="Soft UI Logo" width="2rem" />}
          <SoftBox
            width={!brandName && "100%"}
            sx={(theme) => sidenavLogoLabel(theme, { miniSidenav })}
          >
            <SoftTypography component="h6" variant="button" fontWeight="medium">
              {brandName}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </SoftBox>
      <Divider />
      <List>{renderRoutes}</List>
      <SoftBox pt={2} my={2} mx={2} mt="auto">
        {!miniSidenav && (
          <SoftBox mb={2} display="flex" justifyContent="center">
            <IconButton
              size="small"
              aria-label={t("language.switcher")}
              onClick={openLanguageMenu}
              sx={{
                width: 38,
                height: 38,
                background: "#fff",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                "&:hover": { background: "#f8f9fa" },
              }}
            >
              <TranslateIcon sx={{ fontSize: 18, color: "#8392ab" }} />
            </IconButton>
            <Menu
              anchorEl={languageAnchor}
              open={Boolean(languageAnchor)}
              onClose={closeLanguageMenu}
              anchorOrigin={{ vertical: "top", horizontal: "center" }}
              transformOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
              {languages.map((language) => (
                <MenuItem
                  key={language.code}
                  selected={locale === language.code}
                  onClick={() => {
                    setLocale(language.code);
                    closeLanguageMenu();
                  }}
                >
                  {language.label}
                </MenuItem>
              ))}
            </Menu>
          </SoftBox>
        )}
        <SidenavCard />
        <SoftBox mt={2}>
          <SoftButton
            component="a"
            href="https://creative-tim.com/product/soft-ui-dashboard-pro-react"
            target="_blank"
            rel="noreferrer"
            variant="gradient"
            color={color}
            fullWidth
          >
            upgrade to pro
          </SoftButton>
        </SoftBox>
      </SoftBox>
    </SidenavRoot>
  );
}

// Setting default values for the props of Sidenav
Sidenav.defaultProps = {
  color: "info",
  brand: "",
};

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
