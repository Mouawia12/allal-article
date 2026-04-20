/* eslint-disable react/prop-types */
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FilterListIcon from "@mui/icons-material/FilterList";
import InventoryIcon from "@mui/icons-material/Inventory";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import { mockActivePartnerships, mockPartnerProducts } from "data/mock/partnershipMock";

const fmt = (n) => n?.toLocaleString("fr-DZ") ?? "—";

// ─── Clone Confirm Dialog ─────────────────────────────────────────────────────
function CloneDialog({ products, onClose }) {
  const [cloned, setCloned] = useState(false);
  if (!products) return null;

  return (
    <Dialog open={!!products} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Box sx={{ fontWeight: 700 }}>نسخ الأصناف إلى مخزوني</Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!cloned ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ fontSize: 13, color: "#344767" }}>
              سيتم نسخ <Box component="span" sx={{ fontWeight: 700, color: "#17c1e8" }}>{products.length} صنف</Box> إلى مخزونك مع:
            </Box>
            <Box component="ul" sx={{ m: 0, pl: 2.5, fontSize: 12, color: "#344767", lineHeight: 2 }}>
              <li>الاسم والوصف والفئة</li>
              <li>وحدة القياس والباركود</li>
              <li>الصور (إن وُجدت)</li>
              <li>السعر (إذا كانت صلاحية عرض الأسعار مفعّلة)</li>
            </Box>
            <Box sx={{ background: "#fff3e0", border: "1px solid #fb8c0044", borderRadius: 2, p: 1.5, fontSize: 11, color: "#344767" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.5 }}>
                <WarningAmberIcon sx={{ fontSize: 14, color: "#fb8c00" }} />
                <Box sx={{ fontWeight: 600 }}>تنبيه</Box>
              </Box>
              الكميات لن تُنسخ — الكميات في مخزونك خاصة بك. فقط بيانات الصنف تُنسخ.
              إذا كان الصنف موجوداً مسبقاً، ستُحدَّث بياناته.
            </Box>
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 52, color: "#82d616", mb: 1 }} />
            <Box sx={{ fontSize: 15, fontWeight: 700, color: "#344767", mb: 0.5 }}>تمت النسخة بنجاح</Box>
            <Box sx={{ fontSize: 12, color: "#8392ab" }}>تم إضافة/تحديث {products.length} صنف في مخزونك</Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {!cloned ? (
          <>
            <Box component="button" onClick={onClose}
              sx={{ border: "1px solid #dee2e6", background: "transparent", borderRadius: 2, px: 2, py: 0.8, cursor: "pointer", fontSize: 13, color: "#8392ab" }}>
              إلغاء
            </Box>
            <Box component="button" onClick={() => setCloned(true)}
              sx={{ background: "linear-gradient(135deg, #17c1e8, #0ea5c9)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600 }}>
              تأكيد النسخ
            </Box>
          </>
        ) : (
          <Box component="button" onClick={onClose}
            sx={{ background: "linear-gradient(135deg, #82d616, #5faa0e)", border: "none", borderRadius: 2, px: 2.5, py: 0.8, cursor: "pointer", fontSize: 13, color: "#fff", fontWeight: 600 }}>
            إغلاق
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── Stock indicator ──────────────────────────────────────────────────────────
function StockIndicator({ stock }) {
  if (stock === 0) return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#ea0606" }} />
      <Box sx={{ fontSize: 11, color: "#ea0606", fontWeight: 600 }}>نفد</Box>
    </Box>
  );
  if (stock <= 5) return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#fb8c00" }} />
      <Box sx={{ fontSize: 11, color: "#fb8c00", fontWeight: 600 }}>{stock}</Box>
    </Box>
  );
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: "#82d616" }} />
      <Box sx={{ fontSize: 11, color: "#82d616", fontWeight: 600 }}>{stock}</Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LinkedInventory() {
  const navigate = useNavigate();
  const { partnerId } = useParams();
  const { state } = useLocation();

  const partner = state?.partner ?? mockActivePartnerships.find((p) => p.partnerUuid === partnerId);
  const products = mockPartnerProducts[partnerId] ?? [];
  const perms = partner?.permissions ?? {};

  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState("all"); // all | available | out
  const [cloneTarget, setCloneTarget] = useState(null);

  const filtered = products.filter((p) => {
    if (filterStock === "available" && p.stock === 0) return false;
    if (filterStock === "out" && p.stock > 0) return false;
    if (search && !p.nameAr.includes(search) && !p.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const availableCount = products.filter((p) => p.stock > 0).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>

        {/* Header */}
        <SoftBox display="flex" alignItems="center" gap={1.5} mb={0.5}>
          <IconButton size="small" onClick={() => navigate("/partnerships")}>
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <SoftTypography variant="h5" fontWeight="bold">
            مخزون: {partner?.partnerName ?? partnerId}
          </SoftTypography>
          <Chip label={partner?.partnerWilaya} size="small" sx={{ background: "#f0f2f5", color: "#8392ab" }} />
        </SoftBox>
        <SoftBox mb={3} sx={{ pl: 5 }}>
          <SoftTypography variant="caption" color="secondary">
            عرض للقراءة فقط — بيانات مخزون الشريك حسب الصلاحيات الممنوحة
          </SoftTypography>
        </SoftBox>

        {/* Permission badges */}
        <Card sx={{ p: 1.5, mb: 2.5, display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <Box sx={{ fontSize: 11, color: "#8392ab", fontWeight: 600 }}>صلاحياتك:</Box>
          {perms.view_inventory && <Chip label="عرض الكميات" size="small" sx={{ background: "#e3f8fd", color: "#17c1e8", fontSize: 10, fontWeight: 600 }} />}
          {perms.view_pricing && <Chip label="عرض الأسعار" size="small" sx={{ background: "#f0fde4", color: "#82d616", fontSize: 10, fontWeight: 600 }} />}
          {perms.view_sales_data && <Chip label="بيانات المبيعات" size="small" sx={{ background: "#fce4ec", color: "#e91e63", fontSize: 10, fontWeight: 600 }} />}
          {perms.clone_products && <Chip label="نسخ الأصناف" size="small" sx={{ background: "#ede7f6", color: "#7928ca", fontSize: 10, fontWeight: 600 }} />}
          {perms.create_purchase_link && <Chip label="ربط الطلبيات" size="small" sx={{ background: "#fff3e0", color: "#fb8c00", fontSize: 10, fontWeight: 600 }} />}
        </Card>

        {/* Stats */}
        <Box sx={{ display: "flex", gap: 2, mb: 2.5, flexWrap: "wrap" }}>
          <Card sx={{ flex: 1, minWidth: 120, p: 2 }}>
            <Box sx={{ fontSize: 11, color: "#8392ab" }}>إجمالي الأصناف</Box>
            <Box sx={{ fontSize: 22, fontWeight: 700, color: "#344767" }}>{products.length}</Box>
          </Card>
          <Card sx={{ flex: 1, minWidth: 120, p: 2 }}>
            <Box sx={{ fontSize: 11, color: "#8392ab" }}>متاحة في المخزون</Box>
            <Box sx={{ fontSize: 22, fontWeight: 700, color: "#82d616" }}>{availableCount}</Box>
          </Card>
          <Card sx={{ flex: 1, minWidth: 120, p: 2 }}>
            <Box sx={{ fontSize: 11, color: "#8392ab" }}>نفد المخزون</Box>
            <Box sx={{ fontSize: 22, fontWeight: 700, color: "#ea0606" }}>{outCount}</Box>
          </Card>
          {perms.clone_products && (
            <Box
              component="button"
              onClick={() => setCloneTarget(products)}
              sx={{
                display: "flex", alignItems: "center", gap: 0.8,
                background: "linear-gradient(135deg, #7928ca, #5e1e9e)",
                border: "none", borderRadius: "10px", px: 2.5, py: 1,
                cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: 13,
                alignSelf: "stretch",
              }}
            >
              <ContentCopyIcon sx={{ fontSize: 16 }} /> نسخ كل الأصناف لمخزوني
            </Box>
          )}
        </Box>

        {/* Filters */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <TextField
            size="small"
            placeholder="بحث باسم الصنف أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: "#8392ab" }} /></InputAdornment> }}
          />
          {[
            { key: "all", label: "الكل" },
            { key: "available", label: "متاح فقط" },
            { key: "out", label: "نفد فقط" },
          ].map(({ key, label }) => (
            <Chip
              key={key}
              label={label}
              onClick={() => setFilterStock(key)}
              size="small"
              sx={{
                cursor: "pointer",
                background: filterStock === key ? "#17c1e8" : "#f0f2f5",
                color: filterStock === key ? "#fff" : "#8392ab",
                fontWeight: filterStock === key ? 600 : 400,
                fontSize: 12,
              }}
            />
          ))}
          <Box sx={{ fontSize: 12, color: "#8392ab", alignSelf: "center" }}>{filtered.length} صنف</Box>
        </Box>

        {/* Products table */}
        <Card>
          <TableContainer>
            <Table size="small" sx={{ tableLayout: "fixed" }}>
              <TableHead sx={{ "& th": { position: "sticky", top: 0, zIndex: 2 } }}>
                <TableRow sx={{ background: "#f8f9fa" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 80 }}>الكود</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 200 }}>اسم الصنف</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 100 }}>الفئة</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 70 }}>الوحدة</TableCell>
                  {perms.view_inventory && (
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 80 }}>الكمية</TableCell>
                  )}
                  {perms.view_pricing && (
                    <TableCell style={{ textAlign: "right" }} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 110 }}>السعر</TableCell>
                  )}
                  {perms.view_sales_data && (
                    <TableCell style={{ textAlign: "right" }} sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 90 }}>مبيعات/شهر</TableCell>
                  )}
                  {perms.clone_products && (
                    <TableCell sx={{ fontWeight: 700, fontSize: 11, color: "#8392ab", py: 1.2, width: 60 }}></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} sx={{ textAlign: "center", py: 4, color: "#8392ab" }}>لا توجد أصناف</TableCell></TableRow>
                ) : filtered.map((product) => (
                  <TableRow key={product.id} sx={{ "&:hover": { background: "#f8f9fa" }, opacity: product.stock === 0 ? 0.65 : 1 }}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: 11, color: "#8392ab" }}>{product.code}</TableCell>
                    <TableCell sx={{ fontSize: 13, fontWeight: 500, color: "#344767" }}>{product.nameAr}</TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" sx={{ fontSize: 10, background: "#f0f2f5", color: "#8392ab" }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, color: "#8392ab" }}>{product.unit}</TableCell>
                    {perms.view_inventory && (
                      <TableCell><StockIndicator stock={product.stock} /></TableCell>
                    )}
                    {perms.view_pricing && (
                      <TableCell style={{ textAlign: "right" }} sx={{ fontSize: 12, fontWeight: 600, color: "#344767" }}>
                        {fmt(product.price)} دج
                      </TableCell>
                    )}
                    {perms.view_sales_data && (
                      <TableCell style={{ textAlign: "right" }} sx={{ fontSize: 12, color: "#7928ca", fontWeight: 600 }}>
                        {product.monthlySales}
                      </TableCell>
                    )}
                    {perms.clone_products && (
                      <TableCell>
                        <Tooltip title="نسخ هذا الصنف فقط">
                          <IconButton size="small" onClick={() => setCloneTarget([product])}>
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Purchase link hint */}
        {perms.create_purchase_link && (
          <Card sx={{ mt: 2, p: 2, background: "#fff9f0", border: "1px solid #fb8c0044" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <InventoryIcon sx={{ fontSize: 20, color: "#fb8c00" }} />
              <Box>
                <Box sx={{ fontSize: 13, fontWeight: 600, color: "#344767" }}>ربط طلبيات الشراء مفعّل</Box>
                <Box sx={{ fontSize: 11, color: "#8392ab" }}>
                  عند إنشاء طلبية شراء وتحديد هذا المورد، ستظهر أصنافه تلقائياً وتتحول الطلبية إلى فاتورة مبيعات عنده.
                  انتقل إلى <Box component="span" sx={{ color: "#fb8c00", fontWeight: 600, cursor: "pointer" }}
                    onClick={() => navigate("/purchases/new")}>إنشاء طلبية شراء</Box>.
                </Box>
              </Box>
            </Box>
          </Card>
        )}

      </SoftBox>

      <CloneDialog products={cloneTarget} onClose={() => setCloneTarget(null)} />
      <Footer />
    </DashboardLayout>
  );
}
