/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SaveIcon from "@mui/icons-material/Save";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

const categories = ["مسامير وبراغي", "أدوات", "كهرباء", "سباكة", "دهانات", "مواد عزل", "معدات"];
const units = ["قطعة", "متر", "كيلوغرام", "لتر", "علبة", "لفة", "كرتون", "طقم"];

// ─── Image Upload Box ─────────────────────────────────────────────────────────
function ImageUploadZone({ images, onAdd, onRemove }) {
  return (
    <SoftBox>
      <SoftBox display="flex" gap={2} flexWrap="wrap" mb={2}>
        {images.map((img, i) => (
          <SoftBox
            key={i}
            sx={{
              width: 100,
              height: 100,
              borderRadius: 2,
              background: img.color || "#e9ecef",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              border: "1px solid #e0e0e0",
            }}
          >
            <SoftTypography variant="caption" color="secondary">صورة {i + 1}</SoftTypography>
            <IconButton
              size="small"
              onClick={() => onRemove(i)}
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                background: "#ea0606",
                color: "#fff",
                p: 0.2,
                "&:hover": { background: "#c62828" },
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </SoftBox>
        ))}

        {/* Add Image Button */}
        <SoftBox
          onClick={onAdd}
          sx={{
            width: 100,
            height: 100,
            borderRadius: 2,
            border: "2px dashed #17c1e8",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            "&:hover": { background: "#f0f7ff" },
          }}
        >
          <AddPhotoAlternateIcon sx={{ color: "#17c1e8", fontSize: 28 }} />
          <SoftTypography variant="caption" color="info" mt={0.5}>إضافة</SoftTypography>
        </SoftBox>
      </SoftBox>

      {/* AI Processing Section */}
      {images.length > 0 && (
        <SoftBox
          p={2}
          sx={{
            background: "linear-gradient(135deg, #667eea22, #764ba222)",
            borderRadius: 2,
            border: "1px solid #667eea44",
          }}
        >
          <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <SoftBox display="flex" alignItems="center" gap={1}>
              <AutoAwesomeIcon sx={{ color: "#667eea" }} />
              <SoftTypography variant="caption" fontWeight="bold" color="text">
                معالجة الصور بالذكاء الاصطناعي
              </SoftTypography>
            </SoftBox>
            <Chip label="GPT-4o Vision" size="small" sx={{ background: "#667eea22", color: "#667eea", fontSize: 10 }} />
          </SoftBox>
          <SoftTypography variant="caption" color="secondary" display="block" mb={1.5}>
            إزالة الخلفية وتحسين جودة الصورة مع الحفاظ على تفاصيل المنتج
          </SoftTypography>
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="gradient" color="info" size="small" startIcon={<AutoAwesomeIcon />}>
              معالجة الكل
            </SoftButton>
            <SoftButton variant="outlined" color="secondary" size="small">
              معالجة مختارة
            </SoftButton>
          </SoftBox>
        </SoftBox>
      )}
    </SoftBox>
  );
}

