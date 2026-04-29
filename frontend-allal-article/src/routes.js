import { lazy } from "react";

// Soft UI Dashboard React icons
import Shop from "examples/Icons/Shop";
import Office from "examples/Icons/Office";
import SettingsIcon from "examples/Icons/Settings";
import Document from "examples/Icons/Document";
import CustomerSupport from "examples/Icons/CustomerSupport";
import CreditCard from "examples/Icons/CreditCard";
import Cube from "examples/Icons/Cube";
import Basket from "examples/Icons/Basket";
import NotificationsIcon from "@mui/icons-material/Notifications";
import FactoryIcon from "@mui/icons-material/Factory";
import PriceChangeIcon from "@mui/icons-material/PriceChange";

// Route-level chunks keep the initial dashboard shell small.
const Dashboard = lazy(() => import("layouts/dashboard"));
const Tables = lazy(() => import("layouts/tables"));
const Billing = lazy(() => import("layouts/billing"));
const VirtualReality = lazy(() => import("layouts/virtual-reality"));
const RTL = lazy(() => import("layouts/rtl"));
const Profile = lazy(() => import("layouts/profile"));
const SignIn = lazy(() => import("layouts/authentication/sign-in"));
const SignUp = lazy(() => import("layouts/authentication/sign-up"));
const Orders = lazy(() => import("layouts/orders"));
const OrderDetail = lazy(() => import("layouts/orders/OrderDetail"));
const NewOrder = lazy(() => import("layouts/orders/NewOrder"));
const AdminNewOrder = lazy(() => import("layouts/orders/AdminNewOrder"));
const NewOrderRouter = lazy(() => import("layouts/orders/NewOrderRouter"));
const Products = lazy(() => import("layouts/products"));
const ProductDetail = lazy(() => import("layouts/products/ProductDetail"));
const ProductForm = lazy(() => import("layouts/products/ProductForm"));
const ProductSettings = lazy(() => import("layouts/products/ProductSettings"));
const PriceLists = lazy(() => import("layouts/products/PriceLists"));
const Customers = lazy(() => import("layouts/customers"));
const Suppliers = lazy(() => import("layouts/suppliers"));
const Inventory = lazy(() => import("layouts/inventory"));
const Manufacturing = lazy(() => import("layouts/manufacturing"));
const AuditLogs = lazy(() => import("layouts/audit-logs"));
const Reports = lazy(() => import("layouts/reports"));
const Users = lazy(() => import("layouts/users"));
const Settings = lazy(() => import("layouts/settings"));
const NotificationsInbox = lazy(() => import("layouts/notifications/Inbox"));
const NotificationPreferences = lazy(() => import("layouts/notifications/NotificationPreferences"));
const SupportCenter = lazy(() => import("layouts/support"));
const Purchases = lazy(() => import("layouts/purchases"));
const PurchaseDetail = lazy(() => import("layouts/purchases/PurchaseDetail"));
const PurchaseForm = lazy(() => import("layouts/purchases/PurchaseForm"));
const RoadInvoices = lazy(() => import("layouts/road-invoices"));
const RoadInvoiceForm = lazy(() => import("layouts/road-invoices/RoadInvoiceForm"));
const AccountingDashboard = lazy(() => import("layouts/accounting/Dashboard"));
const AccountsTree = lazy(() => import("layouts/accounting/AccountsTree"));
const ChartTemplates = lazy(() => import("layouts/accounting/ChartTemplates"));
const AccountLinks = lazy(() => import("layouts/accounting/AccountLinks"));
const JournalBooks = lazy(() => import("layouts/accounting/JournalBooks"));
const Journals = lazy(() => import("layouts/accounting/Journals"));
const ManualJournalForm = lazy(() => import("layouts/accounting/ManualJournalForm"));
const FiscalYears = lazy(() => import("layouts/accounting/FiscalYears"));
const OpeningBalances = lazy(() => import("layouts/accounting/OpeningBalances"));
const AccountingSettings = lazy(() => import("layouts/accounting/AccountingSettings"));
const SubLedgers = lazy(() => import("layouts/accounting/SubLedgers"));
const CashBank = lazy(() => import("layouts/accounting/CashBank"));
const Taxes = lazy(() => import("layouts/accounting/Taxes"));
const Dimensions = lazy(() => import("layouts/accounting/Dimensions"));
const TrialBalance = lazy(() => import("layouts/accounting/reports/TrialBalance"));
const AccountMovement = lazy(() => import("layouts/accounting/reports/AccountMovement"));
const GeneralLedger = lazy(() => import("layouts/accounting/reports/GeneralLedger"));
const IncomeStatement = lazy(() => import("layouts/accounting/reports/IncomeStatement"));
const BalanceSheet = lazy(() => import("layouts/accounting/reports/BalanceSheet"));
const SubledgerReconciliation = lazy(() => import("layouts/accounting/reports/SubledgerReconciliation"));
const CompanyProfile = lazy(() => import("layouts/company-profile"));
const Partnerships = lazy(() => import("layouts/partnerships"));
const LinkedInventory = lazy(() => import("layouts/partnerships/LinkedInventory"));

