/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StorageIcon from "@mui/icons-material/Storage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useI18n } from "i18n";

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, description }) {
  return (
    <SoftBox mb={2}>
      <SoftTypography variant="h6" fontWeight="bold">{title}</SoftTypography>
      {description && (
        <SoftTypography variant="caption" color="secondary">{description}</SoftTypography>
      )}
      <Divider sx={{ mt: 1 }} />
    </SoftBox>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({ label, description, children }) {
  return (
    <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
      <SoftBox flex={1} mr={3}>
        <SoftTypography variant="button" fontWeight="medium">{label}</SoftTypography>
        {description && (
          <SoftTypography variant="caption" color="secondary" display="block">{description}</SoftTypography>
        )}
      </SoftBox>
      <SoftBox flexShrink={0}>{children}</SoftBox>
    </SoftBox>
  );
}

// ─── General Settings Tab ─────────────────────────────────────────────────────
function GeneralSettings() {
  const { locale, setLocale } = useI18n();
  const [settings, setSettings] = useState({
    companyName: "شركة علال",
    lang: locale,
    currency: "DZD",
    dateFormat: "DD/MM/YYYY",
    autoSaveDraft: true,
    realtime: true,
    orderPrefix: "ORD",
  });

  useEffect(() => {
    setSettings((prev) => ({ ...prev, lang: locale }));
  }, [locale]);

  return (
    <SoftBox>
      <SectionHeader title="معلومات الشركة" />
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="اسم الشركة" value={settings.companyName}
            onChange={(e) => setSettings(s => ({ ...s, companyName: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth size="small" label="بادئة رقم الطلبية" value={settings.orderPrefix}
            onChange={(e) => setSettings(s => ({ ...s, orderPrefix: e.target.value }))}
            helperText="مثال: ORD → ORD-2024-001" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth select size="small" label="اللغة" value={settings.lang}
            onChange={(e) => {
              const nextLocale = e.target.value;
              setSettings(s => ({ ...s, lang: nextLocale }));
              setLocale(nextLocale);
            }}>
            <MenuItem value="ar">العربية</MenuItem>
            <MenuItem value="fr">Français</MenuItem>
            <MenuItem value="en">English</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth select size="small" label="العملة" value={settings.currency}
            onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}>
            <MenuItem value="DZD">دينار جزائري (DZD)</MenuItem>
            <MenuItem value="USD">دولار (USD)</MenuItem>
            <MenuItem value="EUR">يورو (EUR)</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth select size="small" label="صيغة التاريخ" value={settings.dateFormat}
            onChange={(e) => setSettings(s => ({ ...s, dateFormat: e.target.value }))}>
            <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
            <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
            <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <SectionHeader title="خيارات النظام" />
      <SettingRow
        label="الحفظ التلقائي للمسودات"
        description="حفظ الطلبيات غير المكتملة تلقائياً كل 5 دقائق"
      >
        <Switch
          checked={settings.autoSaveDraft}
          onChange={(e) => setSettings(s => ({ ...s, autoSaveDraft: e.target.checked }))}
          color="info"
        />
      </SettingRow>
      <SettingRow
        label="التحديثات اللحظية (Real-time)"
        description="تفعيل الإشعارات الفورية لتغييرات الطلبيات والمخزون"
      >
        <Switch
          checked={settings.realtime}
          onChange={(e) => setSettings(s => ({ ...s, realtime: e.target.checked }))}
          color="info"
        />
      </SettingRow>

      <SoftBox display="flex" justifyContent="flex-end" mt={3}>
        <SoftButton variant="gradient" color="info" size="small">حفظ الإعدادات</SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── AI Settings Tab ──────────────────────────────────────────────────────────
function AISettings() {
  const [showKey, setShowKey] = useState({});
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o");
  const [imageModel, setImageModel] = useState("dall-e-3");
  const [extractionEnabled, setExtractionEnabled] = useState(true);
  const [imageProcessEnabled, setImageProcessEnabled] = useState(true);

  const toggleKey = (k) => setShowKey(prev => ({ ...prev, [k]: !prev[k] }));

  const models = {
    openai:   ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
  };

  const imageModels = ["dall-e-3", "dall-e-2", "stable-diffusion"];

  return (
    <SoftBox>
      {/* Provider Selection */}
      <SectionHeader title="مزود الذكاء الاصطناعي" description="اختر المزود الرئيسي للذكاء الاصطناعي" />
      <Grid container spacing={2} mb={3}>
        {[
          { key: "openai",   label: "OpenAI",   desc: "GPT-4o, DALL-E 3",     color: "#10a37f", active: true },
          { key: "deepseek", label: "DeepSeek", desc: "DeepSeek Chat",          color: "#1e40af", active: false },
        ].map((p) => (
          <Grid item xs={12} sm={6} key={p.key}>
            <SoftBox
              onClick={() => setProvider(p.key)}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `2px solid ${provider === p.key ? p.color : "#e9ecef"}`,
                cursor: "pointer",
                background: provider === p.key ? `${p.color}11` : "#fff",
                transition: "all 0.2s",
              }}
            >
              <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                <SoftBox>
                  <SoftTypography variant="button" fontWeight="bold">{p.label}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block">{p.desc}</SoftTypography>
                </SoftBox>
                {provider === p.key && <CheckCircleIcon sx={{ color: p.color }} />}
              </SoftBox>
            </SoftBox>
          </Grid>
        ))}
      </Grid>

      {/* API Keys */}
      <SectionHeader title="مفاتيح API" />
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="OpenAI API Key"
            type={showKey.openai ? "text" : "password"}
            defaultValue="sk-proj-••••••••••••••••••••••••••••••••"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => toggleKey("openai")}>
                    {showKey.openai ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            size="small"
            label="DeepSeek API Key"
            type={showKey.deepseek ? "text" : "password"}
            defaultValue=""
            placeholder="أدخل مفتاح DeepSeek API..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => toggleKey("deepseek")}>
                    {showKey.deepseek ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Model Selection */}
      <SectionHeader title="اختيار الموديل" />
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select size="small" label="موديل استخراج البيانات" value={model}
            onChange={(e) => setModel(e.target.value)}>
            {models[provider].map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select size="small" label="موديل معالجة الصور" value={imageModel}
            onChange={(e) => setImageModel(e.target.value)}>
            {imageModels.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      {/* Features */}
      <SectionHeader title="الميزات الذكية" />
      <SettingRow label="استخراج بيانات الأصناف" description="تحليل Excel/PDF/صور لاستخراج بيانات الأصناف">
        <Switch checked={extractionEnabled} onChange={(e) => setExtractionEnabled(e.target.checked)} color="info" />
      </SettingRow>
      <SettingRow label="معالجة صور المنتجات" description="إزالة الخلفية وتحسين صور الأصناف">
        <Switch checked={imageProcessEnabled} onChange={(e) => setImageProcessEnabled(e.target.checked)} color="info" />
      </SettingRow>

      {/* Image Processing Prompt */}
      {imageProcessEnabled && (
        <SoftBox mb={3}>
          <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={0.5} display="block">
            برومبت معالجة الصور (قابل للتخصيص)
          </SoftTypography>
          <TextField
            fullWidth
            multiline
            rows={4}
            size="small"
            defaultValue="Remove the background from this product image. Keep the product exactly as it appears - preserve all text, logos, colors, and fine details. Make the background pure white or transparent. Do not modify the product itself in any way."
          />
          <SoftTypography variant="caption" color="secondary" mt={0.5} display="block">
            * هذا البرومبت يُرسل مع كل صورة للمعالجة
          </SoftTypography>
        </SoftBox>
      )}

      {/* Usage Stats */}
      <SectionHeader title="استخدام API هذا الشهر" />
      <Grid container spacing={2} mb={3}>
        {[
          { label: "OpenAI Tokens",     used: 45000, max: 100000, color: "#10a37f" },
          { label: "معالجة الصور",      used: 23,    max: 100,    color: "#7928ca", unit: "صورة" },
          { label: "استخراج ملفات",     used: 8,     max: 50,     color: "#fb8c00", unit: "ملف" },
        ].map((stat) => {
          const pct = Math.round((stat.used / stat.max) * 100);
          return (
            <Grid item xs={12} sm={4} key={stat.label}>
              <SoftBox>
                <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
                  <SoftTypography variant="caption" fontWeight="bold">{stat.label}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary">
                    {stat.used.toLocaleString()}{stat.unit ? " " + stat.unit : ""} / {stat.max.toLocaleString()}{stat.unit ? " " + stat.unit : ""}
                  </SoftTypography>
                </SoftBox>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6, borderRadius: 3, bgcolor: "#e9ecef",
                    "& .MuiLinearProgress-bar": { background: stat.color },
                  }}
                />
                <SoftTypography variant="caption" color="secondary">{pct}% مستخدم</SoftTypography>
              </SoftBox>
            </Grid>
          );
        })}
      </Grid>

      <SoftBox display="flex" justifyContent="flex-end">
        <SoftButton variant="gradient" color="info" size="small">حفظ إعدادات AI</SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsSettings() {
  const [notifs, setNotifs] = useState({
    newOrder:       true,
    orderConfirmed: true,
    orderRejected:  true,
    orderShipped:   true,
    lowStock:       true,
    outOfStock:     true,
    newCustomer:    false,
  });

  const rows = [
    { key: "newOrder",       label: "طلبية جديدة وردت",           desc: "إشعار عند وصول طلبية جديدة من البائع" },
    { key: "orderConfirmed", label: "تأكيد الطلبية",              desc: "إشعار عند تأكيد الطلبية من الإدارة" },
    { key: "orderRejected",  label: "رفض الطلبية",                desc: "إشعار عند رفض الطلبية" },
    { key: "orderShipped",   label: "شحن الطلبية",                desc: "إشعار عند تسجيل شحن الطلبية" },
    { key: "lowStock",       label: "تنبيه مخزون منخفض",         desc: "إشعار عند وصول المخزون لحد التنبيه" },
    { key: "outOfStock",     label: "نفاد مخزون",                  desc: "إشعار عند نفاد صنف من المخزون" },
    { key: "newCustomer",    label: "إضافة زبون جديد",            desc: "إشعار عند إضافة زبون جديد" },
  ];

  return (
    <SoftBox>
      <SectionHeader title="إعدادات الإشعارات" description="تحكم في الإشعارات التي تتلقاها داخل النظام" />
      {rows.map((row) => (
        <SettingRow key={row.key} label={row.label} description={row.desc}>
          <Switch
            checked={notifs[row.key]}
            onChange={(e) => setNotifs(prev => ({ ...prev, [row.key]: e.target.checked }))}
            color="info"
          />
        </SettingRow>
      ))}
      <SoftBox display="flex" justifyContent="flex-end" mt={2}>
        <SoftButton variant="gradient" color="info" size="small">حفظ إعدادات الإشعارات</SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── System Info Tab ──────────────────────────────────────────────────────────
function SystemInfo() {
  return (
    <SoftBox>
      <SectionHeader title="معلومات النظام" />
      <Grid container spacing={2} mb={3}>
        {[
          { label: "إصدار النظام",    value: "1.0.0-beta" },
          { label: "قاعدة البيانات",  value: "MySQL 8.0" },
          { label: "الخادم",          value: "Node.js 20 LTS" },
          { label: "آخر تحديث",       value: "2024-01-22" },
        ].map((row) => (
          <Grid item xs={12} sm={6} key={row.label}>
            <SoftBox display="flex" justifyContent="space-between" p={2} sx={{ background: "#f8f9fa", borderRadius: 2 }}>
              <SoftTypography variant="caption" color="secondary">{row.label}</SoftTypography>
              <SoftTypography variant="caption" fontWeight="bold">{row.value}</SoftTypography>
            </SoftBox>
          </Grid>
        ))}
      </Grid>

      <SectionHeader title="إحصاءات قاعدة البيانات" />
      <Grid container spacing={2}>
        {[
          { label: "إجمالي الطلبيات",      value: "256",   icon: "📦" },
          { label: "إجمالي الأصناف",        value: "16",    icon: "🔧" },
          { label: "إجمالي الزبائن",        value: "8",     icon: "👥" },
          { label: "إجمالي سجلات العمليات", value: "1,247", icon: "📋" },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <SoftTypography fontSize={28}>{stat.icon}</SoftTypography>
              <SoftTypography variant="h5" fontWeight="bold" color="info">{stat.value}</SoftTypography>
              <SoftTypography variant="caption" color="text">{stat.label}</SoftTypography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <SoftBox mt={3} display="flex" gap={2}>
        <SoftButton variant="outlined" color="error" size="small">
          مسح الكاش
        </SoftButton>
        <SoftButton variant="outlined" color="secondary" size="small">
          تصدير النسخة الاحتياطية
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Settings() {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: "عام",           icon: <SettingsIcon fontSize="small" /> },
    { label: "الذكاء الاصطناعي", icon: <AutoAwesomeIcon fontSize="small" /> },
    { label: "الإشعارات",    icon: <NotificationsIcon fontSize="small" /> },
    { label: "معلومات النظام", icon: <StorageIcon fontSize="small" /> },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3}>
          <SoftTypography variant="h4" fontWeight="bold">الإعدادات</SoftTypography>
          <SoftTypography variant="body2" color="text">
            إعدادات النظام العامة، الذكاء الاصطناعي، والإشعارات
          </SoftTypography>
        </SoftBox>

        <Card>
          {/* Tab Bar */}
          <SoftBox px={2} pt={2} borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              {tabs.map((t, i) => (
                <Tab
                  key={i}
                  label={
                    <SoftBox display="flex" alignItems="center" gap={0.5}>
                      {t.icon}
                      <SoftTypography variant="caption" fontWeight="medium">{t.label}</SoftTypography>
                    </SoftBox>
                  }
                />
              ))}
            </Tabs>
          </SoftBox>

          <SoftBox p={3}>
            {tab === 0 && <GeneralSettings />}
            {tab === 1 && <AISettings />}
            {tab === 2 && <NotificationsSettings />}
            {tab === 3 && <SystemInfo />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Settings;
