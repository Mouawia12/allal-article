/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
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
import { getApiErrorMessage } from "utils/formErrors";

const groupLabels = {
  sales: "المبيعات",
  purchases: "المشتريات",
  inventory: "المخزون",
  cash_bank: "الصندوق والبنك",
  tax: "الضرائب",
};

const mapSettingDef = (setting) => ({
  key: setting.key,
  label: setting.label,
  group: groupLabels[setting.group] ?? setting.group ?? "إعدادات عامة",
  required: setting.required !== false,
});

// ─── Auto-generation rules ────────────────────────────────────────────────────
const RULES = [
  {
    key: "sale_confirmed",
    label: "تأكيد البيع",
    description: "يُولَّد عند تأكيد طلبية بيع",
    lines: [
      { side: "debit",  source: "customers_control", amount: "order_total",  subledger: "customer_id",  desc: "ذمة الزبون" },
      { side: "credit", source: "sales_revenue",     amount: "order_total",  subledger: null,            desc: "إيراد البيع" },
    ],
  },
  {
    key: "sale_shipped",
    label: "شحن البضاعة",
    description: "يُولَّد عند تسجيل الشحن — تكلفة البضاعة",
    lines: [
      { side: "debit",  source: "cogs",      amount: "shipped_cost",  subledger: null, desc: "تكلفة بضاعة مباعة" },
      { side: "credit", source: "inventory", amount: "shipped_cost",  subledger: null, desc: "خروج مخزون" },
    ],
  },
  {
    key: "customer_payment",
    label: "دفعة من زبون",
    description: "يُولَّد عند تسجيل دفعة زبون",
    lines: [
      { side: "debit",  source: "cash",              amount: "payment_amount", subledger: null,          desc: "وصول نقدية" },
      { side: "credit", source: "customers_control", amount: "payment_amount", subledger: "customer_id", desc: "تخفيض ذمة الزبون" },
    ],
  },
  {
    key: "purchase_received",
    label: "استلام مشتريات",
    description: "يُولَّد عند استلام فاتورة شراء",
    lines: [
      { side: "debit",  source: "inventory",         amount: "purchase_amount", subledger: null,          desc: "دخول مخزون" },
      { side: "credit", source: "suppliers_control", amount: "purchase_amount", subledger: "supplier_id", desc: "ذمة المورد" },
    ],
  },
  {
    key: "supplier_payment",
    label: "دفع لمورد",
    description: "يُولَّد عند تسجيل دفعة لمورد",
    lines: [
      { side: "debit",  source: "suppliers_control", amount: "payment_amount", subledger: "supplier_id", desc: "تخفيض ذمة المورد" },
      { side: "credit", source: "bank",              amount: "payment_amount", subledger: null,           desc: "خروج بنك" },
    ],
  },
  {
    key: "return_received",
    label: "استلام مرتجع بيع",
    description: "يُولَّد عند تسجيل مرتجع من زبون",
    lines: [
      { side: "debit",  source: "sales_return",      amount: "return_amount",  subledger: null,           desc: "مردودات بيع" },
      { side: "credit", source: "customers_control", amount: "return_amount",  subledger: "customer_id",  desc: "إشعار دائن للزبون" },
    ],
  },
  {
    key: "stock_adjustment",
    label: "تسوية مخزون",
    description: "يُولَّد عند تسوية فروقات الجرد",
    lines: [
      { side: "debit",  source: "inventory", amount: "adj_amount", subledger: null, desc: "تسوية +" },
      { side: "credit", source: "cogs",      amount: "adj_amount", subledger: null, desc: "فروقات جرد" },
    ],
  },
];

const sourceLabels = {
  customers_control: "ذمم العملاء",
  suppliers_control: "ذمم الموردين",
  sales_revenue:     "إيرادات المبيعات",
  sales_return:      "مردودات المبيعات",
  cogs:              "تكلفة البضاعة",
  inventory:         "المخزون",
  cash:              "الصندوق",
  bank:              "البنك",
  tax_payable:       "الضريبة المحصلة",
  retained_earnings: "الأرباح المرحلة",
};

function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const g = item[key];
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {});
}

