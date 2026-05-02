/* eslint-disable react/prop-types */
import { useState } from "react";

import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// ─── Template Data ────────────────────────────────────────────────────────────
const SCF_TEMPLATE = {
  id: "scf_algeria_trading",
  name: "ALLAL — تجاري 4 خانات",
  version: "1.0.0",
  description: "قالب شجرة الحسابات المعتمد في الخطة: 1000 أصول، 2000 خصوم، 3000 حقوق، 4000 إيرادات، 5000 مصروفات",
  codeDigits: 4,
  lastUpdated: "2026-05-01",
  groups: [
    {
      root: "1000", label: "الأصول", classification: "asset",
      items: [
        { code: "1010", name: "الأصول الثابتة",     level: 2 },
        { code: "1011", name: "مباني ومنشآت",       level: 2, postable: true },
        { code: "1012", name: "معدات وآلات",        level: 2, postable: true },
        { code: "1100", name: "المخزون",            level: 2 },
        { code: "1101", name: "مخزون البضاعة",      level: 2, postable: true },
        { code: "1200", name: "الذمم المدينة",      level: 2 },
        { code: "1201", name: "ذمم العملاء",        level: 2, control: true },
        { code: "1300", name: "الصندوق والبنك",     level: 2 },
        { code: "1301", name: "الصندوق",            level: 2, postable: true },
        { code: "1302", name: "البنك",              level: 2, postable: true },
      ],
    },
    {
      root: "2000", label: "الخصوم", classification: "liability",
      items: [
        { code: "2100", name: "الذمم الدائنة",      level: 2 },
        { code: "2101", name: "ذمم الموردين",       level: 2, control: true },
        { code: "2200", name: "القروض والديون",     level: 2 },
        { code: "2201", name: "قروض بنكية",         level: 2, postable: true },
        { code: "2300", name: "ضرائب مستحقة",       level: 2 },
        { code: "2301", name: "ضريبة محصلة",        level: 2, postable: true },
      ],
    },
    {
      root: "3000", label: "حقوق الملكية", classification: "equity",
      items: [
        { code: "3001", name: "رأس المال",          level: 2, postable: true },
        { code: "3002", name: "أرباح مرحلة",        level: 2, postable: true },
        { code: "3003", name: "نتيجة السنة",        level: 2, postable: true },
      ],
    },
    {
      root: "4000", label: "الإيرادات", classification: "revenue",
      items: [
        { code: "4001", name: "مبيعات البضاعة",      level: 2, postable: true },
        { code: "4002", name: "مردودات المبيعات",    level: 2, postable: true, contra: true },
      ],
    },
    {
      root: "5000", label: "المصروفات", classification: "expense",
      items: [
        { code: "5001", name: "تكلفة البضاعة المباعة", level: 2, postable: true },
        { code: "5002", name: "مردودات المشتريات",     level: 2, postable: true },
        { code: "5003", name: "مصاريف النقل",          level: 2, postable: true },
        { code: "5004", name: "مصاريف عامة",           level: 2, postable: true },
        { code: "5005", name: "أجور ورواتب",           level: 2, postable: true },
      ],
    },
  ],
};

const clsColors = {
  asset:     { color: "#17c1e8", bg: "#e3f8fd" },
  liability: { color: "#fb8c00", bg: "#fff3e0" },
  equity:    { color: "#7928ca", bg: "#f3e8ff" },
  revenue:   { color: "#82d616", bg: "#f0fde4" },
  expense:   { color: "#ea0606", bg: "#ffeaea" },
};

const healthChecks = [
  { id: 1, label: "لا توجد أكواد مكررة", ok: true },
  { id: 2, label: "كل الحسابات الرقابية مرتبطة بـ sub-ledger", ok: true },
  { id: 3, label: "لا توجد حسابات آباء قابلة للترحيل", ok: true },
  { id: 4, label: "كل الحسابات لها قسم تقارير مالية", ok: true },
  { id: 5, label: "لا توجد أكواد تتعارض مع البيانات الحالية", ok: true },
];

