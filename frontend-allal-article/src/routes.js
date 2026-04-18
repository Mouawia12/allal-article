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
import Products from "layouts/products";
import ProductDetail from "layouts/products/ProductDetail";
import ProductForm from "layouts/products/ProductForm";
import Customers from "layouts/customers";
import Inventory from "layouts/inventory";
import AuditLogs from "layouts/audit-logs";
import Reports from "layouts/reports";
import Users from "layouts/users";
import Settings from "layouts/settings";

// Soft UI Dashboard React icons
import Shop from "examples/Icons/Shop";
import Office from "examples/Icons/Office";
import SettingsIcon from "examples/Icons/Settings";
import Document from "examples/Icons/Document";
import SpaceShip from "examples/Icons/SpaceShip";
import CustomerSupport from "examples/Icons/CustomerSupport";
import CreditCard from "examples/Icons/CreditCard";
import Cube from "examples/Icons/Cube";
import Basket from "examples/Icons/Basket";

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
    name: "الزبائن",
    key: "customers",
    route: "/customers",
    icon: <CustomerSupport size="12px" />,
    component: <Customers />,
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
    name: "تسجيل الدخول",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: <Document size="12px" />,
    component: <SignIn />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "إنشاء حساب",
    key: "sign-up",
    route: "/authentication/sign-up",
    icon: <SpaceShip size="12px" />,
    component: <SignUp />,
    noCollapse: true,
  },

  // ─── Hidden routes (no sidebar) ─────────────────────────
  {
    key: "order-detail",
    route: "/orders/:id",
    component: <OrderDetail />,
  },
  {
    key: "new-order",
    route: "/orders/new",
    component: <NewOrder />,
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
