// Soft UI Dashboard React layouts
import Dashboard from "layouts/dashboard";
import Tables from "layouts/tables";
import Billing from "layouts/billing";
import VirtualReality from "layouts/virtual-reality";
import RTL from "layouts/rtl";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";

// New pages
import Orders from "layouts/orders";
import OrderDetail from "layouts/orders/OrderDetail";
import NewOrder from "layouts/orders/NewOrder";
import AdminNewOrder from "layouts/orders/AdminNewOrder";
import NewOrderRouter from "layouts/orders/NewOrderRouter";
import Products from "layouts/products";
import ProductDetail from "layouts/products/ProductDetail";
import ProductForm from "layouts/products/ProductForm";
import ProductSettings from "layouts/products/ProductSettings";
import PriceLists from "layouts/products/PriceLists";
import Customers from "layouts/customers";
import Suppliers from "layouts/suppliers";
import Inventory from "layouts/inventory";
import Manufacturing from "layouts/manufacturing";
import AuditLogs from "layouts/audit-logs";
import Reports from "layouts/reports";
import Users from "layouts/users";
import Settings from "layouts/settings";
import NotificationsInbox from "layouts/notifications/Inbox";
import NotificationPreferences from "layouts/notifications/NotificationPreferences";
import SupportCenter from "layouts/support";
import Purchases from "layouts/purchases";
import PurchaseDetail from "layouts/purchases/PurchaseDetail";
import PurchaseForm from "layouts/purchases/PurchaseForm";
import RoadInvoices from "layouts/road-invoices";
import RoadInvoiceForm from "layouts/road-invoices/RoadInvoiceForm";
import AccountingDashboard from "layouts/accounting/Dashboard";
import AccountsTree from "layouts/accounting/AccountsTree";
import ChartTemplates from "layouts/accounting/ChartTemplates";
import AccountLinks from "layouts/accounting/AccountLinks";
import JournalBooks from "layouts/accounting/JournalBooks";
import Journals from "layouts/accounting/Journals";
import ManualJournalForm from "layouts/accounting/ManualJournalForm";
import FiscalYears from "layouts/accounting/FiscalYears";
import OpeningBalances from "layouts/accounting/OpeningBalances";
import AccountingSettings from "layouts/accounting/AccountingSettings";
import SubLedgers from "layouts/accounting/SubLedgers";
import CashBank from "layouts/accounting/CashBank";
import Taxes from "layouts/accounting/Taxes";
import Dimensions from "layouts/accounting/Dimensions";
import TrialBalance from "layouts/accounting/reports/TrialBalance";
import AccountMovement from "layouts/accounting/reports/AccountMovement";
import GeneralLedger from "layouts/accounting/reports/GeneralLedger";
import IncomeStatement from "layouts/accounting/reports/IncomeStatement";
import BalanceSheet from "layouts/accounting/reports/BalanceSheet";
import SubledgerReconciliation from "layouts/accounting/reports/SubledgerReconciliation";
import CompanyProfile from "layouts/company-profile";
import Partnerships from "layouts/partnerships";
import LinkedInventory from "layouts/partnerships/LinkedInventory";

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