function GroupPreview({ group, open, onToggle }) {
  const cls = clsColors[group.classification] ?? {};
  return (
    <SoftBox mb={1.5} sx={{ border: "1px solid #e9ecef", borderRadius: 2, overflow: "hidden" }}>
      <SoftBox
        display="flex" justifyContent="space-between" alignItems="center"
        px={2} py={1.2} sx={{ background: cls.bg ?? "#f8f9fa", cursor: "pointer" }}
        onClick={onToggle}
      >
        <SoftBox display="flex" gap={1.5} alignItems="center">
          <SoftTypography variant="caption" fontWeight="bold" sx={{ color: cls.color, minWidth: 60 }}>
            {group.root}
          </SoftTypography>
          <SoftTypography variant="body2" fontWeight="bold">{group.label}</SoftTypography>
          <Chip label={`${group.items.length} حساب`} size="small" sx={{ fontSize: "0.7rem" }} />
        </SoftBox>
        {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </SoftBox>
      <Collapse in={open}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>الكود</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>الاسم</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>المستوى</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.72rem" }}>نوع</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {group.items.map((item) => (
              <TableRow key={item.code} hover>
                <TableCell sx={{ fontSize: "0.75rem", fontFamily: "monospace" }}>{item.code}</TableCell>
                <TableCell sx={{ fontSize: "0.75rem", pl: item.level === 3 ? 4 : item.level === 2 ? 2 : 0 }}>
                  {item.name}
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  <Chip label={`م${item.level}`} size="small" sx={{ fontSize: "0.65rem" }} />
                </TableCell>
                <TableCell sx={{ fontSize: "0.72rem" }}>
                  {item.postable && <Chip label="قابل للترحيل" size="small" color="info" sx={{ fontSize: "0.65rem" }} />}
                  {item.control && <Chip label="رقابي" size="small" color="warning" sx={{ fontSize: "0.65rem" }} />}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Collapse>
    </SoftBox>
  );
}

export default function ChartTemplates() {
  const [activeStep, setActiveStep] = useState(0);
  const [openGroups, setOpenGroups] = useState({});
  const [planted, setPlanted] = useState(false);

  const toggleGroup = (root) => setOpenGroups((p) => ({ ...p, [root]: !p[root] }));
  const allPassed = healthChecks.every((c) => c.ok);

  const steps = [
    { label: "اختيار القالب", desc: "اختر قالب شجرة الحسابات المناسب لنشاطك" },
    { label: "معاينة الشجرة", desc: "راجع الحسابات قبل الزرع" },
    { label: "فحص الصحة", desc: "تحقق من سلامة القالب قبل التطبيق" },
    { label: "زرع الشجرة", desc: "تطبيق الشجرة كإعداد أولي للمحاسبة" },
  ];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h5" fontWeight="bold">قوالب شجرة الحسابات</SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            إعداد شجرة الحسابات الأولية من قالب جاهز — مرحلة الإعداد الأولي للمشترك
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" gap={3} flexDirection={{ xs: "column", md: "row" }}>
          {/* Stepper */}
          <SoftBox sx={{ minWidth: 220 }}>
            <Card sx={{ p: 2 }}>
              <Stepper activeStep={activeStep} orientation="vertical">
                {steps.map((s, i) => (
                  <Step key={s.label} completed={i < activeStep || planted}>
                    <StepLabel>
                      <SoftTypography variant="caption" fontWeight="bold">{s.label}</SoftTypography>
                    </StepLabel>
                    <StepContent>
                      <SoftTypography variant="caption" color="secondary">{s.desc}</SoftTypography>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </Card>
          </SoftBox>

          {/* Content */}
          <SoftBox flex={1}>
            {/* Step 0: Select template */}
            {activeStep === 0 && (
              <Card sx={{ p: 2.5 }}>
                <SoftTypography variant="h6" fontWeight="bold" mb={2}>القوالب المتاحة</SoftTypography>
                <SoftBox
                  sx={{
                    border: "2px solid #17c1e8", borderRadius: 2, p: 2,
                    background: "#e3f8fd", cursor: "pointer",
                  }}
                >
                  <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start">
                    <SoftBox>
                      <SoftTypography variant="body2" fontWeight="bold">{SCF_TEMPLATE.name}</SoftTypography>
                      <SoftTypography variant="caption" color="secondary">{SCF_TEMPLATE.description}</SoftTypography>
                    </SoftBox>
                    <Chip label={`v${SCF_TEMPLATE.version}`} size="small" color="info" />
                  </SoftBox>
                  <SoftBox display="flex" gap={1} mt={1.5} flexWrap="wrap">
                    {SCF_TEMPLATE.groups.map((g) => (
                      <Chip key={g.root} label={g.label} size="small"
                        sx={{ background: clsColors[g.classification]?.bg, color: clsColors[g.classification]?.color, fontSize: "0.7rem" }} />
                    ))}
                    <Chip label={`${SCF_TEMPLATE.codeDigits} خانات`} size="small" />
                    <Chip label={`آخر تحديث: ${SCF_TEMPLATE.lastUpdated}`} size="small" />
                  </SoftBox>
                </SoftBox>
                <SoftBox mt={2} display="flex" justifyContent="flex-end">
                  <SoftButton variant="gradient" color="info" onClick={() => setActiveStep(1)}>
                    <VisibilityIcon sx={{ mr: 0.5, fontSize: 16 }} /> معاينة الشجرة
                  </SoftButton>
                </SoftBox>
              </Card>
            )}

            {/* Step 1: Preview */}
            {activeStep === 1 && (
              <Card sx={{ p: 2.5 }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <SoftTypography variant="h6" fontWeight="bold">معاينة القالب: {SCF_TEMPLATE.name}</SoftTypography>
                  <Chip label={`${SCF_TEMPLATE.groups.reduce((s, g) => s + g.items.length + 1, 0)} حساب إجمالاً`} color="info" size="small" />
                </SoftBox>
                {SCF_TEMPLATE.groups.map((g) => (
                  <GroupPreview key={g.root} group={g} open={!!openGroups[g.root]} onToggle={() => toggleGroup(g.root)} />
                ))}
                <SoftBox mt={2} display="flex" gap={1} justifyContent="flex-end">
                  <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setActiveStep(0)}>رجوع</SoftButton>
                  <SoftButton variant="gradient" color="info" onClick={() => setActiveStep(2)}>
                    <HealthAndSafetyIcon sx={{ mr: 0.5, fontSize: 16 }} /> فحص الصحة
                  </SoftButton>
                </SoftBox>
              </Card>
            )}

            {/* Step 2: Health check */}
            {activeStep === 2 && (
              <Card sx={{ p: 2.5 }}>
                <SoftTypography variant="h6" fontWeight="bold" mb={2}>فحص صحة القالب</SoftTypography>
                <List dense>
                  {healthChecks.map((c) => (
                    <ListItem key={c.id} sx={{ px: 0 }}>
                      {c.ok
                        ? <CheckCircleIcon sx={{ color: "#82d616", mr: 1.5, fontSize: 20 }} />
                        : <WarningAmberIcon sx={{ color: "#fb8c00", mr: 1.5, fontSize: 20 }} />
                      }
                      <ListItemText
                        primary={<SoftTypography variant="caption" fontWeight="bold">{c.label}</SoftTypography>}
                        secondary={c.detail ? <SoftTypography variant="caption" color="secondary">{c.detail}</SoftTypography> : null}
                      />
                    </ListItem>
                  ))}
                </List>
                {!allPassed && (
                  <SoftBox p={1.5} sx={{ background: "#fff3e0", borderRadius: 2, border: "1px solid #fb8c0044" }} mb={2}>
                    <SoftTypography variant="caption" sx={{ color: "#fb8c00" }}>
                      <WarningAmberIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                      يمكن زرع الشجرة مع وجود تحذيرات — لكن يُنصح بإكمال الإعدادات بعد الزرع.
                    </SoftTypography>
                  </SoftBox>
                )}
                <SoftBox display="flex" gap={1} justifyContent="flex-end">
                  <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setActiveStep(1)}>رجوع</SoftButton>
                  <SoftButton variant="gradient" color="success" onClick={() => setActiveStep(3)}>
                    متابعة للزرع
                  </SoftButton>
                </SoftBox>
              </Card>
            )}

            {/* Step 3: Plant */}
            {activeStep === 3 && (
              <Card sx={{ p: 2.5 }}>
                {!planted ? (
                  <>
                    <SoftTypography variant="h6" fontWeight="bold" mb={1}>تأكيد زرع الشجرة</SoftTypography>
                    <SoftTypography variant="body2" color="secondary" mb={2}>
                      سيتم إنشاء{" "}
                      <strong>{SCF_TEMPLATE.groups.reduce((s, g) => s + g.items.length + 1, 0)}</strong> حساباً
                      من قالب <strong>{SCF_TEMPLATE.name}</strong> v{SCF_TEMPLATE.version}.
                      لا يمكن التراجع عن هذه العملية.
                    </SoftTypography>
                    <SoftBox p={1.5} sx={{ background: "#ffeaea", borderRadius: 2, border: "1px solid #ea060622" }} mb={2}>
                      <SoftTypography variant="caption" sx={{ color: "#ea0606" }}>
                        <ErrorOutlineIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "middle" }} />
                        هذا الإجراء للإعداد الأولي فقط. إذا كانت لديك قيود محاسبية مسبقة، الزرع سيلغي الربط.
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox display="flex" gap={1} justifyContent="flex-end">
                      <SoftButton variant="outlined" color="secondary" size="small" onClick={() => setActiveStep(2)}>رجوع</SoftButton>
                      <SoftButton variant="gradient" color="error" onClick={() => setPlanted(true)}>
                        <PlayArrowIcon sx={{ mr: 0.5, fontSize: 16 }} /> زرع الشجرة الافتراضية
                      </SoftButton>
                    </SoftBox>
                  </>
                ) : (
                  <SoftBox textAlign="center" py={3}>
                    <CheckCircleIcon sx={{ fontSize: 56, color: "#82d616", mb: 2 }} />
                    <SoftTypography variant="h6" fontWeight="bold" mb={1}>تمت عملية الزرع بنجاح</SoftTypography>
                    <SoftTypography variant="caption" color="secondary">
                      تم إنشاء شجرة الحسابات من قالب {SCF_TEMPLATE.name}. يمكنك الآن إضافة حسابات مخصصة أو تعديل الشجرة.
                    </SoftTypography>
                    <SoftBox mt={2}>
                      <SoftButton variant="gradient" color="info" href="/accounting/accounts-tree">
                        <AccountTreeIcon sx={{ mr: 0.5, fontSize: 16 }} /> عرض شجرة الحسابات
                      </SoftButton>
                    </SoftBox>
                  </SoftBox>
                )}
              </Card>
            )}
          </SoftBox>
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
