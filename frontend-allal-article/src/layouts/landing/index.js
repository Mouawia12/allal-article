import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongOutlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAltOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalanceOutlined";
import FactoryIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCartOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import SecurityIcon from "@mui/icons-material/SecurityOutlined";
import SpeedIcon from "@mui/icons-material/SpeedOutlined";
import SupportAgentIcon from "@mui/icons-material/SupportAgentOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useSoftUIController, setLayout } from "context";

// ─── Brand colours ────────────────────────────────────────────────────────────
const C = {
  primary: "#17c1e8",
  primaryDark: "#0ea5c9",
  accent: "#cb0c9f",
  dark: "#0f172a",
  darkCard: "#1e293b",
  text: "#e2e8f0",
  muted: "#94a3b8",
  border: "rgba(255,255,255,0.08)",
  glass: "rgba(255,255,255,0.04)",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <ShoppingCartIcon sx={{ fontSize: 32 }} />, title: "إدارة الطلبيات", desc: "تتبع طلبيات البيع من الإنشاء حتى التسليم مع حالة آنية لكل مرحلة." },
  { icon: <InventoryIcon sx={{ fontSize: 32 }} />, title: "المخزون الذكي", desc: "جرد تلقائي، تنبيهات نفاد المخزون، وتتبع الأصناف عبر مستودعات متعددة." },
  { icon: <ReceiptLongIcon sx={{ fontSize: 32 }} />, title: "المشتريات والموردين", desc: "طلبات الشراء، استلام البضاعة، مرتجعات الموردين وإدارة الذمم الدائنة." },
  { icon: <AccountBalanceIcon sx={{ fontSize: 32 }} />, title: "المحاسبة المتكاملة", desc: "قيد مزدوج، شجرة حسابات، ميزان مراجعة وتقارير مالية احترافية." },
  { icon: <PeopleAltIcon sx={{ fontSize: 32 }} />, title: "إدارة الزبائن", desc: "ملفات الزبائن، سجل الطلبيات، الذمم المدينة ومتابعة المدفوعات." },
  { icon: <FactoryIcon sx={{ fontSize: 32 }} />, title: "التصنيع", desc: "أوامر التصنيع، قوائم المواد (BOM) ومتابعة مراحل الإنتاج." },
  { icon: <TrendingUpIcon sx={{ fontSize: 32 }} />, title: "التقارير والتحليل", desc: "تقارير المبيعات، الأرباح، المخزون والمحاسبة في لوحة بيانات موحدة." },
  { icon: <SecurityIcon sx={{ fontSize: 32 }} />, title: "صلاحيات متعددة", desc: "4 أدوار (مالك، مسؤول، محاسب، موظف) مع ضبط دقيق للصلاحيات." },
];

const PLANS = [
  {
    name: "الأساسي",
    price: "مجاني",
    period: "",
    color: C.muted,
    highlight: false,
    features: [
      "حتى 3 مستخدمين",
      "إدارة الطلبيات",
      "إدارة الأصناف",
      "المخزون البسيط",
      "تقارير أساسية",
    ],
    cta: "ابدأ مجاناً",
    ctaRoute: "/authentication/sign-up",
  },
  {
    name: "الاحترافي",
    price: "2,900",
    period: "دج / شهر",
    color: C.primary,
    highlight: true,
    badge: "الأكثر طلباً",
    features: [
      "حتى 15 مستخدم",
      "كل ميزات الأساسي",
      "المحاسبة المتكاملة",
      "إدارة المشتريات",
      "فواتير الطريق",
      "شبكة الشركاء",
      "دعم أولوي",
    ],
    cta: "ابدأ التجربة",
    ctaRoute: "/authentication/sign-up",
  },
  {
    name: "المؤسسي",
    price: "6,900",
    period: "دج / شهر",
    color: C.accent,
    highlight: false,
    features: [
      "مستخدمون غير محدودين",
      "كل ميزات الاحترافي",
      "التصنيع وBOM",
      "تعدد المستودعات",
      "API للتكامل",
      "دعم مخصص 24/7",
      "نسخ احتياطي يومي",
    ],
    cta: "تواصل معنا",
    ctaRoute: "#contact",
  },
];

