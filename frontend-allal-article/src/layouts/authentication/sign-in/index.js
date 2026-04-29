import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Switch from "@mui/material/Switch";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import curved9 from "assets/images/curved-images/curved-6.jpg";
import { useAuth } from "context/AuthContext";

function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantId, setTenantId] = useState(localStorage.getItem("lastTenantId") || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, tenantId || null);
      if (rememberMe && tenantId) localStorage.setItem("lastTenantId", tenantId);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "خطأ في بيانات الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoverLayout
      title="مرحباً بك"
      description="أدخل بيانات الدخول للمتابعة"
      image={curved9}
    >
      <SoftBox component="form" role="form" onSubmit={handleSubmit}>
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              معرّف المنشأة (Workspace ID)
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="text"
            placeholder="tenant_xxxxxxxxxxxx"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
          />
        </SoftBox>
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              البريد الإلكتروني
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </SoftBox>
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              كلمة المرور
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </SoftBox>
        {error && (
          <SoftBox mb={1}>
            <SoftTypography variant="caption" color="error" fontWeight="medium">
              {error}
            </SoftTypography>
          </SoftBox>
        )}
        <SoftBox display="flex" alignItems="center">
          <Switch checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
          <SoftTypography
            variant="button"
            fontWeight="regular"
            onClick={() => setRememberMe(!rememberMe)}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            &nbsp;&nbsp;تذكرني
          </SoftTypography>
        </SoftBox>
        <SoftBox mt={4} mb={1}>
          <SoftButton
            variant="gradient"
            color="info"
            fullWidth
            type="submit"
            disabled={loading}
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </SoftButton>
        </SoftBox>
        <SoftBox mt={1} textAlign="center">
          <SoftTypography
            variant="caption"
            color="secondary"
            sx={{ cursor: "pointer", "&:hover": { color: "#17c1e8" } }}
            onClick={() => window.location.href = "/owner/login"}
          >
            دخول لوحة المالك ←
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </CoverLayout>
  );
}

export default SignIn;
