/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PrintIcon from "@mui/icons-material/Print";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import { accountingApi } from "services";
import { getApiErrorMessage } from "utils/formErrors";

const fmt = (n) =>
  new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(Math.abs(n ?? 0)) + " دج";


function PartyRow({ party, type }) {
  const [open, setOpen] = useState(false);
  const totalInvoiced = party.invoices.reduce((s, i) => s + i.amount, 0);
  const totalPaid = party.payments.reduce((s, p) => s + p.amount, 0);
  const balance = totalInvoiced - totalPaid;

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: "pointer", background: !party.matched ? "#fff8f8" : "inherit" }}
        onClick={() => setOpen((p) => !p)}
      >
        <TableCell>
          <SoftBox display="flex" alignItems="center" gap={1}>
            {party.matched
              ? <CheckCircleOutlineIcon sx={{ color: "#82d616", fontSize: 16 }} />
              : <WarningAmberIcon sx={{ color: "#ea0606", fontSize: 16 }} />
            }
            <SoftTypography variant="caption" fontWeight="bold">{party.name}</SoftTypography>
          </SoftBox>
        </TableCell>
        <TableCell><SoftTypography variant="caption">{fmt(totalInvoiced)}</SoftTypography></TableCell>
        <TableCell><SoftTypography variant="caption" sx={{ color: "#82d616" }}>{fmt(totalPaid)}</SoftTypography></TableCell>
        <TableCell><SoftTypography variant="caption" fontWeight="bold">{fmt(balance)}</SoftTypography></TableCell>
        <TableCell><SoftTypography variant="caption">{fmt(party.controlBalance)}</SoftTypography></TableCell>
        <TableCell>
          {!party.matched && (
            <Chip
              label={`فرق: ${fmt(party.controlBalance - party.subledgerBalance)}`}
              size="small" color="error" sx={{ fontSize: "0.65rem" }}
            />
          )}
          {party.matched && <Chip label="متطابق" size="small" color="success" sx={{ fontSize: "0.65rem" }} />}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, px: 3, background: "#f8f9fa" }}>
            <SoftBox py={1.5}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                    الفواتير ({type === "customer" ? "مبيعات" : "مشتريات"})
                  </SoftTypography>
                  <Table size="small">
                    <TableBody>
                      {party.invoices.map((inv) => (
                        <TableRow key={inv.ref}>
                          <TableCell sx={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{inv.ref}</TableCell>
                          <TableCell sx={{ fontSize: "0.72rem" }}>{inv.date}</TableCell>
                          <TableCell sx={{ fontSize: "0.72rem" }}>{fmt(inv.amount)}</TableCell>
                          <TableCell sx={{ fontSize: "0.72rem", color: "#82d616" }}>-{fmt(inv.paid)}</TableCell>
                          <TableCell sx={{ fontSize: "0.72rem", fontWeight: "bold", color: inv.balance > 0 ? "#ea0606" : "#82d616" }}>
                            {fmt(inv.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                    الدفعات
                  </SoftTypography>
                  {party.payments.length === 0
                    ? <SoftTypography variant="caption" color="secondary">لا توجد دفعات</SoftTypography>
                    : (
                      <Table size="small">
                        <TableBody>
                          {party.payments.map((pmt) => (
                            <TableRow key={pmt.ref}>
                              <TableCell sx={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{pmt.ref}</TableCell>
                              <TableCell sx={{ fontSize: "0.72rem" }}>{pmt.date}</TableCell>
                              <TableCell sx={{ fontSize: "0.72rem", color: "#82d616", fontWeight: "bold" }}>{fmt(pmt.amount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )
                  }
                </Grid>
              </Grid>
            </SoftBox>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function ReconciliationTable({ parties, type }) {
  const totalControl = parties.reduce((s, p) => s + p.controlBalance, 0);
  const totalSubledger = parties.reduce((s, p) => s + p.subledgerBalance, 0);
  const unmatched = parties.filter((p) => !p.matched).length;

  return (
    <>
      <SoftBox
        p={1.5} mb={2}
        sx={{
          background: unmatched === 0 ? "#f0fde4" : "#ffeaea",
          border: `1px solid ${unmatched === 0 ? "#82d61644" : "#ea060622"}`,
          borderRadius: 2,
          display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center",
        }}
      >
        {unmatched === 0
          ? <CheckCircleOutlineIcon sx={{ color: "#82d616", fontSize: 20 }} />
          : <ErrorOutlineIcon sx={{ color: "#ea0606", fontSize: 20 }} />
        }
        <SoftBox>
          <SoftTypography variant="caption" color="secondary">إجمالي الحساب الرقابي</SoftTypography>
          <SoftTypography variant="body2" fontWeight="bold">{fmt(totalControl)}</SoftTypography>
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="caption" color="secondary">إجمالي التفصيل</SoftTypography>
          <SoftTypography variant="body2" fontWeight="bold">{fmt(totalSubledger)}</SoftTypography>
        </SoftBox>
        <SoftBox>
          <SoftTypography variant="caption" color="secondary">الفرق</SoftTypography>
          <SoftTypography variant="body2" fontWeight="bold" sx={{ color: totalControl !== totalSubledger ? "#ea0606" : "#82d616" }}>
            {fmt(totalControl - totalSubledger)}
          </SoftTypography>
        </SoftBox>
        {unmatched > 0 && (
          <Chip label={`${unmatched} حسابات غير متطابقة`} size="small" color="error" sx={{ fontSize: "0.7rem" }} />
        )}
      </SoftBox>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>{type === "customer" ? "الزبون" : "المورد"}</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>إجمالي الفواتير</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>المدفوع</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>الرصيد المحسوب</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>رصيد الأستاذ</TableCell>
              <TableCell sx={{ fontWeight: "bold", fontSize: "0.75rem" }}>المطابقة</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parties.map((p) => <PartyRow key={p.id} party={p} type={type} />)}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

export default function SubledgerReconciliation() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState(0);
  const [parties, setParties]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState("");
  const type = tab === 0 ? "customer" : "supplier";

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    accountingApi.reconciliation(type)
      .then((r) => setParties(r.data?.parties ?? []))
      .catch((error) => {
        setLoadError(getApiErrorMessage(error, "تعذر تحميل مطابقة الحسابات الفرعية"));
        setParties([]);
      })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
          <SoftBox display="flex" alignItems="center" gap={1}>
            <IconButton size="small" onClick={() => navigate(-1)}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <SoftBox>
              <SoftTypography variant="h5" fontWeight="bold">مطابقة الذمم</SoftTypography>
              <SoftTypography variant="caption" color="secondary">
                تسوية أرصدة الزبائن والموردين مع الحسابات الرقابية
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftButton variant="outlined" color="info" size="small">
            <PrintIcon sx={{ mr: 0.5, fontSize: 16 }} /> طباعة تقرير
          </SoftButton>
        </SoftBox>

        {loadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setLoadError("")}>
            {loadError}
          </Alert>
        )}

        <SoftBox sx={{ borderBottom: "1px solid #e9ecef", mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="ذمم العملاء"  sx={{ fontSize: "0.8rem" }} />
            <Tab label="ذمم الموردين" sx={{ fontSize: "0.8rem" }} />
          </Tabs>
        </SoftBox>

        <Card sx={{ p: 2 }}>
          {loading ? (
            <SoftBox display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </SoftBox>
          ) : parties.length === 0 ? (
            <SoftTypography variant="body2" color="text" sx={{ textAlign: "center", py: 4 }}>
              لا توجد ذمم {tab === 0 ? "عملاء" : "موردين"} بعد
            </SoftTypography>
          ) : (
            <ReconciliationTable parties={parties} type={type} />
          )}
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
