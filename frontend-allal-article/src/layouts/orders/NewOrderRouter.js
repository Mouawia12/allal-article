import AdminNewOrder from "./AdminNewOrder";
import NewOrder from "./NewOrder";

const SELLER_ROLES = ["salesperson", "seller"];

export default function NewOrderRouter() {
  const role = (localStorage.getItem("currentUserRole") || "admin").toLowerCase().trim();
  return SELLER_ROLES.includes(role) ? <NewOrder /> : <AdminNewOrder />;
}
