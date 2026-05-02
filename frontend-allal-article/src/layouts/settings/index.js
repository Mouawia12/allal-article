/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";

import Alert from "@mui/material/Alert";
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
import Avatar from "@mui/material/Avatar";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CircularProgress from "@mui/material/CircularProgress";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import SettingsIcon from "@mui/icons-material/Settings";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsIcon from "@mui/icons-material/Notifications";
import StorageIcon from "@mui/icons-material/Storage";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { useI18n } from "i18n";
import { WILAYAS } from "data/wilayas";
import { getUserPermissions, permissionsByModule, roleConfig } from "data/config/permissionsConfig";
import { useAuth } from "context/AuthContext";
import { aiSettingsApi, customersApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

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

const defaultTextModels = ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano", "gpt-4o", "gpt-4o-mini"];
const defaultImageModels = ["gpt-image-2", "gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini", "dall-e-3"];

function mergeModelIds(remote = [], fallback = [], selected = "") {
  const ids = [];
  remote.forEach((model) => {
    const id = typeof model === "string" ? model : model?.id;
    if (id && !ids.includes(id)) ids.push(id);
  });
  fallback.forEach((id) => {
    if (id && !ids.includes(id)) ids.push(id);
  });
  if (selected && !ids.includes(selected)) ids.unshift(selected);
  return ids;
}

function formatRefreshTime(value) {
  if (!value) return "لم يتم التحديث بعد";
  try {
    return new Date(value).toLocaleString("ar-DZ", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return value;
  }
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [modelRefreshing, setModelRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [settings, setSettings] = useState({
    provider: "openai",
    openAiApiKey: "",
    model: "gpt-4o",
    imageModel: "gpt-image-2",
    extractionEnabled: true,
    imageProcessEnabled: true,
    imageProcessingPrompt: "Remove the background from this product image. Keep the product exactly as it appears - preserve all text, logos, colors, and fine details. Make the background pure white or transparent. Do not modify the product itself in any way.",
    hasOpenAiApiKey: false,
    maskedOpenAiApiKey: "",
    openAiKeySource: "none",
    availableTextModels: [],
    availableImageModels: [],
    modelsRefreshedAt: null,
  });

  const toggleKey = (k) => setShowKey(prev => ({ ...prev, [k]: !prev[k] }));

  const models = {
    openai:   defaultTextModels,
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
  };

  const openAiTextModels = mergeModelIds(settings.availableTextModels, defaultTextModels, settings.model);
  const imageModels = mergeModelIds(settings.availableImageModels, defaultImageModels, settings.imageModel);
  const keySourceLabels = {
    environment: "متغير البيئة",
    tenant: "إعدادات النظام",
    none: "غير مضبوط",
  };

  useEffect(() => {
    let active = true;
    aiSettingsApi.get()
      .then((r) => {
        if (!active) return;
        setSettings((prev) => ({ ...prev, ...r.data, openAiApiKey: "" }));
      })
      .catch((err) => {
        if (!active) return;
        setFeedback({
          severity: "error",
          message: getApiErrorMessage(err, "تعذر تحميل إعدادات الذكاء الاصطناعي"),
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));

  const selectProvider = (nextProvider) => {
    const nextModels = nextProvider === "openai" ? openAiTextModels : (models[nextProvider] || models.openai);
    update({
      provider: nextProvider,
      model: nextModels.includes(settings.model) ? settings.model : nextModels[0],
    });
  };

  const payload = (extra = {}) => ({
    provider: settings.provider,
    openAiApiKey: settings.openAiApiKey,
    model: settings.model,
    imageModel: settings.imageModel,
    extractionEnabled: settings.extractionEnabled,
    imageProcessEnabled: settings.imageProcessEnabled,
    imageProcessingPrompt: settings.imageProcessingPrompt,
    ...extra,
  });

  const save = (extra = {}) => {
    setSaving(true);
    setFeedback(null);
    aiSettingsApi.save(payload(extra))
      .then((r) => {
        setSettings((prev) => ({ ...prev, ...r.data, openAiApiKey: "" }));
        setFeedback({ severity: "success", message: "تم حفظ إعدادات AI بنجاح" });
      })
      .catch((err) => {
        setFeedback({
          severity: "error",
          message: getApiErrorMessage(err, "تعذر حفظ إعدادات AI"),
        });
      })
      .finally(() => setSaving(false));
  };

  const testConnection = () => {
    setTesting(true);
    setFeedback(null);
    aiSettingsApi.test({
      provider: settings.provider,
      openAiApiKey: settings.openAiApiKey,
      model: settings.model,
    })
      .then((r) => {
        setFeedback({
          severity: "success",
          message: r?.data?.message || "تم الاتصال بـ OpenAI بنجاح",
        });
      })
      .catch((err) => {
        setFeedback({
          severity: "error",
          message: getApiErrorMessage(err, "فشل اختبار الاتصال مع OpenAI"),
        });
      })
      .finally(() => setTesting(false));
  };

  const refreshModels = () => {
    setModelRefreshing(true);
    setFeedback(null);
    aiSettingsApi.refreshModels({ openAiApiKey: settings.openAiApiKey })
      .then((r) => {
        const textModels = r.data?.textModels || [];
        const imageModelList = r.data?.imageModels || [];
        const refreshedAt = r.data?.refreshedAt || new Date().toISOString();
        setSettings((prev) => ({
          ...prev,
          availableTextModels: textModels,
          availableImageModels: imageModelList,
          modelsRefreshedAt: refreshedAt,
          model: textModels.some((model) => model.id === prev.model) ? prev.model : (textModels[0]?.id || prev.model),
          imageModel: imageModelList.some((model) => model.id === prev.imageModel) ? prev.imageModel : (imageModelList[0]?.id || prev.imageModel),
          openAiApiKey: "",
        }));
        setFeedback({ severity: "success", message: "تم تحديث قائمة موديلات OpenAI" });
      })
      .catch((err) => {
        setFeedback({
          severity: "error",
          message: getApiErrorMessage(err, "تعذر تحديث قائمة الموديلات"),
        });
      })
      .finally(() => setModelRefreshing(false));
  };

  if (loading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" py={6}>
        <CircularProgress size={28} />
      </SoftBox>
    );
  }

  return (
    <SoftBox>
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Provider Selection */}
      <SectionHeader title="مزود الذكاء الاصطناعي" description="اختر المزود الرئيسي للذكاء الاصطناعي" />
      <Grid container spacing={2} mb={3}>
        {[
          { key: "openai",   label: "OpenAI",   desc: "GPT-5.5, GPT Image",     color: "#10a37f", active: true },
          { key: "deepseek", label: "DeepSeek", desc: "DeepSeek Chat",          color: "#1e40af", active: false },
        ].map((p) => (
          <Grid item xs={12} sm={6} key={p.key}>
            <SoftBox
              onClick={() => selectProvider(p.key)}
              sx={{
                p: 2,
                borderRadius: 2,
                border: `2px solid ${settings.provider === p.key ? p.color : "#e9ecef"}`,
                cursor: "pointer",
                background: settings.provider === p.key ? `${p.color}11` : "#fff",
                transition: "all 0.2s",
              }}
            >
              <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                <SoftBox>
                  <SoftTypography variant="button" fontWeight="bold">{p.label}</SoftTypography>
                  <SoftTypography variant="caption" color="secondary" display="block">{p.desc}</SoftTypography>
                </SoftBox>
                {settings.provider === p.key && <CheckCircleIcon sx={{ color: p.color }} />}
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
            value={settings.openAiApiKey}
            placeholder={settings.hasOpenAiApiKey ? `مفتاح محفوظ (${settings.maskedOpenAiApiKey})` : "sk-proj-..."}
            helperText={settings.hasOpenAiApiKey
              ? `المصدر الحالي: ${keySourceLabels[settings.openAiKeySource] || settings.openAiKeySource}`
              : "لا يوجد مفتاح OpenAI مضبوط حالياً"}
            onChange={(e) => update({ openAiApiKey: e.target.value })}
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
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
        <SoftTypography variant="caption" color="secondary">
          آخر تحديث لقائمة OpenAI: {formatRefreshTime(settings.modelsRefreshedAt)}
        </SoftTypography>
        <SoftButton
          variant="outlined"
          color="info"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={refreshModels}
          disabled={modelRefreshing || settings.provider !== "openai"}
        >
          {modelRefreshing ? "جاري تحديث الموديلات..." : "تحديث موديلات OpenAI"}
        </SoftButton>
      </SoftBox>
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select size="small" label="موديل استخراج البيانات" value={settings.model}
            onChange={(e) => update({ model: e.target.value })}>
            {(settings.provider === "openai" ? openAiTextModels : (models[settings.provider] || models.openai))
              .map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth select size="small" label="موديل معالجة الصور" value={settings.imageModel}
            onChange={(e) => update({ imageModel: e.target.value })}>
            {imageModels.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>

      {/* Features */}
      <SectionHeader title="الميزات الذكية" />
      <SettingRow label="استخراج بيانات الأصناف" description="تحليل Excel/PDF/صور لاستخراج بيانات الأصناف">
        <Switch checked={settings.extractionEnabled}
          onChange={(e) => update({ extractionEnabled: e.target.checked })} color="info" />
      </SettingRow>
      <SettingRow label="معالجة صور المنتجات" description="إزالة الخلفية وتحسين صور الأصناف">
        <Switch checked={settings.imageProcessEnabled}
          onChange={(e) => update({ imageProcessEnabled: e.target.checked })} color="info" />
      </SettingRow>

      {/* Image Processing Prompt */}
      {settings.imageProcessEnabled && (
        <SoftBox mb={3}>
          <SoftTypography variant="caption" fontWeight="bold" color="secondary" mb={0.5} display="block">
            برومبت معالجة الصور (قابل للتخصيص)
          </SoftTypography>
          <TextField
            fullWidth
            multiline
            rows={4}
            size="small"
            value={settings.imageProcessingPrompt}
            onChange={(e) => update({ imageProcessingPrompt: e.target.value })}
          />
          <SoftTypography variant="caption" color="secondary" mt={0.5} display="block">
            * هذا البرومبت يُرسل مع كل صورة للمعالجة
          </SoftTypography>
        </SoftBox>
      )}

      {/* Connection Status */}
      <SectionHeader title="حالة الربط" />
      <Grid container spacing={2} mb={3}>
        {[
          { label: "مزود", value: settings.provider === "openai" ? "OpenAI" : "DeepSeek" },
          { label: "الموديل", value: settings.model },
          { label: "المفتاح", value: settings.hasOpenAiApiKey ? "مضبوط" : "غير مضبوط" },
        ].map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <SoftBox sx={{ border: "1px solid #e9ecef", borderRadius: 2, p: 1.5 }}>
              <SoftTypography variant="caption" color="secondary" display="block">{stat.label}</SoftTypography>
              <SoftTypography variant="button" fontWeight="bold">{stat.value}</SoftTypography>
            </SoftBox>
          </Grid>
        ))}
      </Grid>

      <SoftBox display="flex" justifyContent="flex-end" gap={1}>
        {settings.hasOpenAiApiKey && settings.openAiKeySource === "tenant" && (
          <SoftButton variant="text" color="error" size="small" onClick={() => save({ clearOpenAiApiKey: true })} disabled={saving}>
            حذف المفتاح المحفوظ
          </SoftButton>
        )}
        <SoftButton variant="outlined" color="dark" size="small" onClick={testConnection} disabled={testing}>
          {testing ? "جاري الاختبار..." : "اختبار الاتصال"}
        </SoftButton>
        <SoftButton variant="gradient" color="info" size="small" onClick={() => save()} disabled={saving}>
          {saving ? "جارٍ الحفظ..." : "حفظ إعدادات AI"}
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsSettings() {
  return (
    <SoftBox>
      <SectionHeader
        title="إعدادات الإشعارات"
        description="إعدادات الإشعارات ستُحمَّل من الباكند عند توفر نقطة الـ API"
      />
      <SoftBox sx={{ textAlign: "center", py: 4, color: "#8392ab", fontSize: 13 }}>
        لا توجد إشعارات مُهيأة بعد
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

// ─── Road Invoice Settings ────────────────────────────────────────────────────
function RoadInvoiceSettings() {
  const [customers, setCustomers] = useState([]);
  const [wilayaDefaults, setWilayaDefaults] = useState({});
  const [aiUpdating, setAiUpdating] = useState(false);
  const [editingWilaya, setEditingWilaya] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setLoadError("");
    customersApi.list({ size: 200 })
      .then((r) => {
        const list = Array.isArray(r.data?.content) ? r.data.content
                   : Array.isArray(r.data)           ? r.data : [];
        setCustomers(list);
      })
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل الزبائن لإعدادات فواتير الطريق"));
        setCustomers([]);
      });
  }, []);

  const handleAiUpdate = () => {
    setAiUpdating(true);
    setTimeout(() => setAiUpdating(false), 2000);
  };

  return (
    <SoftBox>
      <SectionHeader
        title="إعدادات فواتير الطريق"
        description="تحديد الزبون التلقائي لكل ولاية عند تحويل الطلبيات إلى فواتير طريق"
      />

      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
          {loadError}
        </Alert>
      )}

      {/* AI Update Wilayas */}
      <SoftBox mb={3} p={2} sx={{ background: "#f0f7ff", borderRadius: 2, border: "1px solid #17c1e822" }}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftBox>
            <SoftTypography variant="button" fontWeight="bold">تحديث قائمة الولايات</SoftTypography>
            <SoftTypography variant="caption" color="secondary" display="block">
              استخدم الذكاء الاصطناعي لتحديث قائمة الولايات تلقائياً (في حال أي تقسيم إداري جديد)
              أو قم بتعديلها يدوياً
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="outlined" color="secondary" size="small">
              تعديل يدوي
            </SoftButton>
            <SoftButton
              variant="gradient" color="info" size="small"
              startIcon={<AutoFixHighIcon />}
              onClick={handleAiUpdate}
              disabled={aiUpdating}
            >
              {aiUpdating ? "جاري التحديث..." : "تحديث بالذكاء الاصطناعي"}
            </SoftButton>
          </SoftBox>
        </SoftBox>
        {aiUpdating && <LinearProgress sx={{ mt: 1.5, borderRadius: 1 }} />}
      </SoftBox>

      {/* Wilaya → Customer mapping */}
      <SoftTypography variant="button" fontWeight="bold" display="block" mb={1}>
        الزبون التلقائي لكل ولاية
      </SoftTypography>
      <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
        عند تحويل طلبيات من ولاية معينة إلى فاتورة طريق، سيتم اختيار الزبون التالي تلقائياً.
        يمكن تغييره يدوياً في كل فاتورة.
      </SoftTypography>

      <SoftBox sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              {["الكود", "الولاية", "الزبون التلقائي", "إجراء"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "right" }}>
                  <SoftTypography variant="caption" fontWeight="bold" color="secondary">{h}</SoftTypography>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WILAYAS.map((w) => (
              <tr key={w.code} style={{ borderBottom: "1px solid #f0f2f5" }}>
                <td style={{ padding: "8px 12px", width: 60 }}>
                  <SoftTypography variant="caption" color="secondary">{w.code}</SoftTypography>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <SoftTypography variant="caption" fontWeight="bold">{w.name}</SoftTypography>
                </td>
                <td style={{ padding: "8px 12px", minWidth: 220 }}>
                  {editingWilaya === w.code ? (
                    <FormControl size="small" fullWidth>
                      <Select
                        value={wilayaDefaults[w.name] || ""}
                        onChange={(e) => {
                          setWilayaDefaults(prev => ({ ...prev, [w.name]: e.target.value }));
                          setEditingWilaya(null);
                        }}
                        displayEmpty
                      >
                        <MenuItem value="">— بدون زبون تلقائي —</MenuItem>
                        {customers.map((c) => <MenuItem key={c.id} value={c.name}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  ) : (
                    <SoftTypography variant="caption" color={wilayaDefaults[w.name] ? "text" : "secondary"}>
                      {wilayaDefaults[w.name] || "—"}
                    </SoftTypography>
                  )}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <SoftButton variant="text" color="info" size="small"
                    onClick={() => setEditingWilaya(editingWilaya === w.code ? null : w.code)}>
                    {editingWilaya === w.code ? "إلغاء" : "تعديل"}
                  </SoftButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SoftBox>

      <SoftBox mt={3} display="flex" justifyContent="flex-end">
        <SoftButton variant="gradient" color="info" size="small">حفظ الإعدادات</SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

// ─── My Permissions Tab ───────────────────────────────────────────────────────
function MyPermissionsSettings() {
  const { user: authUser } = useAuth();
  const user = { ...authUser, role: authUser?.roleCode || "viewer", id: authUser?.id || 0 };
  const perms = getUserPermissions(user);
  const rc = roleConfig[user.role] || roleConfig.viewer;
  const totalAll = Object.values(permissionsByModule).reduce((s, arr) => s + arr.length, 0);
  const avatarColors = ["#17c1e8", "#82d616", "#ea0606", "#fb8c00", "#7928ca", "#344767"];
  const colorIdx = user.id % avatarColors.length;

  return (
    <SoftBox>
      {/* Current user banner */}
      <SoftBox
        display="flex" alignItems="center" gap={2} p={2} mb={3}
        sx={{ background: `${rc.color}0e`, borderRadius: 2, border: `1px solid ${rc.color}30` }}
      >
        <Avatar sx={{ bgcolor: avatarColors[colorIdx], width: 48, height: 48, fontSize: 18, fontWeight: 800, borderRadius: 2 }}>
          {user.name[0]}
        </Avatar>
        <SoftBox flex={1}>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <SoftTypography variant="h6" fontWeight="bold">{user.name}</SoftTypography>
            <Chip label={rc.label} size="small"
              sx={{ height: 20, fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color }} />
          </SoftBox>
          <SoftTypography variant="caption" color="secondary">{user.email}</SoftTypography>
        </SoftBox>
        <SoftBox textAlign="center">
          <SoftTypography variant="h4" fontWeight="bold" sx={{ color: rc.color }}>{perms.size}</SoftTypography>
          <SoftTypography variant="caption" color="secondary">صلاحية من {totalAll}</SoftTypography>
        </SoftBox>
      </SoftBox>

      {/* Bar */}
      <SoftBox mb={0.5} display="flex" justifyContent="space-between">
        <SoftTypography variant="caption" color="secondary">تغطية الصلاحيات</SoftTypography>
        <SoftTypography variant="caption" fontWeight="bold">{Math.round((perms.size / totalAll) * 100)}%</SoftTypography>
      </SoftBox>
      <LinearProgress
        variant="determinate"
        value={(perms.size / totalAll) * 100}
        sx={{ height: 6, borderRadius: 3, bgcolor: "#e9ecef", mb: 3, "& .MuiLinearProgress-bar": { background: rc.color } }}
      />

      {/* Permissions by module */}
      <SectionHeader title="الصلاحيات الممنوحة لك" description="هذه الصلاحيات محددة من قِبل المسؤول بناءً على دورك في النظام" />
      <Grid container spacing={2}>
        {Object.entries(permissionsByModule).map(([moduleName, modulePerms]) => {
          const granted = modulePerms.filter((p) => perms.has(p.code));
          const denied  = modulePerms.filter((p) => !perms.has(p.code));
          return (
            <Grid item xs={12} sm={6} key={moduleName}>
              <SoftBox sx={{ border: "1px solid #e9ecef", borderRadius: 2, overflow: "hidden" }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center"
                  px={1.5} py={1} sx={{ background: granted.length > 0 ? "#f0faff" : "#f8f9fa" }}>
                  <SoftTypography variant="caption" fontWeight="bold" color={granted.length > 0 ? "info" : "secondary"}>
                    {moduleName}
                  </SoftTypography>
                  <SoftBox display="flex" gap={0.5}>
                    {granted.length > 0 && (
                      <Chip label={`✓ ${granted.length}`} size="small"
                        sx={{ height: 18, fontSize: 9, fontWeight: 700, background: "#e3f8fd", color: "#17c1e8" }} />
                    )}
                    {denied.length > 0 && (
                      <Chip label={`✗ ${denied.length}`} size="small"
                        sx={{ height: 18, fontSize: 9, fontWeight: 700, background: "#f1f5f9", color: "#94a3b8" }} />
                    )}
                  </SoftBox>
                </SoftBox>
                <SoftBox px={1.5} py={0.8} display="flex" flexDirection="column" gap={0.4}>
                  {modulePerms.map((p) => {
                    const has = perms.has(p.code);
                    return (
                      <SoftBox key={p.code} display="flex" alignItems="center" gap={0.8}
                        sx={{ opacity: has ? 1 : 0.4 }}>
                        <CheckCircleIcon sx={{ fontSize: 13, color: has ? "#82d616" : "#cbd5e1", flexShrink: 0 }} />
                        <SoftTypography variant="caption" color={has ? "text" : "secondary"}>{p.label}</SoftTypography>
                      </SoftBox>
                    );
                  })}
                </SoftBox>
              </SoftBox>
            </Grid>
          );
        })}
      </Grid>

      <SoftBox mt={3} p={2} sx={{ background: "#fffbeb", borderRadius: 2, border: "1px solid #fbbf2433" }}>
        <SoftTypography variant="caption" color="secondary">
          💡 لتغيير صلاحياتك، تواصل مع مسؤول النظام أو انتقل إلى{" "}
          <strong>المستخدمون ← تعديل صلاحياتك</strong>
        </SoftTypography>
      </SoftBox>
    </SoftBox>
  );
}

function Settings() {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: "صلاحياتي",            icon: <SecurityIcon fontSize="small" /> },
    { label: "عام",                 icon: <SettingsIcon fontSize="small" /> },
    { label: "الذكاء الاصطناعي",   icon: <AutoAwesomeIcon fontSize="small" /> },
    { label: "فواتير الطريق",       icon: <LocalShippingIcon fontSize="small" /> },
    { label: "الإشعارات",          icon: <NotificationsIcon fontSize="small" /> },
    { label: "معلومات النظام",      icon: <StorageIcon fontSize="small" /> },
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
            {tab === 0 && <MyPermissionsSettings />}
            {tab === 1 && <GeneralSettings />}
            {tab === 2 && <AISettings />}
            {tab === 3 && <RoadInvoiceSettings />}
            {tab === 4 && <NotificationsSettings />}
            {tab === 5 && <SystemInfo />}
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Settings;
