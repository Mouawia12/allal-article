import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import ownerApi from "services/ownerApi";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Switch from "@mui/material/Switch";

import { keyframes } from "@emotion/react";

import InventoryIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLongOutlined";
import PeopleAltIcon from "@mui/icons-material/PeopleAltOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalanceOutlined";
import FactoryIcon from "@mui/icons-material/PrecisionManufacturingOutlined";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCartOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import MenuIcon from "@mui/icons-material/Menu";
import StarIcon from "@mui/icons-material/Star";
import SecurityIcon from "@mui/icons-material/SecurityOutlined";
import SpeedIcon from "@mui/icons-material/SpeedOutlined";
import SupportAgentIcon from "@mui/icons-material/SupportAgentOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LightModeIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeIcon from "@mui/icons-material/DarkModeOutlined";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DiamondIcon from "@mui/icons-material/Diamond";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import VerifiedIcon from "@mui/icons-material/Verified";

import { useSoftUIController, setLayout } from "context";

// ─── Keyframes ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(48px); }
  to   { opacity: 1; transform: translateY(0);    }
`;
const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const floatY = keyframes`
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%     { transform: translateY(-22px) rotate(2deg); }
`;
const floatY2 = keyframes`
  0%,100% { transform: translateY(0px) rotate(0deg); }
  50%     { transform: translateY(-14px) rotate(-2deg); }
`;
const orbPulse = keyframes`
  0%,100% { transform: scale(1);    opacity: 0.55; }
  50%     { transform: scale(1.12); opacity: 0.75; }
`;
const glowPulse = keyframes`
  0%,100% { box-shadow: 0 0 20px rgba(203,12,159,0.25); }
  50%     { box-shadow: 0 0 50px rgba(203,12,159,0.50); }
`;
const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-24px); }
  to   { opacity: 1; transform: translateY(0);     }
`;
const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.82) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0);       }
`;
const shimmerAnim = keyframes`
  0%   { background-position: -300% center; }
  100% { background-position:  300% center; }
`;
const borderRotate = keyframes`
  0%   { transform: rotate(0deg);   }
  100% { transform: rotate(360deg); }
