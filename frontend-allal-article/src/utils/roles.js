const SELLER_ROLES = new Set(["salesperson", "seller"]);

function normalizeRole(role) {
  return typeof role === "string" ? role.toLowerCase().trim() : "";
}

export function getOrderFormVariant(user) {
  const role = normalizeRole(user?.roleCode ?? user?.role);
  return SELLER_ROLES.has(role) ? "seller" : "admin";
}
