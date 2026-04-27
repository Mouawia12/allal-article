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
  dark: "#0f172a",
  card: "#1e293b",
  border: "rgba(255,255,255,0.08)",
  primary: "#17c1e8",
  accent: "#cb0c9f",
  text: "#e2e8f0",
  muted: "#94a3b8",
};

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login } = useOwnerAuth();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/owner/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: C.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        direction: "rtl",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Cairo','Segoe UI',sans-serif",
      }}
    >
      {/* Background blobs */}
      <Box sx={{ position: "absolute", top: "15%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: `radial-gradient(circle, ${C.primary}15 0%, transparent 70%)`, pointerEvents: "none" }} />
      <Box sx={{ position: "absolute", bottom: "15%", left: "10%", width: 300, height: 300, borderRadius: "50%", background: `radial-gradient(circle, ${C.accent}10 0%, transparent 70%)`, pointerEvents: "none" }} />

      <Box
        sx={{
          width: "100%",
          maxWidth: 420,
          mx: 2,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 4,
          p: { xs: 3, sm: 5 },
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <Box textAlign="center" mb={4}>
          <Box
            sx={{
              width: 60, height: 60, borderRadius: 3,
              background: `linear-gradient(135deg, ${C.primary}, ${C.accent})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              mx: "auto", mb: 2,
              boxShadow: `0 8px 24px ${C.primary}44`,
            }}
          >
            <AccountBalanceIcon sx={{ color: "#fff", fontSize: 32 }} />
          </Box>
          <Box sx={{ color: C.text, fontWeight: 800, fontSize: "1.4rem" }}>
            Group Allal
          </Box>
          <Box sx={{ color: C.muted, fontSize: "0.85rem", mt: 0.5 }}>
            لوحة إدارة المنصة
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Email */}
          <Box mb={2.5}>
            <Box sx={{ color: C.muted, fontSize: "0.8rem", fontWeight: 600, mb: 0.8 }}>
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
                    <EmailOutlinedIcon sx={{ color: C.muted, fontSize: 18 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.04)",
                  color: C.text,
                  fontSize: "0.9rem",
                  "& fieldset": { borderColor: C.border },
                  "&:hover fieldset": { borderColor: `${C.primary}55` },
                  "&.Mui-focused fieldset": { borderColor: C.primary },
                },
                "& input": { color: `${C.text} !important` },
                "& input::placeholder": { color: C.muted, opacity: 1 },
              }}
            />
          </Box>

          {/* Password */}
          <Box mb={3}>
            <Box sx={{ color: C.muted, fontSize: "0.8rem", fontWeight: 600, mb: 0.8 }}>
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
                    <LockOutlinedIcon sx={{ color: C.muted, fontSize: 18 }} />
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
                        : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                      }
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.04)",
                  color: C.text,
                  fontSize: "0.9rem",
                  "& fieldset": { borderColor: C.border },
                  "&:hover fieldset": { borderColor: `${C.primary}55` },
                  "&.Mui-focused fieldset": { borderColor: C.primary },
                },
                "& input": { color: `${C.text} !important` },
                "& input::placeholder": { color: C.muted, opacity: 1 },
              }}
            />
          </Box>

          {/* Error */}
          {error && (
            <Box
              mb={2.5}
              sx={{
                background: "rgba(234,6,6,0.08)",
                border: "1px solid rgba(234,6,6,0.25)",
                borderRadius: 2,
                p: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <ErrorOutlineIcon sx={{ color: "#ea0606", fontSize: 18 }} />
              <Box sx={{ color: "#ea0606", fontSize: "0.82rem" }}>{error}</Box>
            </Box>
          )}

          {/* Submit */}
          <Box
            component="button"
            type="submit"
            disabled={loading}
            sx={{
              width: "100%",
              py: 1.4,
              border: "none",
              borderRadius: 2,
              background: loading
                ? "rgba(23,193,232,0.4)"
                : `linear-gradient(90deg, ${C.primary}, #0ea5c9)`,
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              boxShadow: loading ? "none" : `0 8px 20px ${C.primary}44`,
              transition: "opacity 0.2s, transform 0.2s",
              "&:hover:not(:disabled)": { opacity: 0.88, transform: "translateY(-1px)" },
              fontFamily: "inherit",
            }}
          >
            {loading && <CircularProgress size={16} sx={{ color: "#fff" }} />}
            {loading ? "جاري الدخول..." : "دخول المنصة"}
          </Box>
        </Box>

        <Box textAlign="center" mt={3}>
          <Box sx={{ color: C.muted, fontSize: "0.75rem" }}>
            هذه الصفحة مخصصة لمدير المنصة فقط
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
