/* eslint-disable react/prop-types */
/**
 * OwnerLayout — Standalone layout for the system-owner dashboard.
 * It uses the global i18n state, but keeps its own navigation shell.
 */
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";

import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import StarIcon from "@mui/icons-material/Star";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";

import { localizeNode, useI18n } from "i18n";
import { useOwnerAuth } from "context/OwnerAuthContext";

const NAV_ITEMS = [
  { label: "نظرة عامة",  icon: <DashboardIcon />,     path: "/owner/dashboard" },
  { label: "المشتركون",  icon: <PeopleIcon />,         path: "/owner/tenants" },
  { label: "الخطط",      icon: <StarIcon />,           path: "/owner/plans" },
  { label: "الإيرادات",  icon: <ReceiptIcon />,        path: "/owner/revenue" },
  { label: "الإشعارات",  icon: <NotificationsIcon />,  path: "/owner/notifications" },
  { label: "الدعم",      icon: <SupportAgentIcon />,   path: "/owner/support" },
];

const SIDEBAR_W = 220;
const SIDEBAR_MINI = 60;

export default function OwnerLayout({ children }) {
  const [mini, setMini] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { direction, languages, locale, setLocale, t } = useI18n();
  const { logout, owner } = useOwnerAuth();

  const isActive = (path) => pathname.startsWith(path);
  const isRtl = direction === "rtl";
  const sidebarSize = mini ? SIDEBAR_MINI : SIDEBAR_W;
  const openLanguageMenu = (event) => setLanguageAnchor(event.currentTarget);
  const closeLanguageMenu = () => setLanguageAnchor(null);

  return (
    <Box dir={direction} sx={{ display: "flex", minHeight: "100vh", background: "#f0f2f5", fontFamily: "Inter, Roboto, sans-serif" }}>

      {/* ── Sidebar ── */}
      <Box sx={{
        width: sidebarSize,
        flexShrink: 0,
        position: "fixed",
        top: 0,
        ...(isRtl ? { right: 0 } : { left: 0 }),
        bottom: 0,
        background: "linear-gradient(195deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
        display: "flex",
        flexDirection: "column",
        transition: "width 200ms ease",
        zIndex: 100,
        boxShadow: isRtl ? "-2px 0 16px rgba(0,0,0,0.25)" : "2px 0 16px rgba(0,0,0,0.25)",
      }}>

        {/* Logo */}
        <Box sx={{ px: mini ? 1 : 2.5, py: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: "10px", background: "linear-gradient(135deg, #17c1e8, #7928ca)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 18, color: "#fff" }} />
          </Box>
          {!mini && (
            <Box>
              <Box sx={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{t("Owner Panel")}</Box>
              <Box sx={{ color: "#8392ab", fontSize: 10 }}>{t("System Administration")}</Box>
            </Box>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 1 }} />

        {/* Nav items */}
        <Box sx={{ flex: 1, py: 1 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const label = t(item.label);
            return (
              <Tooltip key={item.path} title={mini ? label : ""} placement={isRtl ? "left" : "right"}>
                <Box
                  onClick={() => navigate(item.path)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: mini ? 1.5 : 2.5,
                    py: 1.2,
                    mx: 1,
                    my: 0.3,
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    boxShadow: active ? "0 2px 12px rgba(23,193,232,0.2)" : "none",
                    transition: "all 150ms ease",
                    "&:hover": { background: "rgba(255,255,255,0.08)" },
                  }}
                >
                  <Box sx={{ color: active ? "#17c1e8" : "#8392ab", display: "flex", flexShrink: 0 }}>
                      {item.icon}
                  </Box>
                  {!mini && (
                    <Box sx={{ color: active ? "#fff" : "#8392ab", fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                      {label}
                    </Box>
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mx: 1 }} />

        {/* Bottom: user info + toggle + logout */}
        <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>

          {/* Owner name */}
          {!mini && owner && (
            <Box sx={{ px: 1, py: 1, mb: 0.5, borderRadius: "8px", background: "rgba(255,255,255,0.06)" }}>
              <Box sx={{ color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {owner.name || owner.email}
              </Box>
              <Box sx={{ color: "#8392ab", fontSize: 10 }}>مالك المنصة</Box>
            </Box>
          )}

          <Tooltip title={mini ? t("Expand sidebar") : t("Collapse sidebar")} placement={isRtl ? "left" : "right"}>
            <IconButton size="small" onClick={() => setMini((p) => !p)} sx={{ color: "#8392ab", "&:hover": { color: "#fff" }, borderRadius: "8px" }}>
              {mini ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="تسجيل خروج" placement={isRtl ? "left" : "right"}>
            <IconButton
              size="small"
              onClick={() => { logout(); navigate("/owner/login"); }}
              sx={{ color: "#8392ab", "&:hover": { color: "#ea0606", background: "rgba(234,6,6,0.1)" }, borderRadius: "8px" }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ── Main Content ── */}
      <Box
        sx={{
          flex: 1,
          ...(isRtl ? { mr: `${sidebarSize}px` } : { ml: `${sidebarSize}px` }),
          transition: isRtl ? "margin-right 200ms ease" : "margin-left 200ms ease",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {localizeNode(children, t)}
      </Box>
    </Box>
  );
}
