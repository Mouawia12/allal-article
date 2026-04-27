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
import borders from "assets/theme/base/borders";
import typography from "assets/theme/base/typography";

// Soft UI Dashboard React helper functions
import pxToRem from "assets/theme/functions/pxToRem";

const { light, text, dark } = colors;
const { borderRadius } = borders;
const { size } = typography;

const menuItem = {
  styleOverrides: {
    root: {
      minWidth: pxToRem(140),
      minHeight: "unset",
      padding: `${pxToRem(8)} ${pxToRem(12)}`,
      borderRadius: pxToRem(8),
      fontSize: size.sm,
      color: text.main,
      transition: "background-color 150ms ease, color 150ms ease",
      margin: `0 0 ${pxToRem(2)} 0`,

      "&:hover, &:focus": {
        backgroundColor: "#f0f7ff",
        color: dark.main,
      },

      "&.Mui-selected": {
        backgroundColor: "#e8f4fd",
        color: "#17c1e8",
        fontWeight: 600,

        "&:hover, &:focus": {
          backgroundColor: "#d6eefb",
          color: "#0ea5c9",
        },
      },
    },
  },
};

export default menuItem;