const WHY = [
  { icon: <SpeedIcon sx={{ fontSize: 28 }} />, title: "سريع وخفيف", desc: "واجهة رسومية حديثة تعمل على أي جهاز." },
  { icon: <SecurityIcon sx={{ fontSize: 28 }} />, title: "آمن ومشفر", desc: "JWT مع تشفير البيانات وصلاحيات دقيقة." },
  { icon: <SupportAgentIcon sx={{ fontSize: 28 }} />, title: "دعم بالعربية", desc: "فريق دعم محلي يتحدث لغتك." },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradientText({ children, sx = {} }) {
  return (
    <Box
      component="span"
      sx={{
        background: `linear-gradient(90deg, ${C.primary}, ${C.accent})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <Card
      sx={{
        background: C.glass,
        backdropFilter: "blur(12px)",
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        p: 3,
        height: "100%",
        transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 20px 40px rgba(0,0,0,0.3)`,
          borderColor: `${C.primary}55`,
        },
      }}
    >
      <Box sx={{ color: C.primary, mb: 2 }}>{icon}</Box>
      <Box sx={{ color: C.text, fontWeight: 700, fontSize: "1rem", mb: 1 }}>{title}</Box>
      <Box sx={{ color: C.muted, fontSize: "0.85rem", lineHeight: 1.7 }}>{desc}</Box>
    </Card>
  );
}

