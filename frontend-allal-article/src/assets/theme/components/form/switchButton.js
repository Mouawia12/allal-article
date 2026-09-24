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
import linearGradient from "assets/theme/functions/linearGradient";

const { white, gradients, info } = colors;

// ─── Palette ──────────────────────────────────────────────────────────────────
// الحالة المفعّلة تستعمل تدرّج العلامة نفسه في الوضعين النهاري والليلي
const trackOn = linearGradient(gradients.info.main, gradients.info.state);

// تدرّجات الحالة المفعّلة حسب خاصية color — الافتراضي هو تدرّج العلامة
const trackOnByColor = {
  colorSuccess: linearGradient(gradients.success.main, gradients.success.state),
  colorWarning: linearGradient(gradients.warning.main, gradients.warning.state),
  colorError: linearGradient(gradients.error.main, gradients.error.state),
  colorSecondary: linearGradient(gradients.secondary.main, gradients.secondary.state),
};

const light = {
  trackOff: "#dde3ec",
  thumbOff: white.main,
  thumbOn: white.main,
  thumbShadow: "0 2px 5px rgba(15, 23, 42, 0.28), 0 0 0 1px rgba(15, 23, 42, 0.04)",
};

const dark = {
  trackOff: "#3b475c",
  thumbOff: "#e2e8f0",
  thumbOn: white.main,
  thumbShadow: "0 2px 5px rgba(0, 0, 0, 0.45)",
};

const focusRing = `0 0 0 ${pxToRem(3)} ${info.main}59`;

// حركة انزلاق واحدة لكل العناصر حتى لا يتشوّه الزر أثناء انتقاله للطرف الآخر
const slide = "transform 260ms cubic-bezier(0.34, 1.2, 0.64, 1)";

/**
 * كل القواعد متداخلة داخل `root` عن قصد.
 * MUI يعرّف أنماط الحجم (sizeSmall) متداخلة داخل الـ root أيضاً، فلو كتبنا
 * `transform` الخاص بحالة التفعيل في شريحة `switchBase` لكانت أولويته أقل
 * فيطغى عليه transform الافتراضي ويفقد التوسيط العمودي للزر.
 */
const switchButton = {
  defaultProps: {
    disableRipple: true,
    disableFocusRipple: true,
  },

  styleOverrides: {
    root: {
      width: pxToRem(44),
      height: pxToRem(24),
      margin: `${pxToRem(4)} 0`,
      padding: 0,
      borderRadius: pxToRem(160),
      overflow: "visible",
      flexShrink: 0,

      "& .MuiSwitch-switchBase": {
        top: 0,
        padding: pxToRem(3),
        color: "transparent",
        transition: slide,

        "&:hover, &.Mui-checked:hover": {
          backgroundColor: "transparent",
        },

        "&.Mui-checked": {
          transform: `translateX(${pxToRem(20)})`,

          "& .MuiSwitch-thumb": {
            backgroundColor: light.thumbOn,
          },

          "& + .MuiSwitch-track": {
            backgroundColor: "transparent",
            backgroundImage: trackOn,
            borderColor: "transparent",
            opacity: 1,
          },
        },

        "&.Mui-focusVisible .MuiSwitch-thumb": {
          boxShadow: `${light.thumbShadow}, ${focusRing}`,
        },

        "&.Mui-disabled": {
          opacity: 0.45,

          "& + .MuiSwitch-track": {
            opacity: "1 !important",
          },
        },

        "&:active:not(.Mui-disabled) .MuiSwitch-thumb": {
          transform: "scale(0.92)",
        },
      },

      "& .MuiSwitch-thumb": {
        width: pxToRem(18),
        height: pxToRem(18),
        borderRadius: "50%",
        backgroundColor: light.thumbOff,
        backgroundImage: "none",
        boxShadow: light.thumbShadow,
        transition: "background-color 220ms ease, box-shadow 220ms ease, transform 140ms ease",
      },

      "& .MuiSwitch-track": {
        backgroundColor: light.trackOff,
        backgroundImage: "none",
        border: "none",
        borderRadius: pxToRem(160),
        opacity: 1,
        transition: "background-color 260ms ease, background-image 260ms ease, filter 200ms ease",
      },

      "&:hover .MuiSwitch-track": {
        filter: "brightness(0.96)",
      },

      // ─── ألوان أخرى عبر خاصية color ──────────────────────────────────────
      ...Object.entries(trackOnByColor).reduce(
        (acc, [colorClass, gradient]) => ({
          ...acc,
          [`& .MuiSwitch-switchBase.MuiSwitch-${colorClass}.Mui-checked + .MuiSwitch-track`]: {
            backgroundImage: gradient,
          },
        }),
        {}
      ),

      // ─── الحجم الصغير ──────────────────────────────────────────────────────
      "&.MuiSwitch-sizeSmall": {
        width: pxToRem(36),
        height: pxToRem(20),

        "& .MuiSwitch-switchBase": {
          padding: pxToRem(3),

          "&.Mui-checked": {
            transform: `translateX(${pxToRem(16)})`,
          },
        },

        "& .MuiSwitch-thumb": {
          width: pxToRem(14),
          height: pxToRem(14),
        },
      },

      // ─── الوضع الليلي ─────────────────────────────────────────────────────
      // `html[data-dark]` للوحات التحكم، و`.on-dark` للصفحات التي تدير وضعها محلياً
      "html[data-dark] &, &.on-dark": {
        "& .MuiSwitch-track": {
          backgroundColor: dark.trackOff,
        },

        "& .MuiSwitch-thumb": {
          backgroundColor: dark.thumbOff,
          boxShadow: dark.thumbShadow,
        },

        "& .MuiSwitch-switchBase": {
          "&.Mui-checked .MuiSwitch-thumb": {
            backgroundColor: dark.thumbOn,
          },

          "&.Mui-focusVisible .MuiSwitch-thumb": {
            boxShadow: `${dark.thumbShadow}, ${focusRing}`,
          },
        },

        "&:hover .MuiSwitch-track": {
          filter: "brightness(1.18)",
        },
      },
    },
  },
};

export default switchButton;