// ─── AI Import Section ────────────────────────────────────────────────────────
function AIImportSection() {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateProcess = () => {
    setProcessing(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setProcessing(false);
          return 100;
        }
        return p + 10;
      });
    }, 200);
  };

  return (
    <Card sx={{ p: 3 }}>
      <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
        <AutoAwesomeIcon sx={{ color: "#667eea" }} />
        <SoftTypography variant="h6" fontWeight="bold">
          استيراد بالذكاء الاصطناعي
        </SoftTypography>
        <Chip label="تجريبي" size="small" color="warning" sx={{ height: 20, fontSize: 10 }} />
      </SoftBox>
      <SoftTypography variant="body2" color="text" mb={2}>
        ارفع ملف Excel أو PDF أو صور أصناف وسيقوم الذكاء الاصطناعي باستخراج البيانات تلقائياً.
      </SoftTypography>

      {/* Drop Zone */}
      <SoftBox
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); }}
        sx={{
          border: `2px dashed ${dragging ? "#17c1e8" : "#e0e0e0"}`,
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          background: dragging ? "#f0f7ff" : "#fafbfc",
          cursor: "pointer",
          transition: "all 0.2s",
          mb: 2,
        }}
      >
        <CloudUploadIcon sx={{ fontSize: 48, color: "#8392ab", mb: 1 }} />
        <SoftTypography variant="body2" color="text" mb={0.5}>
          اسحب الملفات هنا أو
        </SoftTypography>
        <SoftButton variant="outlined" color="info" size="small">
          اختر ملفات
        </SoftButton>
        <SoftTypography variant="caption" color="secondary" display="block" mt={1}>
          Excel, PDF, صور (JPG, PNG) — حجم أقصى 10MB
        </SoftTypography>
      </SoftBox>

      {processing && (
        <SoftBox mb={2}>
          <SoftBox display="flex" justifyContent="space-between" mb={0.5}>
            <SoftTypography variant="caption" color="text">جاري التحليل...</SoftTypography>
            <SoftTypography variant="caption" fontWeight="bold">{progress}%</SoftTypography>
          </SoftBox>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3 }} />
        </SoftBox>
      )}

      <SoftButton
        variant="gradient"
        color="info"
        size="small"
        fullWidth
        startIcon={<AutoAwesomeIcon />}
        onClick={simulateProcess}
        disabled={processing}
      >
        {processing ? "جاري التحليل..." : "تحليل وإدخال بيانات"}
      </SoftButton>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name:            isEdit ? "برغي M10 × 50mm" : "",
    code:            isEdit ? "BRG-010-50" : "",
    category:        isEdit ? "مسامير وبراغي" : "",
    unit:            isEdit ? "قطعة" : "",
    description:     isEdit ? "برغي فولاذي عالي الجودة مقاس M10 طول 50mm." : "",
    initialStock:    isEdit ? "850" : "0",
    weightPerUnit:   isEdit ? "0.05" : "",    // وزن القطعة الواحدة (كغ)
    unitsPerPackage: isEdit ? "100" : "",     // عدد القطع في الكرطون/العلبة
    packageUnit:     isEdit ? "كرطون" : "كرطون", // اسم وحدة التعليب
  });

  const [images, setImages] = useState(
    isEdit ? [{ color: "#FF6B6B88" }, { color: "#FF6B6B55" }] : []
  );

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const addImage = () => {
    const colors = ["#FF6B6B88", "#4ECDC488", "#FFE66D88", "#A8E6CF88", "#DDA0DD88"];
    setImages((prev) => [...prev, { color: colors[prev.length % colors.length] }]);
  };

  const removeImage = (i) => setImages((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = () => navigate("/products");

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        {/* Header */}
        <SoftBox mb={3} display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate(isEdit ? `/products/${id}` : "/products")} size="small">
            <ArrowBackIcon />
          </IconButton>
          <SoftBox flex={1}>
            <SoftTypography variant="h4" fontWeight="bold">
              {isEdit ? "تعديل الصنف" : "إضافة صنف جديد"}
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              {isEdit ? "تعديل بيانات الصنف الموجود" : "إضافة صنف جديد للكتالوج"}
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" gap={1}>
            <SoftButton variant="outlined" color="secondary" size="small" onClick={() => navigate("/products")}>
              إلغاء
            </SoftButton>
            <SoftButton variant="gradient" color="info" size="small" startIcon={<SaveIcon />} onClick={handleSave}>
              حفظ الصنف
            </SoftButton>
          </SoftBox>
        </SoftBox>

        <Grid container spacing={3}>
          {/* ── Left: Main Form ── */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ p: 3, mb: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                المعلومات الأساسية
              </SoftTypography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="اسم الصنف *"
                    value={form.name}
                    onChange={handleChange("name")}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="الكود / المرجع"
                    value={form.code}
                    onChange={handleChange("code")}
                    size="small"
                    placeholder="مثال: BRG-010"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="الفئة *"
                    value={form.category}
                    onChange={handleChange("category")}
                    size="small"
                  >
                    {categories.map((c) => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="وحدة القياس *"
                    value={form.unit}
                    onChange={handleChange("unit")}
                    size="small"
                  >
                    {units.map((u) => (
                      <MenuItem key={u} value={u}>{u}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="الوصف"
                    value={form.description}
                    onChange={handleChange("description")}
                    size="small"
                    placeholder="وصف تفصيلي للصنف..."
                  />
                </Grid>
              </Grid>
            </Card>

            {/* Weight & Packaging */}
            <Card sx={{ p: 3, mb: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={0.5}>
                الوزن والتعليب
              </SoftTypography>
              <SoftTypography variant="caption" color="secondary" display="block" mb={2}>
                هذه البيانات تُستخدم لحساب وزن الطلبية وعدد الكراطين/العلب تلقائياً في السلة وفواتير الطريق
              </SoftTypography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="وزن القطعة الواحدة (كغ)"
                    value={form.weightPerUnit}
                    onChange={handleChange("weightPerUnit")}
                    size="small"
                    inputProps={{ min: 0, step: 0.001 }}
                    placeholder="مثال: 0.05"
                    helperText="وزن وحدة قياس واحدة بالكيلوغرام"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="عدد القطع في الكرطون / العلبة"
                    value={form.unitsPerPackage}
                    onChange={handleChange("unitsPerPackage")}
                    size="small"
                    inputProps={{ min: 1, step: 1 }}
                    placeholder="مثال: 100"
                    helperText="كم قطعة في كل وحدة تعليب"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    select
                    label="اسم وحدة التعليب"
                    value={form.packageUnit}
                    onChange={handleChange("packageUnit")}
                    size="small"
                    helperText="العلبة، الكرطون، الساشيه..."
                  >
                    {["كرطون", "علبة", "ساشيه", "كيس", "رزمة", "طرد"].map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* Live preview */}
              {form.weightPerUnit && form.unitsPerPackage && Number(form.weightPerUnit) > 0 && Number(form.unitsPerPackage) > 0 && (
                <SoftBox mt={2} p={1.5} sx={{ background: "#f0f7ff", borderRadius: 2, border: "1px solid #17c1e822" }}>
                  <SoftTypography variant="caption" color="secondary" fontWeight="bold" display="block" mb={0.5}>
                    مثال حي:
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    ▸ طلب <strong>200 {form.unit || "قطعة"}</strong> يعني{" "}
                    <strong style={{ color: "#17c1e8" }}>
                      {Math.ceil(200 / Number(form.unitsPerPackage))} {form.packageUnit}
                    </strong>{" "}
                    و وزن إجمالي{" "}
                    <strong style={{ color: "#fb8c00" }}>
                      {(200 * Number(form.weightPerUnit)).toFixed(2)} كغ
                    </strong>
                  </SoftTypography>
                </SoftBox>
              )}
            </Card>

            {/* Stock */}
            {!isEdit && (
              <Card sx={{ p: 3, mb: 3 }}>
                <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                  المخزون الابتدائي
                </SoftTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="الكمية الابتدائية"
                      value={form.initialStock}
                      onChange={handleChange("initialStock")}
                      size="small"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="حد التنبيه (مخزون منخفض)"
                      size="small"
                      defaultValue={20}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </Card>
            )}

            {/* Images */}
            <Card sx={{ p: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                الصور
              </SoftTypography>
              <ImageUploadZone images={images} onAdd={addImage} onRemove={removeImage} />
            </Card>
          </Grid>

          {/* ── Right: AI Import ── */}
          <Grid item xs={12} lg={4}>
            <AIImportSection />

            {/* Quick Tips */}
            <Card sx={{ p: 3, mt: 3 }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2}>
                نصائح
              </SoftTypography>
              {[
                "الكود يجب أن يكون فريدًا لكل صنف",
                "أضف صورة واضحة للصنف لتسهيل التعرف عليه",
                "يمكن استخدام الذكاء الاصطناعي لمعالجة صور المنتجات",
                "حدد الفئة الصحيحة لتسهيل البحث والتصفية",
              ].map((tip, i) => (
                <SoftBox key={i} display="flex" gap={1} mb={1}>
                  <SoftTypography variant="caption" color="info" fontWeight="bold">•</SoftTypography>
                  <SoftTypography variant="caption" color="text">{tip}</SoftTypography>
                </SoftBox>
              ))}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ProductForm;