export default function AccountLinks() {
  const [tab, setTab] = useState(0);
  const [postableAccounts, setPostableAccounts] = useState([]);
  const [settingDefs, setSettingDefs] = useState([]);
  const [settings, setSettings] = useState({});
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPageError("");
    accountingApi.listAccounts()
      .then((r) => {
        const all = r.data?.content ?? r.data ?? [];
        setPostableAccounts(all.filter((a) => a.isPostable !== false && a.isActive !== false));
      })
      .catch((error) => {
        setPageError(getApiErrorMessage(error, "تعذر تحميل الحسابات"));
        setPostableAccounts([]);
      });
    accountingApi.listAccountingSettings()
      .then((r) => {
        const defs = r.data ?? [];
        setSettingDefs(defs.map(mapSettingDef));
        setSettings(Object.fromEntries(defs.map((s) => [s.key, s.accountId ?? null])));
      })
      .catch((error) => {
        setPageError((current) => {
          const message = getApiErrorMessage(error, "تعذر تحميل إعدادات الربط");
          return current ? `${current}؛ ${message}` : message;
        });
        setSettingDefs([]);
      });
  }, []);

  const getAccountName = (id) => {
    const a = postableAccounts.find((x) => x.id === id);
    return a ? `${a.code} — ${a.nameAr}` : "—";
  };

  const grouped = groupBy(settingDefs, "group");
  const missing = settingDefs.filter((s) => s.required && !settings[s.key]);
  const allOk = missing.length === 0;

  const saveSettings = async () => {
    setSaving(true);
    setPageError("");
    try {
      await accountingApi.updateAccountingSettings(settings);
    } catch (error) {
      setPageError(getApiErrorMessage(error, "تعذر حفظ ربط الحسابات"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">ربط الحسابات والقواعد التلقائية</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              تحديد الحسابات الافتراضية وقواعد توليد القيود التلقائية
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            {allOk
              ? <Chip icon={<CheckCircleOutlineIcon />} label="جميع الإعدادات مكتملة" color="success" size="small" />
              : <Chip icon={<WarningAmberIcon />} label={`${missing.length} إعدادات ناقصة`} color="warning" size="small" />
            }
            <SoftButton variant="gradient" color="info" size="small" disabled={saving} onClick={saveSettings}>
              <SaveIcon sx={{ mr: 0.5, fontSize: 16 }} /> {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
            </SoftButton>
          </SoftBox>
        </SoftBox>

        {pageError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError("")}>
            {pageError}
          </Alert>
        )}

        <SoftBox sx={{ borderBottom: "1px solid #e9ecef", mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="الحسابات الافتراضية" sx={{ fontSize: "0.8rem" }} />
            <Tab label="قواعد التوليد التلقائي" sx={{ fontSize: "0.8rem" }} />
          </Tabs>
        </SoftBox>

        {/* Tab 0: Default accounts */}
        {tab === 0 && (
          <>
            {missing.length > 0 && (
              <SoftBox mb={2} p={1.5} sx={{ background: "#fff3e0", border: "1px solid #fb8c0044", borderRadius: 2 }}>
                <SoftTypography variant="caption" sx={{ color: "#fb8c00" }}>
                  <WarningAmberIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                  {missing.length} حسابات غير محددة: {missing.map((s) => s.label).join("، ")}
                </SoftTypography>
              </SoftBox>
            )}
            {Object.entries(grouped).map(([group, items]) => (
              <Card key={group} sx={{ mb: 2 }}>
                <SoftBox px={2} py={1.5} sx={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                  <SoftTypography variant="caption" fontWeight="bold">{group}</SoftTypography>
                </SoftBox>
                <SoftBox px={2} py={1.5}>
                  <Grid container spacing={2}>
                    {items.map((item) => {
                      const current = postableAccounts.find((a) => a.id === settings[item.key]);
                      return (
                        <Grid item xs={12} sm={6} key={item.key}>
                          <SoftBox display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <SoftTypography variant="caption" fontWeight="bold">{item.label}</SoftTypography>
                            {!settings[item.key] && <ErrorOutlineIcon sx={{ color: "#ea0606", fontSize: 14 }} />}
                          </SoftBox>
                          <Autocomplete
                            size="small"
                            options={postableAccounts}
                            value={current ?? null}
                            getOptionLabel={(a) => `${a.code} — ${a.nameAr}`}
                            onChange={(_, v) => setSettings((p) => ({ ...p, [item.key]: v?.id ?? null }))}
                            renderInput={(params) => (
                              <TextField {...params} placeholder="اختر حساباً..." size="small" />
                            )}
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </SoftBox>
              </Card>
            ))}
          </>
        )}

        {/* Tab 1: Rules */}
        {tab === 1 && (
          <SoftBox display="flex" flexDirection="column" gap={2}>
            {RULES.map((rule) => (
              <Card key={rule.key}>
                <SoftBox px={2} py={1.5} sx={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold">{rule.label}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary" display="block">{rule.description}</SoftTypography>
                    </SoftBox>
                    <Chip label={rule.key} size="small" sx={{ fontFamily: "monospace", fontSize: "0.65rem" }} />
                  </SoftBox>
                </SoftBox>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>الجانب</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>مصدر الحساب</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>الحساب المربوط</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>مصدر المبلغ</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>Sub-Ledger</TableCell>
                        <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>الوصف</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rule.lines.map((line, i) => (
                        <TableRow key={i} sx={{ background: line.side === "debit" ? "#e3f8fd22" : "#f0fde422" }}>
                          <TableCell>
                            <Chip
                              label={line.side === "debit" ? "مدين" : "دائن"}
                              size="small"
                              color={line.side === "debit" ? "info" : "success"}
                              sx={{ fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell>
                            <SoftTypography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
                              {line.source}
                            </SoftTypography>
                          </TableCell>
                          <TableCell>
                            <SoftTypography variant="caption" sx={{ fontSize: "0.72rem" }}>
                              {settings[line.source] ? getAccountName(settings[line.source]) : (
                                <SoftTypography variant="caption" sx={{ color: "#ea0606", fontSize: "0.72rem" }}>
                                  <ErrorOutlineIcon sx={{ fontSize: 12, mr: 0.3 }} />غير محدد
                                </SoftTypography>
                              )}
                            </SoftTypography>
                          </TableCell>
                          <TableCell>
                            <SoftTypography variant="caption" color="secondary" sx={{ fontSize: "0.7rem" }}>
                              {line.amount}
                            </SoftTypography>
                          </TableCell>
                          <TableCell>
                            <SoftTypography variant="caption" color="secondary" sx={{ fontSize: "0.7rem" }}>
                              {line.subledger ?? "—"}
                            </SoftTypography>
                          </TableCell>
                          <TableCell>
                            <SoftTypography variant="caption" color="secondary">{line.desc}</SoftTypography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            ))}
          </SoftBox>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
