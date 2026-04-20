/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
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

import AddLinkIcon from "@mui/icons-material/AddLink";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LinkIcon from "@mui/icons-material/Link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import {
  PERMISSION_DEFS,
  mockMyInviteCodes,
  mockActivePartnerships,
  mockPendingApprovals,
  mockMyPendingRequests,
} from "data/mock/partnershipMock";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const riskColor = { low: "#82d616", medium: "#fb8c00", high: "#ea0606" };
const riskLabel = { low: "منخفض", medium: "متوسط", high: "عالٍ" };

function PermBadge({ perm }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, fontSize: 10, color: riskColor[perm.risk], background: `${riskColor[perm.risk]}18`, border: `1px solid ${riskColor[perm.risk]}44`, borderRadius: 1, px: 0.8, py: 0.3 }}>
      {perm.labelAr}
    </Box>
  );
}

function PermissionSummary({ permissions }) {
  const granted = PERMISSION_DEFS.filter((d) => permissions[d.key]);
  if (granted.length === 0) return <Box sx={{ fontSize: 11, color: "#adb5bd" }}>لا صلاحيات</Box>;
  return (
    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
      {granted.map((d) => <PermBadge key={d.key} perm={d} />)}
    </Box>
  );
}

// ─── Generate Code Dialog ─────────────────────────────────────────────────────
function GenerateCodeDialog({ open, onClose }) {
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [perms, setPerms] = useState({
    view_inventory: true,
    view_pricing: false,
    view_sales_data: false,
    clone_products: false,
    create_purchase_link: false,
  });
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);

  const togglePerm = (key) => setPerms((p) => ({ ...p, [key]: !p[key] }));

  const handleGenerate = () => {
    const code = `LINK-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setGenerated(code);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(generated).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setGenerated(null);
    setLabel("");
    setMaxUses("");
    setExpiresAt("");
    setPerms({ view_inventory: true, view_pricing: false, view_sales_data: false, clone_products: false, create_purchase_link: false });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>إنشاء كود ربط جديد</Box>
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!generated ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField label="تسمية الكود (للاستخدام الداخلي)" value={label} onChange={(e) => setLabel(e.target.value)}
              size="small" fullWidth placeholder="مثال: كود الموزعين الشماليين" />

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <TextField label="أقصى استخدامات (فارغ = غير محدود)" value={maxUses} onChange={(e) => setMaxUses(e.target.value)}
                size="small" type="number" />
              <TextField label="ينتهي في" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                size="small" type="date" InputLabelProps={{ shrink: true }} />
            </Box>

            <Divider />

            <Box>
              <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1.5 }}>الصلاحيات الممنوحة</Box>
              {PERMISSION_DEFS.map((def) => (
                <Box key={def.key} sx={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  py: 1.2, borderBottom: "1px solid #f0f2f5",
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.3 }}>
                      <Box sx={{ fontSize: 13, fontWeight: 500, color: "#344767" }}>{def.labelAr}</Box>
                      <Box sx={{ fontSize: 9, color: riskColor[def.risk], background: `${riskColor[def.risk]}18`, px: 0.8, py: 0.2, borderRadius: 1 }}>
                        خطر {riskLabel[def.risk]}
                      </Box>
                    </Box>
                    <Box sx={{ fontSize: 11, color: "#8392ab" }}>{def.descAr}</Box>
                  </Box>
                  <Switch
                    size="small"
                    checked={perms[def.key]}
                    onChange={() => togglePerm(def.key)}
                    sx={{ flexShrink: 0, ml: 1 }}
                  />
                </Box>
              ))}
            </Box>

            <Box sx={{ background: "#fff3e0", border: "1px solid #fb8c0044", borderRadius: 2, p: 1.5, display: "flex", gap: 1 }}>
              <WarningAmberIcon sx={{ fontSize: 16, color: "#fb8c00", flexShrink: 0, mt: 0.2 }} />
              <Box sx={{ fontSize: 11, color: "#344767" }}>
                أرسل الكود فقط للجهات التي تثق بها. لا تنشره علناً. يمكنك إلغاء تفعيله في أي وقت.
              </Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <Box sx={{ fontSize: 13, color: "#8392ab", mb: 2 }}>تم إنشاء كود الربط بنجاح</Box>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 2,
              background: "#f8f9fa", border: "2px dashed #dee2e6", borderRadius: 2,
              px: 3, py: 2, mb: 2,
            }}>
              <Box sx={{ fontSize: 22, fontWeight: 800, color: "#344767", letterSpacing: 2 }}>{generated}</Box>
              <Tooltip title={copied ? "تم النسخ!" : "نسخ"}>
                <IconButton size="small" onClick={handleCopy}>
                  <ContentCopyIcon sx={{ fontSize: 18, color: copied ? "#82d616" : "#8392ab" }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ fontSize: 12, color: "#ea0606", fontWeight: 500 }}>
              احفظ هذا الكود الآن — لن يُعرض مرة أخرى كاملاً
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {!generated ? (
          <>
            <Box component="button" onClick={handleClose}
              sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab" }}>
              إلغاء
            </Box>
            <Box component="button" onClick={handleGenerate}
              sx={{ background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600 }}>
              إنشاء الكود
            </Box>
          </>
        ) : (
          <Box component="button" onClick={handleClose}
            sx={{ background: "linear-gradient(135deg, #82d616, #5faa0e)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.8 }}>
            <CheckIcon sx={{ fontSize: 16 }} /> حسناً، تم الحفظ
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── Submit Code Dialog ───────────────────────────────────────────────────────
function SubmitCodeDialog({ open, onClose }) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => setSubmitted(true);
  const handleClose = () => { setCode(""); setMessage(""); setSubmitted(false); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>إدخال كود ربط</Box>
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!submitted ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="كود الربط"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              size="small" fullWidth
              placeholder="مثال: NORTH-DIST-K7X2"
              inputProps={{ style: { fontFamily: "monospace", fontSize: 15, letterSpacing: 2 } }}
            />
            <TextField
              label="رسالة للطرف الآخر (اختياري)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              size="small" fullWidth multiline rows={2}
              placeholder="أهلاً، نرغب في الاطلاع على مخزونكم لتنسيق التوريد..."
            />
            <Box sx={{ background: "#e3f8fd", border: "1px solid #b2ebf9", borderRadius: 2, p: 1.5, fontSize: 11, color: "#344767" }}>
              <Box sx={{ fontWeight: 600, mb: 0.5 }}>بعد الإرسال:</Box>
              <Box>• سيصل طلبك للطرف المُصدِر للكود</Box>
              <Box>• عليه الموافقة أو الرفض</Box>
              <Box>• ستُفعَّل الصلاحيات التي حددها هو فقط بعد الموافقة</Box>
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <HourglassEmptyIcon sx={{ fontSize: 48, color: "#fb8c00", mb: 1 }} />
            <Box sx={{ fontSize: 14, fontWeight: 600, color: "#344767", mb: 0.5 }}>تم إرسال طلب الربط</Box>
            <Box sx={{ fontSize: 12, color: "#8392ab" }}>في انتظار موافقة الطرف الآخر. ستجد الطلب في تبويب &quot;طلباتي&quot;.</Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {!submitted ? (
          <>
            <Box component="button" onClick={handleClose}
              sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab" }}>
              إلغاء
            </Box>
            <Box component="button" onClick={handleSubmit} disabled={!code}
              sx={{ background: code ? "linear-gradient(135deg, #17c1e8, #0ea5c9)" : "#dee2e6", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: code ? "pointer" : "default", fontSize: 13, color: "#fff", fontWeight: 600 }}>
              إرسال الطلب
            </Box>
          </>
        ) : (
          <Box component="button" onClick={handleClose}
            sx={{ background: "linear-gradient(135deg, #82d616, #5faa0e)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600 }}>
            إغلاق
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── Approval Dialog ──────────────────────────────────────────────────────────
function ApprovalDialog({ request, onClose }) {
  const [perms, setPerms] = useState({
    view_inventory: true,
    view_pricing: false,
    view_sales_data: false,
    clone_products: false,
    create_purchase_link: false,
  });
  if (!request) return null;

  return (
    <Dialog open={!!request} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box>
          <Box sx={{ fontWeight: 700 }}>مراجعة طلب الربط</Box>
          <Box sx={{ fontSize: 12, color: "#8392ab" }}>من: {request.partnerName}</Box>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
            {[
              { label: "الشركة", value: request.partnerName },
              { label: "البريد", value: request.partnerEmail },
              { label: "الولاية", value: request.partnerWilaya },
              { label: "الكود المستخدم", value: request.inviteCode },
              { label: "تاريخ الطلب", value: request.requestedAt },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Box sx={{ fontSize: 10, color: "#8392ab", mb: 0.2 }}>{label}</Box>
                <Box sx={{ fontSize: 12, fontWeight: 500, color: "#344767" }}>{value}</Box>
              </Box>
            ))}
          </Box>
          {request.message && (
            <Box sx={{ background: "#f8f9fa", borderRadius: 2, p: 1.5, fontSize: 12, color: "#344767", fontStyle: "italic" }}>
              &ldquo;{request.message}&rdquo;
            </Box>
          )}

          <Divider />

          <Box>
            <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767", mb: 1 }}>حدد الصلاحيات التي تمنحها لهم</Box>
            {PERMISSION_DEFS.map((def) => (
              <Box key={def.key} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1, borderBottom: "1px solid #f0f2f5" }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box sx={{ fontSize: 12, fontWeight: 500, color: "#344767" }}>{def.labelAr}</Box>
                    <Box sx={{ fontSize: 9, color: riskColor[def.risk] }}>({riskLabel[def.risk]})</Box>
                  </Box>
                  <Box sx={{ fontSize: 10, color: "#adb5bd" }}>{def.descAr}</Box>
                </Box>
                <Switch size="small" checked={perms[def.key]} onChange={() => setPerms((p) => ({ ...p, [def.key]: !p[def.key] }))} />
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Box component="button" onClick={onClose}
          sx={{ background: "#ffeaea", border: "1px solid #ea060644", color: "#ea0606", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5 }}>
          <CloseIcon sx={{ fontSize: 14 }} /> رفض
        </Box>
        <Box component="button" onClick={onClose}
          sx={{ background: "linear-gradient(135deg, #82d616, #5faa0e)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, marginLeft: "auto" }}>
          <CheckIcon sx={{ fontSize: 14 }} /> قبول وتفعيل الربط
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Partnerships() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [genOpen, setGenOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);

  const pendingCount = mockPendingApprovals.length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">شبكة الشركاء</SoftTypography>
            <SoftTypography variant="caption" color="secondary">
              ربط مشتركين آخرين لمشاركة المخزون وتبادل الطلبيات تلقائياً
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            <Box component="button" onClick={() => setSubmitOpen(true)}
              sx={{ display: "flex", alignItems: "center", gap: 0.8, background: "#fff", border: "1px solid #dee2e6", borderRadius: "10px", px: 2, py: 0.9, cursor: "pointer", color: "#344767", fontSize: 13, fontWeight: 500 }}>
              <VpnKeyIcon sx={{ fontSize: 16 }} /> إدخال كود ربط
            </Box>
            <Box component="button" onClick={() => setGenOpen(true)}
              sx={{ display: "flex", alignItems: "center", gap: 0.8, background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", border: "none", borderRadius: "10px", px: 2.5, py: 0.9, cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13 }}>
              <AddLinkIcon sx={{ fontSize: 16 }} /> إنشاء كود ربط
            </Box>
          </SoftBox>
        </SoftBox>

        {/* Info banner */}
        <Card sx={{ p: 2, mb: 2.5, background: "linear-gradient(135deg, #f0f7ff, #e8f4fd)", border: "1px solid #b2d8f0" }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {[
              { icon: "1", text: "أنشئ كود ربط وحدد الصلاحيات، ثم أرسله لشريكك" },
              { icon: "2", text: "يدخل الشريك الكود → تراجع الطلب وتوافق" },
              { icon: "3", text: "بعد الموافقة: يستفيدان من مشاركة المخزون وربط الطلبيات" },
            ].map(({ icon, text }) => (
              <Box key={icon} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 22, height: 22, borderRadius: "50%", background: "#17c1e8", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</Box>
                <Box sx={{ fontSize: 12, color: "#344767" }}>{text}</Box>
              </Box>
            ))}
          </Box>
        </Card>

        <Card>
          <SoftBox borderBottom="1px solid #eee">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit"
              TabIndicatorProps={{ style: { background: "#17c1e8" } }}>
              <Tab label={<SoftTypography variant="caption" fontWeight="medium">شركائي ({mockActivePartnerships.length})</SoftTypography>} />
              <Tab label={
                <SoftBox display="flex" alignItems="center" gap={0.5}>
                  <SoftTypography variant="caption" fontWeight="medium">طلبات معلقة</SoftTypography>
                  {pendingCount > 0 && (
                    <Box sx={{ background: "#ea0606", color: "#fff", fontSize: 9, fontWeight: 700, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {pendingCount}
                    </Box>
                  )}
                </SoftBox>
              } />
              <Tab label={<SoftTypography variant="caption" fontWeight="medium">كوداتي ({mockMyInviteCodes.length})</SoftTypography>} />
              <Tab label={<SoftTypography variant="caption" fontWeight="medium">طلباتي ({mockMyPendingRequests.length})</SoftTypography>} />
            </Tabs>
          </SoftBox>

          <SoftBox p={2}>

            {/* ── Tab 0: Active Partners ─────────────────────────────────── */}
            {tab === 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f8f9fa" }}>
                      {["الشركة الشريكة", "الولاية", "الدور", "الصلاحيات", "تاريخ الربط", ""].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockActivePartnerships.map((p) => (
                      <TableRow key={p.id} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                        <TableCell>
                          <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767" }}>{p.partnerName}</Box>
                          <Box sx={{ fontSize: 10, color: "#adb5bd" }}>{p.partnerEmail}</Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#8392ab" }}>{p.partnerWilaya}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.direction === "provider" ? "مورِّد (يطلب منك)" : "مصدر (تطلب منه)"}
                            size="small"
                            sx={{
                              fontSize: 10, fontWeight: 600,
                              background: p.direction === "provider" ? "#e3f8fd" : "#f0fde4",
                              color: p.direction === "provider" ? "#17c1e8" : "#82d616",
                            }}
                          />
                        </TableCell>
                        <TableCell><PermissionSummary permissions={p.permissions} /></TableCell>
                        <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>{p.approvedAt}</TableCell>
                        <TableCell>
                          <SoftBox display="flex" gap={0.5}>
                            {p.permissions.view_inventory && (
                              <Tooltip title="عرض مخزون الشريك">
                                <IconButton size="small" onClick={() => navigate(`/partnerships/inventory/${p.partnerUuid}`, { state: { partner: p } })}>
                                  <OpenInNewIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="إدارة الصلاحيات">
                              <IconButton size="small" onClick={() => setApprovalTarget({ ...mockPendingApprovals[0], partnerName: p.partnerName, partnerEmail: p.partnerEmail, partnerWilaya: p.partnerWilaya, inviteCode: p.inviteCode, requestedAt: p.approvedAt, message: "" })}>
                                <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </SoftBox>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ── Tab 1: Pending Approvals ───────────────────────────────── */}
            {tab === 1 && (
              mockPendingApprovals.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5, color: "#8392ab", fontSize: 13 }}>لا توجد طلبات معلقة</Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {mockPendingApprovals.map((req) => (
                    <Box key={req.id} sx={{
                      border: "1px solid #fb8c0044", borderRadius: 2, p: 2,
                      background: "#fff9f0", display: "flex", gap: 2, alignItems: "flex-start",
                    }}>
                      <WarningAmberIcon sx={{ fontSize: 20, color: "#fb8c00", flexShrink: 0, mt: 0.3 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ fontSize: 13, fontWeight: 700, color: "#344767" }}>{req.partnerName}</Box>
                        <Box sx={{ fontSize: 11, color: "#8392ab", mb: 0.5 }}>{req.partnerEmail} · {req.partnerWilaya} · {req.requestedAt}</Box>
                        <Box sx={{ fontSize: 11, color: "#344767", mb: 0.5 }}>الكود المستخدم: <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{req.inviteCode}</Box></Box>
                        {req.message && (
                          <Box sx={{ fontSize: 11, color: "#8392ab", fontStyle: "italic" }}>&ldquo;{req.message}&rdquo;</Box>
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        <Box component="button"
                          sx={{ background: "#ffeaea", border: "1px solid #ea060644", color: "#ea0606", borderRadius: 2, px: 1.5, py: 0.6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                          رفض
                        </Box>
                        <Box component="button" onClick={() => setApprovalTarget(req)}
                          sx={{ background: "linear-gradient(135deg, #82d616, #5faa0e)", border: "none", borderRadius: 2, px: 1.5, py: 0.6, cursor: "pointer", fontSize: 12, color: "#fff", fontWeight: 600 }}>
                          مراجعة وقبول
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )
            )}

            {/* ── Tab 2: My Invite Codes ─────────────────────────────────── */}
            {tab === 2 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f8f9fa" }}>
                      {["الكود", "التسمية", "الصلاحيات", "الاستخدامات", "انتهاء الصلاحية", "الحالة", ""].map((h) => (
                        <TableCell key={h} sx={{ fontSize: 11, fontWeight: 700, color: "#8392ab", py: 1.2 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {mockMyInviteCodes.map((c) => (
                      <TableRow key={c.id} sx={{ "&:hover": { background: "#f8f9fa" } }}>
                        <TableCell>
                          <Box sx={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#344767", letterSpacing: 1 }}>{c.code}</Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#344767" }}>{c.label}</TableCell>
                        <TableCell><PermissionSummary permissions={c.permissions} /></TableCell>
                        <TableCell sx={{ fontSize: 12, color: "#344767" }}>
                          {c.usesCount} / {c.maxUses ?? "∞"}
                        </TableCell>
                        <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>{c.expiresAt ?? "غير محدود"}</TableCell>
                        <TableCell>
                          <Chip
                            label={c.isActive ? "نشط" : "معطَّل"}
                            size="small"
                            sx={{ fontSize: 10, fontWeight: 600, background: c.isActive ? "#f0fde4" : "#f8f9fa", color: c.isActive ? "#82d616" : "#8392ab" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="نسخ الكود">
                            <IconButton size="small" onClick={() => navigator.clipboard?.writeText(c.code).catch(() => {})}>
                              <ContentCopyIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* ── Tab 3: My Submitted Requests ──────────────────────────── */}
            {tab === 3 && (
              mockMyPendingRequests.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 5, color: "#8392ab", fontSize: 13 }}>لم تقدم أي طلبات</Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {mockMyPendingRequests.map((req) => (
                    <Box key={req.id} sx={{ border: "1px solid #b2ebf9", borderRadius: 2, p: 2, background: "#f0f7ff", display: "flex", gap: 2, alignItems: "center" }}>
                      <HourglassEmptyIcon sx={{ fontSize: 20, color: "#17c1e8", flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ fontSize: 13, fontWeight: 700, color: "#344767" }}>{req.partnerName}</Box>
                        <Box sx={{ fontSize: 11, color: "#8392ab" }}>{req.partnerEmail} · {req.partnerWilaya}</Box>
                        <Box sx={{ fontSize: 11, color: "#344767", mt: 0.3 }}>
                          الكود: <Box component="span" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{req.inviteCode}</Box>
                          {" · "} أُرسل في {req.submittedAt}
                        </Box>
                      </Box>
                      <Chip label="في الانتظار" size="small" sx={{ background: "#fff3e0", color: "#fb8c00", fontWeight: 600, fontSize: 10 }} />
                    </Box>
                  ))}
                </Box>
              )
            )}

          </SoftBox>
        </Card>
      </SoftBox>

      <GenerateCodeDialog open={genOpen} onClose={() => setGenOpen(false)} />
      <SubmitCodeDialog open={submitOpen} onClose={() => setSubmitOpen(false)} />
      <ApprovalDialog request={approvalTarget} onClose={() => setApprovalTarget(null)} />
      <Footer />
    </DashboardLayout>
  );
}