`;
const countUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

// ─── Palettes ─────────────────────────────────────────────────────────────────
const DARK = {
  bg:           "#0b1120",
  bgSecondary:  "#0f172a",
  card:         "rgba(255,255,255,0.045)",
  cardBorder:   "rgba(255,255,255,0.09)",
  cardHover:    "rgba(255,255,255,0.07)",
  text:         "#f1f5f9",
  textSub:      "#cbd5e1",
  muted:        "#94a3b8",
  navbar:       "rgba(11,17,32,0.88)",
  divider:      "rgba(255,255,255,0.07)",
  tagBg:        "rgba(255,255,255,0.06)",
  heroGrid:     "rgba(255,255,255,0.025)",
};
const LIGHT = {
  bg:           "#f8faff",
  bgSecondary:  "#eef2ff",
  card:         "#ffffff",
  cardBorder:   "rgba(99,102,241,0.10)",
  cardHover:    "#f5f8ff",
  text:         "#0f172a",
  textSub:      "#1e293b",
  muted:        "#64748b",
  navbar:       "rgba(255,255,255,0.92)",
  divider:      "rgba(0,0,0,0.07)",
  tagBg:        "rgba(99,102,241,0.06)",
  heroGrid:     "rgba(99,102,241,0.04)",
};

const BRAND = {
  primary:     "#17c1e8",
  primaryDark: "#0ea5c9",
  accent:      "#cb0c9f",
  green:       "#22c55e",
  orange:      "#f97316",
  purple:      "#7928ca",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const PLANS = [
  {
    key: "trial", name: "التجريبي", nameEn: "Trial",
    icon: <RocketLaunchIcon sx={{ fontSize: 22 }} />,
    priceMonthly: 0, priceYearly: 0,
    color: "#17c1e8",
    gradient: "linear-gradient(135deg,#17c1e8,#0ea5c9)",
    highlight: false, aiSupport: false,
    features: [
      { label: "حتى 3 مستخدمين",   ok: true  },
      { label: "إدارة الطلبيات",   ok: true  },
      { label: "إدارة الأصناف",    ok: true  },
      { label: "المخزون الأساسي",  ok: true  },
      { label: "تقارير أساسية",    ok: true  },
      { label: "المحاسبة",          ok: false },
      { label: "المشتريات",         ok: false },
      { label: "ذكاء اصطناعي",     ok: false },
    ],
    cta: "ابدأ مجاناً", ctaRoute: "/authentication/sign-up",
  },
  {
    key: "basic", name: "الأساسي", nameEn: "Basic",
    icon: <WorkspacePremiumIcon sx={{ fontSize: 22 }} />,
    priceMonthly: 2900, priceYearly: 27840,
    color: "#7928ca",
    gradient: "linear-gradient(135deg,#7928ca,#5b1fa8)",
    highlight: false, aiSupport: false,
    features: [
      { label: "حتى 10 مستخدمين",     ok: true  },
      { label: "كل ميزات التجريبي",    ok: true  },
      { label: "المحاسبة المتكاملة",   ok: true  },
      { label: "إدارة المشتريات",      ok: true  },
      { label: "فواتير الطريق",        ok: true  },
      { label: "شبكة الشركاء",         ok: true  },
      { label: "دعم أولوي",            ok: true  },
      { label: "ذكاء اصطناعي",         ok: false },
    ],
    cta: "اشترك الآن", ctaRoute: "/authentication/sign-up",
  },
  {
    key: "professional", name: "الاحترافي", nameEn: "Professional",
    icon: <DiamondIcon sx={{ fontSize: 22 }} />,
    priceMonthly: 6900, priceYearly: 66240,
    color: "#cb0c9f",
    gradient: "linear-gradient(135deg,#cb0c9f,#9c0878)",
    highlight: true, badge: "الأكثر طلباً", aiSupport: true,
    features: [
      { label: "حتى 30 مستخدم",          ok: true },
      { label: "كل ميزات الأساسي",        ok: true },
      { label: "التصنيع وBOM",            ok: true },
      { label: "تعدد المستودعات",          ok: true },
      { label: "API للتكامل",             ok: true },
      { label: "دعم مخصص 24/7",           ok: true },
      { label: "✨ مساعد ذكاء اصطناعي",  ok: true },
      { label: "✨ تقارير AI تلقائية",   ok: true },
    ],
    cta: "ابدأ التجربة", ctaRoute: "/authentication/sign-up",
  },
  {
    key: "enterprise", name: "المؤسسي", nameEn: "Enterprise",
    icon: <PsychologyIcon sx={{ fontSize: 22 }} />,
    priceMonthly: 12900, priceYearly: 123840,
    color: "#f97316",
    gradient: "linear-gradient(135deg,#f97316,#ea580c)",
    highlight: false, aiSupport: true,
    features: [
      { label: "مستخدمون غير محدودين",       ok: true },
      { label: "كل ميزات الاحترافي",          ok: true },
      { label: "نسخ احتياطي يومي",            ok: true },
      { label: "تقارير مخصصة",               ok: true },
      { label: "✨ ذكاء اصطناعي كامل",       ok: true },
      { label: "✨ توقعات المبيعات AI",       ok: true },
      { label: "✨ كشف التناقضات AI",        ok: true },
      { label: "✨ مساعد محاسبي AI",         ok: true },
    ],
    cta: "تواصل معنا", ctaRoute: "#contact",
  },
];

const FEATURES = [
  { icon: <ShoppingCartIcon sx={{ fontSize: 26 }} />, title: "إدارة الطلبيات",    desc: "تتبع طلبيات البيع من الإنشاء حتى التسليم مع حالة آنية لكل مرحلة." },
  { icon: <InventoryIcon     sx={{ fontSize: 26 }} />, title: "المخزون الذكي",     desc: "جرد تلقائي، تنبيهات نفاد المخزون، وتتبع الأصناف عبر مستودعات متعددة." },
  { icon: <ReceiptLongIcon   sx={{ fontSize: 26 }} />, title: "المشتريات والموردين", desc: "طلبات الشراء، استلام البضاعة، مرتجعات الموردين وإدارة الذمم الدائنة." },
  { icon: <AccountBalanceIcon sx={{ fontSize: 26 }} />, title: "المحاسبة المتكاملة", desc: "قيد مزدوج، شجرة حسابات، ميزان مراجعة وتقارير مالية احترافية." },
  { icon: <PeopleAltIcon     sx={{ fontSize: 26 }} />, title: "إدارة الزبائن",     desc: "ملفات الزبائن، سجل الطلبيات، الذمم المدينة ومتابعة المدفوعات." },
  { icon: <FactoryIcon       sx={{ fontSize: 26 }} />, title: "التصنيع",           desc: "أوامر التصنيع، قوائم المواد (BOM) ومتابعة مراحل الإنتاج." },
  { icon: <TrendingUpIcon    sx={{ fontSize: 26 }} />, title: "التقارير والتحليل", desc: "تقارير المبيعات، الأرباح، المخزون والمحاسبة في لوحة بيانات موحدة." },
  { icon: <SecurityIcon      sx={{ fontSize: 26 }} />, title: "صلاحيات متعددة",   desc: "4 أدوار (مالك، مسؤول، محاسب، موظف) مع ضبط دقيق للصلاحيات." },
];

const WHY = [
  { icon: <SpeedIcon        sx={{ fontSize: 34 }} />, color: BRAND.primary, title: "سريع وخفيف",    desc: "واجهة رسومية حديثة تعمل على أي جهاز بسلاسة تامة." },
  { icon: <SecurityIcon     sx={{ fontSize: 34 }} />, color: BRAND.purple,  title: "آمن ومشفر",    desc: "JWT مع تشفير البيانات وصلاحيات دقيقة لكل مستخدم." },
  { icon: <SupportAgentIcon sx={{ fontSize: 34 }} />, color: BRAND.accent,  title: "دعم بالعربية", desc: "فريق دعم محلي يتحدث لغتك على مدار الأسبوع." },
];

const STATS = [
  { val: "+8",   label: "وحدات متكاملة",  color: BRAND.primary },
  { val: "4",    label: "أدوار ووصول",    color: BRAND.accent  },
  { val: "100%", label: "بالعربية",       color: BRAND.green   },
  { val: "∞",    label: "تخزين سحابي",    color: BRAND.orange  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

// ─── Animated wrapper ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, sx: sxProp = {}, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Box
      ref={ref}
      sx={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0)" : "translateY(44px)",
        transition: `opacity 0.75s cubic-bezier(.22,1,.36,1) ${delay}s,
                     transform 0.75s cubic-bezier(.22,1,.36,1) ${delay}s`,
        ...sxProp,
      }}
      {...rest}
    >
      {children}
    </Box>
  );
}

// ─── GradientText ─────────────────────────────────────────────────────────────
function GradientText({ children, from = BRAND.primary, to = BRAND.accent }) {
  return (
    <Box component="span" sx={{
      background: `linear-gradient(90deg,${from},${to})`,
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    }}>
      {children}
    </Box>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, yearly, T, delay = 0 }) {
  const [ref, inView] = useInView();
  const price   = yearly ? plan.priceYearly : plan.priceMonthly;
  const savings  = plan.priceMonthly > 0
    ? Math.round(100 - (plan.priceYearly / (plan.priceMonthly * 12)) * 100) : 0;
  const isLink  = plan.ctaRoute.startsWith("/");

  return (
    <Box
      ref={ref}
      sx={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0) scale(1)" : "translateY(48px) scale(0.94)",
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
        position: "relative", borderRadius: "22px", overflow: "hidden",
        height: "100%", display: "flex", flexDirection: "column",
        background: T.card,
        border: `1.5px solid ${plan.highlight ? plan.color + "55" : T.cardBorder}`,
        boxShadow: plan.highlight
          ? `0 0 0 1px ${plan.color}25, 0 24px 64px ${plan.color}22`
          : `0 4px 24px rgba(0,0,0,0.07)`,
        animation: plan.highlight ? `${glowPulse} 3s ease-in-out infinite` : "none",
        transition2: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: inView ? "translateY(-10px) scale(1)" : undefined,
          boxShadow: plan.highlight
            ? `0 0 0 1px ${plan.color}55, 0 36px 80px ${plan.color}30`
            : `0 20px 52px rgba(0,0,0,0.13)`,
        },
      }}
    >
      {/* Header */}
      <Box sx={{
        background: plan.gradient, p: 2.5, height: 190,
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <Box sx={{ position:"absolute", top:-28, left:-28, width:110, height:110, borderRadius:"50%", background:"rgba(255,255,255,0.09)" }} />
        <Box sx={{ position:"absolute", bottom:-35, right:-15, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }} />

        <Box sx={{ display:"flex", gap:1, flexWrap:"wrap" }}>
          {plan.badge && (
            <Chip label={plan.badge}
              icon={<StarIcon sx={{ fontSize:"11px !important", color:"#fff !important" }} />}
              size="small"
              sx={{ background:"rgba(255,255,255,0.22)", backdropFilter:"blur(10px)", color:"#fff", fontWeight:700, fontSize:"0.66rem", border:"1px solid rgba(255,255,255,0.35)" }} />
          )}
          {plan.aiSupport && (
            <Chip label="يدعم AI"
              icon={<AutoAwesomeIcon sx={{ fontSize:"11px !important", color:"#ffd700 !important" }} />}
              size="small"
              sx={{ background:"rgba(255,215,0,0.2)", backdropFilter:"blur(10px)", color:"#ffd700", fontWeight:700, fontSize:"0.66rem", border:"1px solid rgba(255,215,0,0.32)" }} />
          )}
        </Box>

        <Box sx={{ display:"flex", alignItems:"center", gap:1.2 }}>
          <Box sx={{
            width:40, height:40, borderRadius:"12px", flexShrink:0,
            background:"rgba(255,255,255,0.22)", backdropFilter:"blur(12px)",
            display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
          }}>
            {plan.icon}
          </Box>
          <Box>
            <Box sx={{ color:"rgba(255,255,255,0.68)", fontSize:"0.63rem", fontWeight:500, letterSpacing:1 }}>{plan.nameEn.toUpperCase()}</Box>
            <Box sx={{ color:"#fff", fontWeight:800, fontSize:"1.05rem" }}>{plan.name}</Box>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display:"flex", alignItems:"flex-end", gap:0.5 }}>
            {price === 0 ? (
              <Box sx={{ color:"#fff", fontWeight:900, fontSize:"2rem", lineHeight:1 }}>مجاني</Box>
            ) : (
              <>
                <Box sx={{ color:"#fff", fontWeight:900, fontSize:"2rem", lineHeight:1 }}>{price.toLocaleString("fr-DZ")}</Box>
                <Box sx={{ color:"rgba(255,255,255,0.72)", fontSize:"0.73rem", mb:0.4 }}>دج/{yearly ? "سنة" : "شهر"}</Box>
              </>
            )}
          </Box>
          {yearly && savings > 0 && (
            <Chip label={`وفر ${savings}%`} size="small"
              sx={{ mt:0.8, height:18, background:"rgba(255,255,255,0.2)", color:"#fff", fontWeight:700, fontSize:"0.63rem" }} />
          )}
        </Box>
      </Box>

      {/* Features */}
      <Box sx={{ p:3, flex:1, display:"flex", flexDirection:"column" }}>
        <Box sx={{ flex:1 }}>
          {plan.features.map((f) => (
            <Box key={f.label} sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1.2 }}>
              <Box sx={{
                width:22, height:22, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: f.ok ? `${plan.color}1a` : "transparent",
              }}>
                {f.ok
                  ? <CheckIcon sx={{ fontSize:13, color:plan.color }} />
                  : <CloseIcon sx={{ fontSize:13, color:T.muted, opacity:0.35 }} />}
              </Box>
              <Box sx={{
                fontSize:"0.83rem", color: f.ok ? T.textSub : T.muted,
                opacity: f.ok ? 1 : 0.45, fontWeight: f.ok ? 500 : 400,
              }}>
                {f.label}
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor:T.divider, my:2 }} />

        <Box
          component={isLink ? Link : "a"}
          to={isLink ? plan.ctaRoute : undefined}
          href={!isLink ? plan.ctaRoute : undefined}
          sx={{
            display:"block", textAlign:"center", py:1.4, borderRadius:"12px",
            fontWeight:700, fontSize:"0.88rem", textDecoration:"none", fontFamily:"inherit",
            background: plan.gradient, color:"#fff",
            boxShadow:`0 6px 20px ${plan.color}38`,
            transition:"opacity 0.2s, transform 0.2s",
            "&:hover": { opacity:0.86, transform:"translateY(-2px)" },
          }}
        >
          {plan.cta}
        </Box>
      </Box>
    </Box>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, T, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <Box
      ref={ref}
      sx={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
        background: T.card, border:`1px solid ${T.cardBorder}`,
        borderRadius:"18px", p:3, height:"100%",
        "&:hover .feat-icon": {
          background:`${BRAND.primary}28`,
          transform:"scale(1.12) rotate(-4deg)",
        },
        "&:hover": {
          transform: inView ? "translateY(-8px)" : undefined,
          boxShadow:`0 20px 44px rgba(23,193,232,0.10)`,
          borderColor:`${BRAND.primary}44`,
        },
        transition2:"transform 0.28s, box-shadow 0.28s, border-color 0.28s",
      }}
    >
      <Box className="feat-icon" sx={{
        width:52, height:52, borderRadius:"14px",
        background:`${BRAND.primary}14`,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:BRAND.primary, mb:2.5,
        transition:"background 0.3s, transform 0.3s",
      }}>
        {icon}
      </Box>
      <Box sx={{ color:T.text, fontWeight:700, fontSize:"0.94rem", mb:1 }}>{title}</Box>
      <Box sx={{ color:T.muted, fontSize:"0.82rem", lineHeight:1.75 }}>{desc}</Box>
    </Box>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ val, label, color, T, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <Box
      ref={ref}
      sx={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "scale(1) translateY(0)" : "scale(0.84) translateY(24px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
        background: T.card, border:`1.5px solid ${T.cardBorder}`,
        borderRadius:"20px", p:3, textAlign:"center",
        boxShadow:`0 4px 20px rgba(0,0,0,0.06)`,
        "&:hover": {
          borderColor:`${color}55`,
          boxShadow:`0 8px 32px ${color}22`,
          transform: inView ? "scale(1.03) translateY(-4px)" : undefined,
        },
        transition2:"border-color 0.25s, box-shadow 0.25s, transform 0.25s",
      }}
    >
      <Box sx={{ fontSize:"2.2rem", fontWeight:900, color, lineHeight:1, mb:0.8,
        animation: inView ? `${countUp} 0.5s ease ${delay + 0.1}s both` : "none",
      }}>
        {val}
      </Box>
      <Box sx={{ color:T.muted, fontSize:"0.8rem", fontWeight:500 }}>{label}</Box>
    </Box>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [, dispatch] = useSoftUIController();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [darkMode,     setDarkMode]     = useState(false);
  const [yearly,       setYearly]       = useState(false);
  const [heroVisible,  setHeroVisible]  = useState(false);
  const [livePlans,    setLivePlans]    = useState(null); // null = loading

  const T = darkMode ? DARK : LIGHT;

  // Merge static PLANS with live backend data (prices, active status)
  const displayPlans = useMemo(() => {
    if (!livePlans) return PLANS; // still fetching → show static
    return PLANS
      .map((staticPlan) => {
        const live = livePlans.find((lp) => lp.code === staticPlan.key);
        if (!live) return null; // plan disabled in backend → hide
        const monthly = Number(live.price_monthly ?? staticPlan.priceMonthly);
        return {
          ...staticPlan,
          priceMonthly: monthly,
          priceYearly:  monthly > 0 ? Math.round(monthly * 12 * 0.8) : 0,
        };
      })
      .filter(Boolean);
  }, [livePlans]);

  useEffect(() => {
    setLayout(dispatch, "page");
    const timer = setTimeout(() => setHeroVisible(true), 80);
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);

    // Fetch live plans from public API (no auth required)
    ownerApi.getPublicPlans()
      .then((r) => setLivePlans(r.data?.data ?? []))
      .catch(() => setLivePlans([])); // on error keep static plans

    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(timer); };
  }, [dispatch]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const navLinks = [
    { label: "المميزات", id: "features" },
    { label: "لماذا نحن", id: "why" },
    { label: "الباقات",   id: "pricing" },
    { label: "التواصل",  id: "contact" },
  ];

  return (
    <Box sx={{
      background:  T.bg,
      minHeight:   "100vh",
      direction:   "rtl",
      fontFamily:  "'Cairo','Segoe UI',sans-serif",
      transition:  "background 0.4s ease, color 0.4s ease",
      overflowX:   "hidden",
    }}>

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <Box sx={{
        position:"fixed", top:0, width:"100%", zIndex:999,
        background: scrolled ? T.navbar : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.divider}` : "none",
        transition:"all 0.35s ease",
        px:{ xs:2, md:6 }, py:1.5,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        animation:`${slideDown} 0.6s cubic-bezier(.22,1,.36,1) both`,
      }}>
        {/* Logo */}
        <Box display="flex" alignItems="center" gap={1.2}>
          <Box sx={{
            width:38, height:38, borderRadius:"11px",
            background:`linear-gradient(135deg,${BRAND.primary},${BRAND.accent})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 14px ${BRAND.primary}44`,
          }}>
            <AccountBalanceIcon sx={{ color:"#fff", fontSize:20 }} />
          </Box>
          <Box sx={{ color:T.text, fontWeight:800, fontSize:"1.08rem", letterSpacing:0.2 }}>
            Group <GradientText>Allal</GradientText>
          </Box>
        </Box>

        {/* Desktop nav */}
        <Box sx={{ display:{ xs:"none", md:"flex" }, gap:3, alignItems:"center" }}>
          {navLinks.map((l) => (
            <Box key={l.id} onClick={() => scrollTo(l.id)} sx={{
              color:T.muted, fontSize:"0.88rem", cursor:"pointer", fontWeight:500,
              position:"relative",
              "&:hover": { color:T.text },
              "&::after": {
                content:'""', position:"absolute", bottom:-2, left:0, right:0,
                height:"2px", borderRadius:"2px",
                background:`linear-gradient(90deg,${BRAND.primary},${BRAND.accent})`,
                transform:"scaleX(0)", transformOrigin:"right",
                transition:"transform 0.3s ease",
              },
              "&:hover::after": { transform:"scaleX(1)", transformOrigin:"left" },
              transition:"color 0.2s",
            }}>
              {l.label}
            </Box>
          ))}

          {/* Theme toggle */}
          <Tooltip title={darkMode ? "الوضع النهاري" : "الوضع الليلي"}>
            <Box sx={{
              display:"flex", alignItems:"center", gap:0.5,
              background:T.tagBg, border:`1px solid ${T.cardBorder}`,
              borderRadius:"24px", px:1.2, py:0.6, cursor:"pointer",
              "&:hover": { borderColor:`${BRAND.primary}55` },
              transition:"border-color 0.2s",
            }} onClick={() => setDarkMode(p => !p)}>
              <LightModeIcon sx={{ fontSize:15, color: darkMode ? T.muted : BRAND.primary, transition:"color 0.3s" }} />
              <Switch checked={darkMode} size="small" onChange={(e) => setDarkMode(e.target.checked)}
                sx={{
                  "& .MuiSwitch-thumb": { background: darkMode ? BRAND.primary : "#e2e8f0", transition:"background 0.3s" },
                  "& .MuiSwitch-track": { background: darkMode ? `${BRAND.primary}55 !important` : "#cbd5e1 !important" },
                }} />
              <DarkModeIcon sx={{ fontSize:15, color: darkMode ? BRAND.primary : T.muted, transition:"color 0.3s" }} />
            </Box>
          </Tooltip>

          <Box component={Link} to="/authentication/sign-in" sx={{
            color:BRAND.primary, border:`1.5px solid ${BRAND.primary}44`, borderRadius:"10px",
            px:2.5, py:0.75, fontSize:"0.84rem", fontWeight:600, textDecoration:"none",
            "&:hover": { background:`${BRAND.primary}0e`, borderColor:BRAND.primary },
            transition:"all 0.2s",
          }}>
            تسجيل الدخول
          </Box>
          <Box component={Link} to="/authentication/sign-up" sx={{
            background:`linear-gradient(90deg,${BRAND.primary},${BRAND.primaryDark})`,
            color:"#fff", borderRadius:"10px", px:2.5, py:0.75,
            fontSize:"0.84rem", fontWeight:700, textDecoration:"none",
            boxShadow:`0 4px 14px ${BRAND.primary}44`,
            "&:hover": { opacity:0.87, transform:"translateY(-1px)", boxShadow:`0 8px 20px ${BRAND.primary}55` },
            transition:"all 0.2s",
          }}>
            إنشاء حساب
          </Box>
        </Box>

        {/* Mobile icons */}
        <Box sx={{ display:{ md:"none" }, display:"flex", alignItems:"center", gap:0.5 }}>
          <IconButton size="small" onClick={() => setDarkMode(p => !p)} sx={{ color:T.muted }}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          <IconButton sx={{ color:T.text }} onClick={() => setMenuOpen(p => !p)}>
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
      </Box>

      {/* Mobile menu */}
      {menuOpen && (
        <Box sx={{
          position:"fixed", top:60, width:"100%", zIndex:998,
          background:T.navbar, backdropFilter:"blur(20px)",
          p:3, borderBottom:`1px solid ${T.divider}`,
          animation:`${fadeIn} 0.2s ease`,
        }}>
          {navLinks.map((l) => (
            <Box key={l.id} onClick={() => scrollTo(l.id)} sx={{
              color:T.muted, py:1.2, cursor:"pointer", fontSize:"1rem",
              borderBottom:`1px solid ${T.divider}`,
              "&:hover": { color:T.text },
            }}>
              {l.label}
            </Box>
          ))}
          <Box sx={{ mt:2, display:"flex", gap:2 }}>
            <Box component={Link} to="/authentication/sign-in"
              sx={{ color:BRAND.primary, textDecoration:"none", fontWeight:600 }}
              onClick={() => setMenuOpen(false)}>
              تسجيل الدخول
            </Box>
            <Box component={Link} to="/authentication/sign-up"
              sx={{ color:BRAND.accent, textDecoration:"none", fontWeight:600 }}
              onClick={() => setMenuOpen(false)}>
              إنشاء حساب
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <Box sx={{
        minHeight:"100vh", display:"flex", alignItems:"center",
        position:"relative", overflow:"hidden", pt:10,
        /* Subtle dot grid */
        backgroundImage: `radial-gradient(${T.heroGrid} 1.2px, transparent 1.2px)`,
        backgroundSize:"28px 28px",
      }}>
        {/* Orbs */}
        <Box sx={{
          position:"absolute", top:"8%", right:"4%",
          width:520, height:520, borderRadius:"50%",
          background:`radial-gradient(circle,${BRAND.primary}22 0%,transparent 68%)`,
          animation:`${orbPulse} 6s ease-in-out infinite`,
          pointerEvents:"none",
        }} />
        <Box sx={{
          position:"absolute", bottom:"8%", left:"3%",
          width:420, height:420, borderRadius:"50%",
          background:`radial-gradient(circle,${BRAND.accent}18 0%,transparent 68%)`,
          animation:`${orbPulse} 8s ease-in-out infinite 1.5s`,
          pointerEvents:"none",
        }} />
        <Box sx={{
          position:"absolute", top:"50%", left:"50%",
          width:300, height:300, borderRadius:"50%",
          background:`radial-gradient(circle,${BRAND.purple}12 0%,transparent 70%)`,
          animation:`${orbPulse} 10s ease-in-out infinite 3s`,
          pointerEvents:"none", transform:"translate(-50%,-50%)",
        }} />

        <Container maxWidth="lg">
          <Grid container spacing={5} alignItems="center">
            {/* Text */}
            <Grid item xs={12} md={7}>
              <Box sx={{
                opacity:    heroVisible ? 1 : 0,
                transform:  heroVisible ? "translateY(0)" : "translateY(40px)",
                transition: "opacity 0.8s ease 0.1s, transform 0.8s ease 0.1s",
              }}>
                <Chip
                  label="نظام ERP متكامل بالعربية"
                  icon={<VerifiedIcon sx={{ fontSize:"14px !important", color:`${BRAND.primary} !important` }} />}
                  size="small"
                  sx={{
                    background:`${BRAND.primary}18`, color:BRAND.primary,
                    border:`1px solid ${BRAND.primary}44`, mb:3,
                    fontWeight:700, fontSize:"0.74rem", px:0.5,
                  }}
                />

                <Box sx={{
                  color:T.text, fontWeight:900,
                  fontSize:{ xs:"2.3rem", md:"3.4rem" },
                  lineHeight:1.18, mb:2,
                  letterSpacing:-0.5,
                  opacity:    heroVisible ? 1 : 0,
                  transform:  heroVisible ? "translateY(0)" : "translateY(30px)",
                  transition: "opacity 0.75s ease 0.25s, transform 0.75s ease 0.25s",
                }}>
                  أدِر مشروعك بـ
                  <br />
                  <GradientText>ثقة واحترافية</GradientText>
                </Box>

                <Box sx={{
                  color:T.muted, fontSize:"1.05rem", lineHeight:1.9, mb:4.5, maxWidth:520,
                  opacity:    heroVisible ? 1 : 0,
                  transform:  heroVisible ? "translateY(0)" : "translateY(25px)",
                  transition: "opacity 0.75s ease 0.4s, transform 0.75s ease 0.4s",
                }}>
                  منصة إدارة متكاملة للمؤسسات الجزائرية — طلبيات، مخزون، محاسبة،
                  مشتريات وتصنيع في نظام واحد سريع وآمن.
                </Box>

                <Box sx={{
                  display:"flex", gap:2.5, flexWrap:"wrap",
                  opacity:    heroVisible ? 1 : 0,
                  transform:  heroVisible ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.75s ease 0.55s, transform 0.75s ease 0.55s",
                }}>
                  <Box component={Link} to="/authentication/sign-up" sx={{
                    background:`linear-gradient(90deg,${BRAND.primary},${BRAND.primaryDark})`,
                    color:"#fff", borderRadius:"14px", px:4, py:1.5,
                    fontSize:"0.95rem", fontWeight:700, textDecoration:"none",
                    boxShadow:`0 10px 28px ${BRAND.primary}44`,
                    display:"flex", alignItems:"center", gap:1,
                    "&:hover": { opacity:0.88, transform:"translateY(-3px)", boxShadow:`0 16px 36px ${BRAND.primary}55` },
                    transition:"all 0.25s ease",
                  }}>
                    ابدأ مجاناً الآن
                    <ArrowForwardIcon sx={{ fontSize:18 }} />
                  </Box>
                  <Box onClick={() => scrollTo("features")} sx={{
                    color:T.text, border:`1.5px solid ${T.cardBorder}`, borderRadius:"14px",
                    px:3.5, py:1.5, fontSize:"0.95rem", fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", gap:0.5,
                    background:T.card,
                    "&:hover": { borderColor:`${BRAND.primary}55`, color:BRAND.primary, background:`${BRAND.primary}08` },
                    transition:"all 0.25s",
                  }}>
                    اكتشف المميزات <KeyboardArrowDownIcon sx={{ fontSize:18 }} />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Stats grid */}
            <Grid item xs={12} md={5}>
              <Grid container spacing={2}>
                {STATS.map((s, i) => (
                  <Grid item xs={6} key={s.label}>
                    <StatCard {...s} T={T} delay={0.3 + i * 0.1} />
                  </Grid>
                ))}
              </Grid>

              {/* Floating badge */}
              <Box sx={{
                mt:2.5, p:2, borderRadius:"16px",
                background:T.card, border:`1px solid ${T.cardBorder}`,
                display:"flex", alignItems:"center", gap:1.5,
                boxShadow:`0 8px 32px rgba(0,0,0,0.08)`,
                animation: heroVisible ? `${floatY2} 5s ease-in-out infinite 1s` : "none",
              }}>
                <Box sx={{
                  width:38, height:38, borderRadius:"10px", flexShrink:0,
                  background:`linear-gradient(135deg,${BRAND.green},#16a34a)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <CheckIcon sx={{ color:"#fff", fontSize:20 }} />
                </Box>
                <Box>
                  <Box sx={{ color:T.text, fontWeight:700, fontSize:"0.88rem" }}>جاهز للاستخدام الفوري</Box>
                  <Box sx={{ color:T.muted, fontSize:"0.76rem" }}>بدون تثبيت · يعمل من المتصفح</Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Why Us ──────────────────────────────────────────────────────────── */}
      <Box id="why" sx={{
        py:10,
        background: darkMode
          ? `linear-gradient(180deg,${DARK.bg} 0%,${DARK.bgSecondary} 100%)`
          : `linear-gradient(180deg,${LIGHT.bg} 0%,${LIGHT.bgSecondary} 100%)`,
      }}>
        <Container maxWidth="lg">
          <Reveal sx={{ textAlign:"center", mb:7 }}>
            <Chip label="لماذا نحن" size="small"
              sx={{ background:`${BRAND.primary}18`, color:BRAND.primary, border:`1px solid ${BRAND.primary}44`, mb:2, fontWeight:700 }} />
            <Box sx={{ color:T.text, fontWeight:800, fontSize:{ xs:"1.8rem", md:"2.4rem" }, mb:1.5 }}>
              الفرق الذي <GradientText>تشعر به</GradientText>
            </Box>
            <Box sx={{ color:T.muted, fontSize:"1rem", maxWidth:420, mx:"auto" }}>
              صُمّم خصيصاً للسوق الجزائري بكل متطلباته وخصائصه
            </Box>
          </Reveal>

          <Grid container spacing={3} justifyContent="center">
            {WHY.map((w, i) => (
              <Grid item xs={12} sm={4} key={w.title}>
                <Reveal delay={i * 0.15}>
                  <Box sx={{
                    textAlign:"center", p:4,
                    borderRadius:"20px", background:T.card,
                    border:`1px solid ${T.cardBorder}`,
                    height:"100%",
                    "&:hover .why-icon": {
                      transform:"scale(1.12) rotate(-5deg)",
                      boxShadow:`0 8px 24px ${w.color}44`,
                    },
                    "&:hover": { borderColor:`${w.color}44`, boxShadow:`0 12px 36px ${w.color}12` },
                    transition:"all 0.3s ease",
                  }}>
                    <Box className="why-icon" sx={{
                      width:68, height:68, borderRadius:"18px",
                      background:`linear-gradient(135deg,${w.color}22,${w.color}10)`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:w.color, mx:"auto", mb:2.5,
                      border:`1.5px solid ${w.color}22`,
                      transition:"transform 0.3s ease, box-shadow 0.3s ease",
                    }}>
                      {w.icon}
                    </Box>
                    <Box sx={{ color:T.text, fontWeight:700, fontSize:"1rem", mb:1 }}>{w.title}</Box>
                    <Box sx={{ color:T.muted, fontSize:"0.85rem", lineHeight:1.7 }}>{w.desc}</Box>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <Box id="features" sx={{ py:12, background:T.bg }}>
        <Container maxWidth="lg">
          <Reveal sx={{ textAlign:"center", mb:7 }}>
            <Chip label="المميزات" size="small"
              sx={{ background:`${BRAND.primary}18`, color:BRAND.primary, border:`1px solid ${BRAND.primary}44`, mb:2, fontWeight:700 }} />
            <Box sx={{ color:T.text, fontWeight:800, fontSize:{ xs:"1.8rem", md:"2.5rem" }, mb:1.5 }}>
              كل ما يحتاجه <GradientText>مشروعك</GradientText>
            </Box>
            <Box sx={{ color:T.muted, fontSize:"1rem", maxWidth:480, mx:"auto" }}>
              وحدات متكاملة تغطي كامل دورة حياة المشروع من الشراء حتى المحاسبة
            </Box>
          </Reveal>
          <Grid container spacing={2.5}>
            {FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} md={3} key={f.title}>
                <FeatureCard {...f} T={T} delay={(i % 4) * 0.1} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <Box id="pricing" sx={{
        py:14,
        background: darkMode
          ? "linear-gradient(180deg,#0b1120 0%,#0f172a 100%)"
          : `linear-gradient(180deg,${LIGHT.bgSecondary} 0%,${LIGHT.bg} 100%)`,
        position:"relative", overflow:"hidden",
      }}>
        <Box sx={{ position:"absolute", top:"15%", right:"-5%", width:450, height:450, borderRadius:"50%", background:`radial-gradient(circle,${BRAND.accent}0c 0%,transparent 65%)`, pointerEvents:"none", animation:`${orbPulse} 7s ease-in-out infinite` }} />
        <Box sx={{ position:"absolute", bottom:"10%", left:"-5%", width:350, height:350, borderRadius:"50%", background:`radial-gradient(circle,${BRAND.primary}0a 0%,transparent 65%)`, pointerEvents:"none", animation:`${orbPulse} 9s ease-in-out infinite 2s` }} />

        <Container maxWidth="xl">
          <Reveal sx={{ textAlign:"center", mb:2 }}>
            <Chip label="الباقات والأسعار" size="small"
              sx={{ background:`${BRAND.accent}18`, color:BRAND.accent, border:`1px solid ${BRAND.accent}44`, mb:2, fontWeight:700 }} />
            <Box sx={{ color:T.text, fontWeight:800, fontSize:{ xs:"1.8rem", md:"2.8rem" }, mb:1.5 }}>
              اختر <GradientText from={BRAND.accent} to={BRAND.primary}>باقتك</GradientText>
            </Box>
            <Box sx={{ color:T.muted, fontSize:"1rem", mb:4 }}>
              أسعار شفافة بدون رسوم خفية — يمكن التغيير في أي وقت
            </Box>

            {/* Billing toggle */}
            <Box sx={{
              display:"inline-flex", alignItems:"center", gap:1.5,
              background:T.card, border:`1.5px solid ${T.cardBorder}`,
              borderRadius:"50px", px:2.5, py:1,
              boxShadow:`0 4px 16px rgba(0,0,0,0.07)`,
            }}>
              <Box sx={{ color:!yearly ? T.text : T.muted, fontWeight:!yearly ? 700 : 400, fontSize:"0.85rem", transition:"all 0.2s" }}>شهري</Box>
              <Switch checked={yearly} onChange={(e) => setYearly(e.target.checked)}
                sx={{
                  "& .MuiSwitch-thumb": { background:BRAND.primary },
                  "& .MuiSwitch-track": { background:`${BRAND.primary}55 !important` },
                }} />
              <Box sx={{ display:"flex", alignItems:"center", gap:0.8 }}>
                <Box sx={{ color:yearly ? T.text : T.muted, fontWeight:yearly ? 700 : 400, fontSize:"0.85rem", transition:"all 0.2s" }}>سنوي</Box>
                {yearly && (
                  <Chip label="وفر 20%" size="small" sx={{
                    height:20, fontSize:"0.63rem", fontWeight:700,
                    background:`${BRAND.green}20`, color:BRAND.green, border:`1px solid ${BRAND.green}44`,
                  }} />
                )}
              </Box>
            </Box>
          </Reveal>

          <Grid container spacing={2.5} alignItems="stretch" sx={{ mt:2 }}>
            {displayPlans.map((plan, i) => (
              <Grid item xs={12} sm={6} lg={3} key={plan.key} sx={{ display:"flex" }}>
                <PlanCard plan={plan} yearly={yearly} T={T} delay={i * 0.12} />
              </Grid>
            ))}
          </Grid>

          <Reveal delay={0.3}>
            <Box sx={{
              mt:6, p:3, borderRadius:"16px",
              background:T.card, border:`1px solid ${T.cardBorder}`,
              display:"flex", alignItems:"center", gap:2, flexWrap:"wrap",
              justifyContent:"center", textAlign:"center",
              boxShadow:`0 4px 20px rgba(0,0,0,0.06)`,
            }}>
              <CheckIcon sx={{ color:BRAND.green, fontSize:20 }} />
              <Box sx={{ color:T.muted, fontSize:"0.88rem" }}>
                جميع الباقات تشمل: تسجيل دخول آمن · نسخ احتياطي تلقائي · دعم فني عبر الإيميل · تحديثات مجانية مستمرة
              </Box>
            </Box>
          </Reveal>
        </Container>
      </Box>

      {/* ── Contact ─────────────────────────────────────────────────────────── */}
      <Box id="contact" sx={{ py:12, background:T.bg }}>
        <Container maxWidth="md">
          <Reveal sx={{ textAlign:"center", mb:7 }}>
            <Chip label="تواصل معنا" size="small"
              sx={{ background:`${BRAND.primary}18`, color:BRAND.primary, border:`1px solid ${BRAND.primary}44`, mb:2, fontWeight:700 }} />
            <Box sx={{ color:T.text, fontWeight:800, fontSize:{ xs:"1.8rem", md:"2.4rem" }, mb:1.5 }}>
              نحن هنا <GradientText>لمساعدتك</GradientText>
            </Box>
            <Box sx={{ color:T.muted, fontSize:"1rem" }}>
              فريقنا جاهز للرد على استفساراتك وتهيئة المنصة لاحتياجاتك
            </Box>
          </Reveal>

          <Grid container spacing={3} justifyContent="center">
            {[
              { icon:<WhatsAppIcon sx={{ fontSize:30, color:"#25d366" }} />, label:"واتساب", value:"+213 555 000 000", href:"https://wa.me/213555000000", color:"#25d366" },
              { icon:<PhoneIcon    sx={{ fontSize:30, color:BRAND.primary }} />, label:"الهاتف", value:"+213 21 00 00 00", href:"tel:+21321000000", color:BRAND.primary },
              { icon:<EmailIcon    sx={{ fontSize:30, color:BRAND.accent  }} />, label:"البريد الإلكتروني", value:"contact@groupallal.dz", href:"mailto:contact@groupallal.dz", color:BRAND.accent },
            ].map((c, i) => (
              <Grid item xs={12} sm={4} key={c.label}>
                <Reveal delay={i * 0.12}>
                  <Box component="a" href={c.href} target="_blank" rel="noreferrer" sx={{
                    display:"block", textDecoration:"none",
                    background:T.card, border:`1.5px solid ${T.cardBorder}`,
                    borderRadius:"20px", p:3.5, textAlign:"center",
                    boxShadow:`0 4px 20px rgba(0,0,0,0.06)`,
                    "&:hover": {
                      borderColor:`${c.color}55`,
                      transform:"translateY(-8px)",
                      boxShadow:`0 16px 40px ${c.color}18`,
                    },
                    transition:"all 0.3s ease",
                  }}>
                    <Box sx={{
                      width:60, height:60, borderRadius:"16px",
                      background:`${c.color}14`, display:"flex",
                      alignItems:"center", justifyContent:"center", mx:"auto", mb:2,
                      border:`1px solid ${c.color}22`,
                    }}>
                      {c.icon}
                    </Box>
                    <Box sx={{ color:T.muted, fontSize:"0.78rem", mb:0.5 }}>{c.label}</Box>
                    <Box sx={{ color:T.text, fontWeight:700, fontSize:"0.87rem" }}>{c.value}</Box>
                  </Box>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <Box sx={{ borderTop:`1px solid ${T.divider}`, py:4, background:T.bg }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box sx={{ color:T.muted, fontSize:"0.82rem" }}>
              © {new Date().getFullYear()} Group Allal — جميع الحقوق محفوظة
            </Box>
            <Box display="flex" gap={2} alignItems="center">
              {[
                { label:"تسجيل الدخول", to:"/authentication/sign-in" },
                { label:"إنشاء حساب",  to:"/authentication/sign-up" },
              ].map((l, i) => (
                <Box key={l.label} component={Link} to={l.to}
                  sx={{ color:T.muted, fontSize:"0.82rem", textDecoration:"none", "&:hover":{ color:BRAND.primary }, transition:"color 0.2s" }}>
                  {l.label}
                </Box>
              ))}
              <Box sx={{ color:T.divider }}>|</Box>
              <Box onClick={() => window.location.href="/owner/login"}
                sx={{ color:T.muted, fontSize:"0.82rem", cursor:"pointer", "&:hover":{ color:BRAND.primary }, transition:"color 0.2s" }}>
                دخول المالك
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

    </Box>
  );
}
