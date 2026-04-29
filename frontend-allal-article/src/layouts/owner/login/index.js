import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import IconButton from "@mui/material/IconButton";
import { useOwnerAuth } from "context/OwnerAuthContext";

const C = {
  bg: "#f0f4f8",
  card: "#ffffff",
  border: "#e2e8f0",
  borderFocus: "#17c1e8",
  primary: "#17c1e8",
  primaryDark: "#0ea5c9",
  accent: "#cb0c9f",
  text: "#1e293b",
  muted: "#64748b",
  placeholder: "#94a3b8",
  inputBg: "#f8fafc",
  shadow: "0 20px 60px rgba(0,0,0,0.08)",
  shadowBtn: "0 8px 20px rgba(23,193,232,0.35)",
};

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login } = useOwnerAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/owner/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      background: C.inputBg,
      color: C.text,
      fontSize: "0.9rem",
      "& fieldset": { borderColor: C.border },
      "&:hover fieldset": { borderColor: C.borderFocus },
      "&.Mui-focused fieldset": { borderColor: C.primary, borderWidth: 2 },
    },
    "& input": { color: `${C.text} !important` },
    "& input::placeholder": { color: C.placeholder, opacity: 1 },
    "& .MuiInputAdornment-root svg": { color: C.muted },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, #e0f2fe 0%, #f0f4f8 50%, #fce7f3 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Cairo','Segoe UI',sans-serif",
      }}
    >
      {/* Decorative blobs */}
      <Box sx={{ position: "absolute", top: "-80px", right: "-80px", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}20 0%, transparent 70%)`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: "-80px", left: "-80px", width: 280, height: 280, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}15 0%, transparent 70%)`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", top: "40%", left: "5%", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, #7c3aed15 0%, transparent 70%)`, pointerEvents: "none" }} />

      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          mx: 2,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "20px",
          p: { xs: 3, sm: 5 },
          boxShadow: C.shadow,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box textAlign="center" mb={4}>
          <Box
            sx={{
              width: 68, height: 68, borderRadius: "16px",
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 2,
              boxShadow: `0 12px 28px ${C.primary}40`,
            }}
          >
            <AccountBalanceIcon sx={{ color: "#fff", fontSize: 34 }} />
          </Box>
          <Box sx={{ color: C.text, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.02em" }}>
            Group Allal
          </Box>
          <Box sx={{ color: C.muted, fontSize: "0.875rem", mt: 0.5 }}>
            لوحة إدارة المنصة
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Email */}
          <Box mb={2.5}>
            <Box sx={{ color: C.text, fontSize: "0.8rem", fontWeight: 700, mb: 0.8 }}>
              البريد الإلكتروني
            </Box>
            <TextField
              fullWidth
              type="email"
              placeholder="owner@allal.dz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          </Box>

          {/* Password */}
          <Box mb={3}>
            <Box sx={{ color: C.text, fontSize: "0.8rem", fontWeight: 700, mb: 0.8 }}>
              كلمة المرور
            </Box>
            <TextField
              fullWidth
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ fontSize: 18 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPass((p) => !p)}
                      edge="end"
                      size="small"
                      sx={{ color: C.muted, "&:hover": { color: C.primary } }}
                    >
                      {showPass
                        ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                        : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />
          </Box>

          {/* Error */}
          {error && (
            <Box
              mb={2.5}
              sx={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ErrorOutlineIcon sx={{ color: "#ef4444", fontSize: 18, flexShrink: 0 }} />
              <Box sx={{ color: "#dc2626", fontSize: "0.82rem", fontWeight: 500 }}>{error}</Box>
            </Box>
          )}

          {/* Submit */}
          <Box
            component="button"
            type="submit"
            disabled={loading}
            sx={{
              width: "100%",
              py: 1.5,
              border: "none",
              borderRadius: "10px",
              background: loading
                ? "#e0f2fe"
                : `linear-gradient(90deg, ${C.primary}, ${C.primaryDark})`,
              color: loading ? C.muted : "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              boxShadow: loading ? "none" : C.shadowBtn,
              transition: "all 0.2s",
              "&:hover:not(:disabled)": {
                opacity: 0.9,
                transform: "translateY(-1px)",
                boxShadow: `0 12px 28px ${C.primary}50`,
              },
              "&:active:not(:disabled)": { transform: "translateY(0)" },
              fontFamily: "inherit",
            }}
          >
            {loading && <CircularProgress size={16} sx={{ color: C.muted }} />}
            {loading ? "جاري الدخول..." : "دخول المنصة"}
          </Box>
        </Box>

        {/* Footer */}
        <Box textAlign="center" mt={3.5}>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              background: "#f1f5f9",
              borderRadius: "20px",
              px: 2,
              py: 0.7,
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
            <Box sx={{ color: C.muted, fontSize: "0.72rem", fontWeight: 600 }}>
              الصفحة مخصصة لمدير المنصة فقط
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
