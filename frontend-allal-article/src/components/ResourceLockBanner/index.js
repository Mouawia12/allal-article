/* eslint-disable react/prop-types */
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import LockClockIcon from "@mui/icons-material/LockClock";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

export default function ResourceLockBanner({ lock, resourceLabel }) {
  if (!lock) return null;

  return (
    <Alert
      severity="warning"
      icon={<LockClockIcon />}
      sx={{
        mb: 2,
        alignItems: "flex-start",
        "& .MuiAlert-message": { width: "100%" },
      }}
    >
      <SoftBox display="flex" justifyContent="space-between" gap={2} flexWrap="wrap">
        <SoftBox minWidth={260} flex={1}>
          <SoftTypography variant="button" fontWeight="bold" display="block">
            {resourceLabel || lock.resourceLabel} قيد العمل من مستخدم آخر
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block">
            {lock.message}
          </SoftTypography>
          <SoftBox display="flex" gap={1} flexWrap="wrap" mt={1}>
            <Chip size="small" label={`المستخدم: ${lock.lockedByName}`} sx={{ height: 22, fontSize: 10 }} />
            <Chip size="small" label={`الدور: ${lock.lockedByRole}`} sx={{ height: 22, fontSize: 10 }} />
            <Chip size="small" label={`آخر نشاط: ${lock.heartbeatAt}`} sx={{ height: 22, fontSize: 10 }} />
            <Chip size="small" label={`ينتهي خلال: ${lock.expiresIn}`} sx={{ height: 22, fontSize: 10 }} />
          </SoftBox>
          <SoftTypography variant="caption" color="secondary" display="block" mt={1}>
            الأفعال الموقوفة: {lock.blockedActions.join("، ")}
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" alignItems="flex-start" gap={1} flexWrap="wrap">
          <SoftButton variant="outlined" color="secondary" size="small" startIcon={<RefreshIcon />}>
            تحديث الحالة
          </SoftButton>
          {lock.canTakeOver && (
            <SoftButton variant="outlined" color="warning" size="small" startIcon={<AdminPanelSettingsIcon />}>
              طلب التولي
            </SoftButton>
          )}
        </SoftBox>
      </SoftBox>
    </Alert>
  );
}