function PlanCard({ plan }) {
  const isLink = plan.ctaRoute.startsWith("/");
  return (
    <Card
      sx={{
        position: "relative",
        background: plan.highlight
          ? `linear-gradient(145deg, rgba(23,193,232,0.12), rgba(23,193,232,0.04))`
          : C.glass,
        border: `1px solid ${plan.highlight ? C.primary + "66" : C.border}`,
        borderRadius: 4,
        p: 3.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transform: plan.highlight ? "scale(1.03)" : "scale(1)",
        boxShadow: plan.highlight ? `0 0 40px rgba(23,193,232,0.15)` : "none",
        transition: "transform 0.25s",
        "&:hover": { transform: plan.highlight ? "scale(1.05)" : "scale(1.02)" },
      }}
    >
      {plan.badge && (
        <Chip
          label={plan.badge}
          size="small"
          icon={<StarIcon sx={{ fontSize: "14px !important", color: `${C.primary} !important` }} />}
          sx={{
            position: "absolute",
            top: -14,
            left: "50%",
            transform: "translateX(-50%)",
            background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.7rem",
            px: 1,
          }}
        />
      )}
      <Box sx={{ color: plan.color, fontWeight: 700, fontSize: "1rem", mb: 2 }}>{plan.name}</Box>
      <Box sx={{ mb: 2.5, display: "flex", alignItems: "flex-end", gap: 0.5 }}>
        {plan.price === "مجاني" ? (
          <Box sx={{ color: C.text, fontWeight: 800, fontSize: "2.2rem" }}>مجاني</Box>
        ) : (
          <>
            <Box sx={{ color: C.text, fontWeight: 800, fontSize: "2.2rem" }}>{plan.price}</Box>
            <Box sx={{ color: C.muted, fontSize: "0.8rem", mb: 0.8 }}>{plan.period}</Box>
          </>
        )}
      </Box>
      <Divider sx={{ borderColor: C.border, mb: 2 }} />
      <Box sx={{ flex: 1 }}>
        {plan.features.map((f) => (
          <Box key={f} display="flex" alignItems="center" gap={1} mb={1}>
            <CheckCircleIcon sx={{ fontSize: 16, color: plan.color, flexShrink: 0 }} />
            <Box sx={{ color: C.muted, fontSize: "0.85rem" }}>{f}</Box>
          </Box>
        ))}
      </Box>
      <Box
        component={isLink ? Link : "a"}
        to={isLink ? plan.ctaRoute : undefined}
        href={!isLink ? plan.ctaRoute : undefined}
        sx={{
          mt: 3,
          display: "block",
          textAlign: "center",
          py: 1.3,
          borderRadius: 2,
          fontWeight: 700,
          fontSize: "0.9rem",
          textDecoration: "none",
          background: plan.highlight
            ? `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`
            : `transparent`,
          border: plan.highlight ? "none" : `1px solid ${plan.color}55`,
          color: plan.highlight ? "#fff" : plan.color,
          transition: "opacity 0.2s, transform 0.2s",
          "&:hover": { opacity: 0.85, transform: "translateY(-1px)" },
        }}
      >
        {plan.cta}
      </Box>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, dispatch] = useSoftUIController();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setLayout(dispatch, "page");
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [dispatch]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "المميزات", id: "features" },
    { label: "لماذا نحن", id: "why" },
    { label: "الباقات", id: "pricing" },
    { label: "التواصل", id: "contact" },
  ];

  return (
    <Box sx={{ background: C.dark, minHeight: "100vh", direction: "rtl", fontFamily: "'Cairo', 'Segoe UI', sans-serif" }}>

      {/* ── Navbar ── */}
      <Box
        sx={{
          position: "fixed",
          top: 0,
          width: "100%",
          zIndex: 999,
          background: scrolled ? "rgba(15,23,42,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.border}` : "none",
          transition: "all 0.3s",
          px: { xs: 2, md: 6 },
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 36, height: 36, borderRadius: 2,
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <AccountBalanceIcon sx={{ color: "#fff", fontSize: 20 }} />
          </Box>
          <Box sx={{ color: C.text, fontWeight: 800, fontSize: "1.1rem" }}>
            Group <GradientText>Allal</GradientText>
          </Box>
        </Box>

        {/* Desktop Nav */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 3, alignItems: "center" }}>
          {navLinks.map((l) => (
            <Box
              key={l.id}
              onClick={() => scrollTo(l.id)}
              sx={{ color: C.muted, fontSize: "0.9rem", cursor: "pointer", "&:hover": { color: C.text }, transition: "color 0.2s" }}
            >
              {l.label}
            </Box>
          ))}
          <Box
            component={Link}
            to="/authentication/sign-in"
            sx={{
              color: C.primary, border: `1px solid ${C.primary}55`, borderRadius: 2,
              px: 2.5, py: 0.8, fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
              "&:hover": { background: `${C.primary}11` }, transition: "background 0.2s",
            }}
          >
            تسجيل الدخول
          </Box>
          <Box
            component={Link}
            to="/authentication/sign-up"
            sx={{
              background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
              color: "#fff", borderRadius: 2, px: 2.5, py: 0.8,
              fontSize: "0.85rem", fontWeight: 600, textDecoration: "none",
              "&:hover": { opacity: 0.88 }, transition: "opacity 0.2s",
            }}
          >
            إنشاء حساب
          </Box>
        </Box>

        {/* Mobile menu button */}
        <IconButton sx={{ display: { md: "none" }, color: C.text }} onClick={() => setMenuOpen((p) => !p)}>
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      {/* Mobile Menu */}
      {menuOpen && (
        <Box
          sx={{
            position: "fixed", top: 60, width: "100%", zIndex: 998,
            background: "rgba(15,23,42,0.97)", backdropFilter: "blur(20px)",
            p: 3, display: { md: "none" }, flexDirection: "column", gap: 2,
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          {navLinks.map((l) => (
            <Box key={l.id} onClick={() => scrollTo(l.id)} sx={{ color: C.muted, py: 1, cursor: "pointer", fontSize: "1rem", "&:hover": { color: C.text } }}>
              {l.label}
            </Box>
          ))}
          <Divider sx={{ borderColor: C.border }} />
          <Box component={Link} to="/authentication/sign-in" sx={{ color: C.primary, textDecoration: "none", py: 1 }} onClick={() => setMenuOpen(false)}>
            تسجيل الدخول
          </Box>
          <Box
            component={Link}
            to="/authentication/sign-up"
            onClick={() => setMenuOpen(false)}
            sx={{
              background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
              color: "#fff", borderRadius: 2, px: 2.5, py: 1, textAlign: "center",
              textDecoration: "none", fontWeight: 600,
            }}
          >
            إنشاء حساب
          </Box>
        </Box>
      )}

      {/* ── Hero ── */}
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          pt: 8,
        }}
      >
        {/* Background blobs */}
        <Box sx={{ position: "absolute", top: "10%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}18 0%, transparent 70%)`, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: "10%", left: "5%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}12 0%, transparent 70%)`, pointerEvents: "none" }} />

        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="نظام ERP متكامل بالعربية"
                size="small"
                sx={{ background: `${C.primary}20`, color: C.primary, border: `1px solid ${C.primary}44`, mb: 3, fontWeight: 600, fontSize: "0.75rem" }}
              />
              <Box
                sx={{
                  color: C.text,
                  fontWeight: 800,
                  fontSize: { xs: "2.2rem", md: "3.2rem" },
                  lineHeight: 1.25,
                  mb: 3,
                }}
              >
                أدِر مشروعك بـ
                <br />
                <GradientText>ثقة واحترافية</GradientText>
              </Box>
              <Box sx={{ color: C.muted, fontSize: "1.05rem", lineHeight: 1.85, mb: 4, maxWidth: 520 }}>
                منصة إدارة متكاملة للمؤسسات الجزائرية — طلبيات، مخزون، محاسبة،
                مشتريات وتصنيع في نظام واحد سريع وآمن.
              </Box>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Box
                  component={Link}
                  to="/authentication/sign-up"
                  sx={{
                    background: `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
                    color: "#fff", borderRadius: 2.5, px: 3.5, py: 1.4,
                    fontSize: "0.95rem", fontWeight: 700, textDecoration: "none",
                    boxShadow: `0 8px 24px ${C.primary}44`,
                    "&:hover": { opacity: 0.88, transform: "translateY(-2px)" },
                    transition: "all 0.2s",
                  }}
                >
                  ابدأ مجاناً الآن
                </Box>
                <Box
                  onClick={() => scrollTo("features")}
                  sx={{
                    color: C.text, border: `1px solid ${C.border}`, borderRadius: 2.5,
                    px: 3.5, py: 1.4, fontSize: "0.95rem", fontWeight: 600,
                    cursor: "pointer", display: "flex", alignItems: "center", gap: 0.5,
                    "&:hover": { borderColor: `${C.primary}55`, color: C.primary },
                    transition: "all 0.2s",
                  }}
                >
                  اكتشف المميزات <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              {/* Stats cards */}
              <Grid container spacing={2}>
                {[
                  { val: "+8", label: "وحدات متكاملة" },
                  { val: "4", label: "أدوار ووصول" },
                  { val: "100%", label: "بالعربية" },
                  { val: "∞", label: "تخزين سحابي" },
                ].map((s) => (
                  <Grid item xs={6} key={s.label}>
                    <Box
                      sx={{
                        background: C.glass, border: `1px solid ${C.border}`,
                        borderRadius: 3, p: 2.5, textAlign: "center",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      <Box sx={{ fontSize: "2rem", fontWeight: 800, color: C.primary }}>{s.val}</Box>
                      <Box sx={{ color: C.muted, fontSize: "0.8rem" }}>{s.label}</Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Why Us ── */}
      <Box id="why" sx={{ py: 8, background: `linear-gradient(180deg, ${C.dark} 0%, rgba(23,193,232,0.04) 100%)` }}>
        <Container maxWidth="md">
          <Grid container spacing={3} justifyContent="center">
            {WHY.map((w) => (
              <Grid item xs={12} sm={4} key={w.title}>
                <Box textAlign="center" sx={{ p: 3 }}>
                  <Box sx={{ color: C.primary, mb: 1.5 }}>{w.icon}</Box>
                  <Box sx={{ color: C.text, fontWeight: 700, mb: 0.5 }}>{w.title}</Box>
                  <Box sx={{ color: C.muted, fontSize: "0.85rem" }}>{w.desc}</Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Features ── */}
      <Box id="features" sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Chip label="المميزات" size="small" sx={{ background: `${C.primary}20`, color: C.primary, border: `1px solid ${C.primary}44`, mb: 2 }} />
            <Box sx={{ color: C.text, fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.4rem" }, mb: 2 }}>
              كل ما يحتاجه <GradientText>مشروعك</GradientText>
            </Box>
            <Box sx={{ color: C.muted, fontSize: "1rem", maxWidth: 480, mx: "auto" }}>
              وحدات متكاملة تغطي كامل دورة حياة المشروع من الشراء حتى المحاسبة
            </Box>
          </Box>
          <Grid container spacing={3}>
            {FEATURES.map((f) => (
              <Grid item xs={12} sm={6} md={3} key={f.title}>
                <FeatureCard {...f} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Pricing ── */}
      <Box id="pricing" sx={{ py: 10, background: `rgba(23,193,232,0.03)` }}>
        <Container maxWidth="lg">
          <Box textAlign="center" mb={6}>
            <Chip label="الباقات والأسعار" size="small" sx={{ background: `${C.accent}20`, color: C.accent, border: `1px solid ${C.accent}44`, mb: 2 }} />
            <Box sx={{ color: C.text, fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.4rem" }, mb: 2 }}>
              اختر <GradientText>باقتك</GradientText>
            </Box>
            <Box sx={{ color: C.muted, fontSize: "1rem" }}>
              أسعار شفافة بدون رسوم خفية — يمكن التغيير في أي وقت
            </Box>
          </Box>
          <Grid container spacing={4} alignItems="stretch">
            {PLANS.map((plan) => (
              <Grid item xs={12} md={4} key={plan.name} sx={{ display: "flex" }}>
                <PlanCard plan={plan} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Contact ── */}
      <Box id="contact" sx={{ py: 10 }}>
        <Container maxWidth="md">
          <Box textAlign="center" mb={6}>
            <Chip label="تواصل معنا" size="small" sx={{ background: `${C.primary}20`, color: C.primary, border: `1px solid ${C.primary}44`, mb: 2 }} />
            <Box sx={{ color: C.text, fontWeight: 800, fontSize: { xs: "1.8rem", md: "2.4rem" }, mb: 2 }}>
              نحن هنا <GradientText>لمساعدتك</GradientText>
            </Box>
            <Box sx={{ color: C.muted, fontSize: "1rem" }}>
              فريقنا جاهز للرد على استفساراتك وتهيئة المنصة لاحتياجاتك
            </Box>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {[
              {
                icon: <WhatsAppIcon sx={{ fontSize: 36, color: "#25d366" }} />,
                label: "واتساب",
                value: "+213 555 000 000",
                href: "https://wa.me/213555000000",
                color: "#25d366",
              },
              {
                icon: <PhoneIcon sx={{ fontSize: 36, color: C.primary }} />,
                label: "الهاتف",
                value: "+213 21 00 00 00",
                href: "tel:+21321000000",
                color: C.primary,
              },
              {
                icon: <EmailIcon sx={{ fontSize: 36, color: C.accent }} />,
                label: "البريد الإلكتروني",
                value: "contact@groupallal.dz",
                href: "mailto:contact@groupallal.dz",
                color: C.accent,
              },
            ].map((c) => (
              <Grid item xs={12} sm={4} key={c.label}>
                <Box
                  component="a"
                  href={c.href}
                  target="_blank"
                  rel="noreferrer"
                  sx={{
                    display: "block",
                    textDecoration: "none",
                    background: C.glass,
                    border: `1px solid ${C.border}`,
                    borderRadius: 3,
                    p: 3,
                    textAlign: "center",
                    transition: "all 0.25s",
                    "&:hover": {
                      borderColor: `${c.color}55`,
                      transform: "translateY(-4px)",
                      boxShadow: `0 12px 32px rgba(0,0,0,0.25)`,
                    },
                  }}
                >
                  {c.icon}
                  <Box sx={{ color: C.muted, fontSize: "0.8rem", mt: 1 }}>{c.label}</Box>
                  <Box sx={{ color: C.text, fontWeight: 600, fontSize: "0.9rem", mt: 0.5 }}>{c.value}</Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{ borderTop: `1px solid ${C.border}`, py: 4 }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box sx={{ color: C.muted, fontSize: "0.82rem" }}>
              © {new Date().getFullYear()} Group Allal — جميع الحقوق محفوظة
            </Box>
            <Box display="flex" gap={2}>
              <Tooltip title="تسجيل الدخول">
                <Box
                  component={Link}
                  to="/authentication/sign-in"
                  sx={{ color: C.muted, fontSize: "0.82rem", textDecoration: "none", "&:hover": { color: C.primary } }}
                >
                  تسجيل الدخول
                </Box>
              </Tooltip>
              <Box sx={{ color: C.border }}>|</Box>
              <Tooltip title="إنشاء حساب">
                <Box
                  component={Link}
                  to="/authentication/sign-up"
                  sx={{ color: C.muted, fontSize: "0.82rem", textDecoration: "none", "&:hover": { color: C.primary } }}
                >
                  إنشاء حساب
                </Box>
              </Tooltip>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
