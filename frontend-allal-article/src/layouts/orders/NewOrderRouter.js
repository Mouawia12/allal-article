import AdminNewOrder from "./AdminNewOrder";
import NewOrder from "./NewOrder";
import { useAuth } from "context/AuthContext";
import { getOrderFormVariant } from "utils/roles";

export default function NewOrderRouter() {
  const { user } = useAuth();

  return getOrderFormVariant(user) === "seller" ? <NewOrder /> : <AdminNewOrder />;
}
