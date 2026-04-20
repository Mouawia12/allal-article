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

// react-router-dom components
import { Link } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Icon from "components/AppIcon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function normalizeBreadcrumbLabel(value) {
  if (typeof value === "string") {
    return value.replace(/-/g, " ");
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeBreadcrumbLabel(item)).filter(Boolean).join(" ");
  }

  return "";
}

function Breadcrumbs({ icon, title, route, light }) {
  const routeSegments = Array.isArray(route)
    ? route.filter((segment) => typeof segment === "string" || typeof segment === "number")
    : typeof route === "string"
      ? route.split("/").filter(Boolean)
      : [];
  const routes = routeSegments.slice(0, -1);
  const fallbackTitle = routeSegments.length > 0 ? routeSegments[routeSegments.length - 1] : "";
  const normalizedTitle = normalizeBreadcrumbLabel(title) || normalizeBreadcrumbLabel(fallbackTitle);

  return (
    <SoftBox mr={{ xs: 0, xl: 8 }}>
      <MuiBreadcrumbs
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: ({ palette: { white, grey } }) => (light ? white.main : grey[600]),
          },
        }}
      >
        <Link to="/">
          <SoftTypography
            component="span"
            variant="body2"
            color={light ? "white" : "dark"}
            opacity={light ? 0.8 : 0.5}
            sx={{ lineHeight: 0 }}
          >
            <Icon>{icon}</Icon>
          </SoftTypography>
        </Link>
        {routes.map((el) => (
          <Link to={`/${el}`} key={el}>
            <SoftTypography
              component="span"
              variant="button"
              fontWeight="regular"
              textTransform="capitalize"
              color={light ? "white" : "dark"}
              opacity={light ? 0.8 : 0.5}
              sx={{ lineHeight: 0 }}
            >
              {normalizeBreadcrumbLabel(el)}
            </SoftTypography>
          </Link>
        ))}
        <SoftTypography
          variant="button"
          fontWeight="regular"
          textTransform="capitalize"
          color={light ? "white" : "dark"}
          sx={{ lineHeight: 0 }}
        >
          {normalizedTitle}
        </SoftTypography>
      </MuiBreadcrumbs>
      <SoftTypography
        fontWeight="bold"
        textTransform="capitalize"
        variant="h6"
        color={light ? "white" : "dark"}
        noWrap
      >
        {normalizedTitle}
      </SoftTypography>
    </SoftBox>
  );
}

// Setting default values for the props of Breadcrumbs
Breadcrumbs.defaultProps = {
  light: false,
};

// Typechecking props for the Breadcrumbs
Breadcrumbs.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  route: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  light: PropTypes.bool,
};

export default Breadcrumbs;
