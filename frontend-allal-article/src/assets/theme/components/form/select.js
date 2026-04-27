/**
=========================================================
* Soft UI Dashboard React - v3.1.0
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

// Soft UI Dashboard React base styles
import colors from "assets/theme/base/colors";

// Soft UI Dashboard React helper functions
import pxToRem from "assets/theme/functions/pxToRem";

const { transparent } = colors;

const select = {
  styleOverrides: {
    select: {
      display: "grid",
      alignItems: "center",
      width: "100% !important",
      padding: `0 ${pxToRem(12)} !important`,
      cursor: "pointer",

      "& .Mui-selected": {
        backgroundColor: transparent.main,
      },
    },

    selectMenu: {
      background: "none",
      height: "none",
      minHeight: "none",
      overflow: "unset",
    },

    icon: {
      display: "block",
      color: "#adb5bd",
      fontSize: pxToRem(18),
      top: "50%",
      transform: "translateY(-50%)",
      transition: "transform 200ms ease, color 200ms ease",
      pointerEvents: "none",

      "&.MuiSelect-iconOpen": {
        transform: "translateY(-50%) rotate(180deg)",
        color: "#17c1e8",
      },
    },
  },
};

export default select;