const routes = [
  // ─── Main ───────────────────────────────────────────────
  { type: "title", title: "القائمة الرئيسية", key: "main-title" },
  {
    type: "collapse",
    name: "الرئيسية",
    key: "dashboard",
    route: "/dashboard",
    icon: <Shop size="12px" />,
    component: <Dashboard />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الطلبيات",
    key: "orders",
    route: "/orders",
    icon: <Basket size="12px" />,
    component: <Orders />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الأصناف",
    key: "products",
    route: "/products",
    icon: <Cube size="12px" />,
    component: <Products />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "قوائم الأسعار",
    key: "price-lists",
    route: "/products/price-lists",
    icon: <PriceChangeIcon fontSize="small" />,
    component: <PriceLists />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الزبائن",
    key: "customers",
    route: "/customers",
    icon: <CustomerSupport size="12px" />,
    component: <Customers />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الموردين",
    key: "suppliers",
    route: "/suppliers",
    icon: <CustomerSupport size="12px" />,
    component: <Suppliers />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "المخزون",
    key: "inventory",
    route: "/inventory",
    icon: <Office size="12px" />,
    component: <Inventory />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "التصنيع",
    key: "manufacturing",
    route: "/manufacturing",
    icon: <FactoryIcon fontSize="small" />,
    component: <Manufacturing />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "المشتريات",
    key: "purchases",
    route: "/purchases",
    icon: <CreditCard size="12px" />,
    component: <Purchases />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "فواتير الطريق",
    key: "road-invoices",
    route: "/road-invoices",
    icon: <Document size="12px" />,
    component: <RoadInvoices />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "التقارير",
    key: "reports",
    route: "/reports",
    icon: <Document size="12px" />,
    component: <Reports />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "سجل العمليات",
    key: "audit-logs",
    route: "/audit-logs",
    icon: <Document size="12px" />,
    component: <AuditLogs />,
    noCollapse: true,
  },

  { type: "divider", key: "divider-1" },

  // ─── Account ────────────────────────────────────────────
  { type: "title", title: "الحساب والإعدادات", key: "account-pages" },
  {
    type: "collapse",
    name: "الملف الشخصي",
    key: "profile",
    route: "/profile",
    icon: <CustomerSupport size="12px" />,
    component: <Profile />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "المستخدمون",
    key: "users",
    route: "/users",
    icon: <Office size="12px" />,
    component: <Users />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الإعدادات",
    key: "settings",
    route: "/settings",
    icon: <SettingsIcon size="12px" />,
    component: <Settings />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الإشعارات",
    key: "notifications",
    route: "/notifications",
    icon: <NotificationsIcon fontSize="small" />,
    component: <NotificationsInbox />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "الدعم",
    key: "support",
    route: "/support",
    icon: <CustomerSupport size="12px" />,
    component: <SupportCenter />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "معلومات الشركة",
    key: "company-profile",
    route: "/company-profile",
    icon: <Office size="12px" />,
    component: <CompanyProfile />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "شبكة الشركاء",
    key: "partnerships",
    route: "/partnerships",
    icon: <Office size="12px" />,
    component: <Partnerships />,
    noCollapse: true,
  },
  {
    key: "sign-in",
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    key: "sign-up",
    route: "/authentication/sign-up",
    component: <SignUp />,
  },

  // ─── Accounting module ──────────────────────────────────
  {
    type: "title", title: "المحاسبة", key: "accounting-title",
  },
  {
    type: "collapse", name: "لوحة المحاسبة", key: "accounting-dashboard",
    route: "/accounting/dashboard", icon: <Document size="12px" />,
    component: <AccountingDashboard />, noCollapse: true,
  },
  {
    type: "collapse", name: "شجرة الحسابات", key: "accounts-tree",
    route: "/accounting/accounts-tree", icon: <Document size="12px" />,
    component: <AccountsTree />, noCollapse: true,
  },
  {
    type: "collapse", name: "دفتر اليومية", key: "journals",
    route: "/accounting/journals", icon: <Document size="12px" />,
    component: <Journals />, noCollapse: true,
  },
  {
    type: "collapse", name: "السنوات المالية", key: "fiscal-years",
    route: "/accounting/fiscal-years", icon: <Document size="12px" />,
    component: <FiscalYears />, noCollapse: true,
  },
  {
    type: "collapse", name: "ميزان المراجعة", key: "trial-balance",
    route: "/accounting/reports/trial-balance", icon: <Document size="12px" />,
    component: <TrialBalance />, noCollapse: true,
  },
  {
    type: "collapse", name: "قائمة الدخل", key: "income-statement",
    route: "/accounting/reports/income-statement", icon: <Document size="12px" />,
    component: <IncomeStatement />, noCollapse: true,
  },
  {
    type: "collapse", name: "الميزانية العمومية", key: "balance-sheet",
    route: "/accounting/reports/balance-sheet", icon: <Document size="12px" />,
    component: <BalanceSheet />, noCollapse: true,
  },
  {
    type: "collapse", name: "الأستاذ العام", key: "general-ledger",
    route: "/accounting/reports/general-ledger", icon: <Document size="12px" />,
    component: <GeneralLedger />, noCollapse: true,
  },
  {
    type: "collapse", name: "مطابقة الذمم", key: "subledger-reconciliation",
    route: "/accounting/reports/subledger-reconciliation", icon: <Document size="12px" />,
    component: <SubledgerReconciliation />, noCollapse: true,
  },

  { type: "divider", key: "divider-2" },

  // ─── Hidden routes (no sidebar) ─────────────────────────
  {
    key: "road-invoice-new",
    route: "/road-invoices/new",
    component: <RoadInvoiceForm />,
  },
  {
    key: "road-invoice-from-orders",
    route: "/road-invoices/from-orders",
    component: <RoadInvoiceForm />,
  },
  {
    key: "road-invoice-detail",
    route: "/road-invoices/:id",
    component: <RoadInvoiceForm />,
  },
  {
    key: "order-detail",
    route: "/orders/:id",
    component: <OrderDetail />,
  },
  {
    key: "purchase-new",
    route: "/purchases/new",
    component: <PurchaseForm />,
  },
  {
    key: "purchase-edit",
    route: "/purchases/:id/edit",
    component: <PurchaseForm />,
  },
  {
    key: "purchase-detail",
    route: "/purchases/:id",
    component: <PurchaseDetail />,
  },
  // Accounting hidden routes
  { key: "journal-new",              route: "/accounting/journals/new",                         component: <ManualJournalForm /> },
  { key: "opening-balances",         route: "/accounting/opening-balances",                     component: <OpeningBalances /> },
  { key: "accounting-settings",      route: "/accounting/settings",                             component: <AccountingSettings /> },
  { key: "chart-templates",          route: "/accounting/chart-templates",                      component: <ChartTemplates /> },
  { key: "account-links",            route: "/accounting/account-links",                        component: <AccountLinks /> },
  { key: "journal-books",            route: "/accounting/journal-books",                        component: <JournalBooks /> },
  { key: "sub-ledgers",              route: "/accounting/sub-ledgers",                          component: <SubLedgers /> },
  { key: "cash-bank",                route: "/accounting/cash-bank",                            component: <CashBank /> },
  { key: "taxes",                    route: "/accounting/taxes",                                component: <Taxes /> },
  { key: "dimensions",               route: "/accounting/dimensions",                           component: <Dimensions /> },
  { key: "notification-preferences", route: "/notifications/preferences",                       component: <NotificationPreferences /> },
  { key: "account-movement",         route: "/accounting/reports/account-movement",             component: <AccountMovement /> },
  { key: "general-ledger",           route: "/accounting/reports/general-ledger",               component: <GeneralLedger /> },
  { key: "income-statement",         route: "/accounting/reports/income-statement",             component: <IncomeStatement /> },
  { key: "balance-sheet",            route: "/accounting/reports/balance-sheet",                component: <BalanceSheet /> },
  { key: "subledger-reconciliation", route: "/accounting/reports/subledger-reconciliation",     component: <SubledgerReconciliation /> },
  {
    key: "new-order",
    route: "/orders/new",
    component: <NewOrderRouter />,
  },
  {
    key: "new-order-seller",
    route: "/orders/seller/new",
    component: <NewOrder />,
  },
  {
    key: "new-order-admin",
    route: "/orders/admin/new",
    component: <AdminNewOrder />,
  },
  {
    key: "product-favorites",
    route: "/products/favorites",
    component: (
      <Products
        initialCategory="المفضلة"
        title="مفضلة الأصناف"
        subtitle="الأصناف التي أضفتها للمفضلة للوصول السريع"
      />
    ),
  },
  {
    key: "product-settings",
    route: "/products/settings",
    component: <ProductSettings />,
  },
  {
    key: "product-detail",
    route: "/products/:id",
    component: <ProductDetail />,
  },
  {
    key: "product-new",
    route: "/products/new",
    component: <ProductForm />,
  },
  {
    key: "product-edit",
    route: "/products/:id/edit",
    component: <ProductForm />,
  },

  // ─── Partnership hidden routes ───────────────────────────
  { key: "linked-inventory", route: "/partnerships/inventory/:partnerId", component: <LinkedInventory /> },

  // ─── Legacy (keep for compatibility) ────────────────────
  {
    key: "tables",
    route: "/tables",
    component: <Tables />,
  },
  {
    key: "billing",
    route: "/billing",
    component: <Billing />,
  },
  {
    key: "virtual-reality",
    route: "/virtual-reality",
    component: <VirtualReality />,
  },
  {
    key: "rtl",
    route: "/rtl",
    component: <RTL />,
  },
];

export default routes;
