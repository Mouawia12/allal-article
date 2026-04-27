/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import SaveIcon from "@mui/icons-material/Save";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { classificationLabels } from "./mockData";
import { accountingApi } from "services";

const accountSettingsDefs = [];

// Group settings by group key
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const g = item[key];
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});
}

export default function AccountingSettings() {
  const [postableAccounts, setPostableAccounts] = useState([]);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    accountingApi.listAccounts()
      .then((r) => {
        const all = r.data?.content ?? r.data ?? [];
        setPostableAccounts(all.filter((a) => a.isPostable !== false && a.isActive !== false));
      })
      .catch(console.error);
  }, []);

  const grouped = groupBy(accountSettingsDefs, "group");
  const missing = accountSettingsDefs.filter((s) => !settings[s.key]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">إعدادات ربط الحسابات</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              تحديد الحسابات التلقائية لكل عملية محاسبية
            </SoftTypography>
          </SoftBox>
          <SoftButton variant="gradient" color="info" size="small">
            <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> حفظ الإعدادات
          </SoftButton>
        </SoftBox>

        {/* Warning if any setting is missing */}
        {missing.length > 0 && (
          <SoftBox mb={2} p={1.5} sx={{ background: "#fff3e0", border: "1px solid #fb8c0044", borderRadius: 2, display: "flex", gap: 1, alignItems: "flex-start" }}>
            <WarningAmberIcon sx={{ color: "#fb8c00", fontSize: 20, mt: 0.1 }} />
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="bold" sx={{ color: "#fb8c00" }}>
                {missing.length} إعدادات غير مكتملة — ستمنع العمليات التلقائية
              </SoftTypography>
              <SoftTypography variant="caption" color="secondary" display="block">
                {missing.map((s) => s.label).join("، ")}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
        )}

        {Object.entries(grouped).map(([group, items]) => (
          <Card key={group} sx={{ mb: 2 }}>
            <SoftBox px={2.5} py={1.5} borderBottom="1px solid #eee">
              <SoftTypography variant="button" fontWeight="bold">{group}</SoftTypography>
            </SoftBox>
            <SoftBox p={2.5}>
              {items.map((setting, idx) => {
                const selectedAccId = settings[setting.key];
                const selectedAcc = postableAccounts.find((a) => a.id === selectedAccId) ?? null;
                const cls = selectedAcc ? classificationLabels[selectedAcc.classification] : null;

                return (
                  <SoftBox key={setting.key}>
                    <SoftBox display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={1.5}>
                      <SoftBox sx={{ minWidth: 200 }}>
                        <SoftTypography variant="caption" fontWeight="medium">{setting.label}</SoftTypography>
                      </SoftBox>
                      <SoftBox flex={1} minWidth={260}>
                        <Autocomplete
                          size="small"
                          options={postableAccounts}
                          value={selectedAcc}
                          onChange={(_, v) => setSettings((p) => ({ ...p, [setting.key]: v?.id ?? null }))}
                          getOptionLabel={(o) => `${o.code} — ${o.nameAr}`}
                          filterOptions={(opts, { inputValue: q }) =>
                            opts.filter((o) => o.nameAr.includes(q) || o.code.includes(q))
                          }
                          renderOption={(props, option) => {
                            const c = classificationLabels[option.classification];
                            return (
                              <li {...props} key={option.id}>
                                <SoftBox display="flex" alignItems="center" gap={1}>
                                  <Chip label={c?.label} size="small" sx={{ background: c?.bg, color: c?.color, fontSize: 9, height: 18 }} />
                                  <SoftTypography variant="caption" fontWeight="medium">{option.code}</SoftTypography>
                                  <SoftTypography variant="caption" color="secondary">{option.nameAr}</SoftTypography>
                                </SoftBox>
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField {...params} placeholder="اختر الحساب..."
                              error={!selectedAccId}
                              helperText={!selectedAccId ? "مطلوب" : ""}
                              sx={{ "& .MuiOutlinedInput-root": { fontSize: 12, borderRadius: 1.5 } }}
                            />
                          )}
                          noOptionsText="لا نتائج"
                        />
                      </SoftBox>
                      {selectedAcc && cls && (
                        <Chip label={cls.label} size="small" sx={{ background: cls.bg, color: cls.color, fontWeight: 600 }} />
                      )}
                    </SoftBox>
                    {idx < items.length - 1 && <Divider sx={{ mb: 1.5 }} />}
                  </SoftBox>
                );
              })}
            </SoftBox>
          </Card>
        ))}

        <SoftBox p={2} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
          <SoftTypography variant="caption" color="secondary">
            هذه الإعدادات تُستخدم في التوليد التلقائي للقيود: البيع → مدين ذمم العملاء / دائن إيرادات المبيعات.
            إذا كان حساب ناقص، سيظهر خطأ واضح عند محاولة تنفيذ العملية المرتبطة به.
          </SoftTypography>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
