function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  const normalized = typeof value === "string" ? value.replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateKey(value) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function shortDate(value) {
  return value ? String(value).slice(0, 10) : "—";
}

export function isCustomerShipmentOrder(order = {}) {
  const orderStatus = String(order.orderStatus ?? order.status ?? "").toLowerCase();
  const shippingStatus = String(order.shippingStatus ?? "").toLowerCase();

  return Boolean(order.shippedAt) ||
    shippingStatus === "shipped" ||
    orderStatus === "shipped" ||
    orderStatus === "completed";
}

export function getOrderShipmentQuantity(order = {}) {
  return (order.items || []).reduce((sum, item) => {
    const shippedQty = toNumber(item.shippedQty);
    if (shippedQty > 0) return sum + shippedQty;

    const approvedQty = toNumber(item.approvedQty);
    if (approvedQty > 0) return sum + approvedQty;

    return sum + toNumber(item.requestedQty ?? item.qty ?? item.quantity);
  }, 0);
}

export function buildCustomerShipments(orders = [], customer = {}) {
  return orders
    .filter(isCustomerShipmentOrder)
    .slice()
    .sort((a, b) => {
      const aDate = a.shippedAt ?? a.completedAt ?? a.createdAt ?? a.date;
      const bDate = b.shippedAt ?? b.completedAt ?? b.createdAt ?? b.date;
      return dateKey(bDate) - dateKey(aDate);
    })
    .map((order) => {
      const orderStatus = String(order.orderStatus ?? order.status ?? "").toLowerCase();
      const shippedDate = order.shippedAt ?? order.completedAt ?? order.createdAt ?? order.date;
      const delivered = orderStatus === "completed";

      return {
        id: order.id ?? order.publicId ?? order.orderNumber,
        invoiceNumber: order.orderNumber ?? String(order.id ?? "—"),
        date: shortDate(shippedDate),
        status: delivered ? "delivered" : "shipped",
        statusLabel: delivered ? "مكتملة" : "تم الشحن",
        statusColor: delivered ? "success" : "info",
        driverName: order.driverName ?? order.shippingDriverName ?? "—",
        salesperson: order.salesUserName ?? customer.salesperson ?? "—",
        route: order.shippingRoute ?? customer.shippingRoute ?? "—",
        amount: toNumber(order.totalAmount ?? order.amount),
        itemsCount: Array.isArray(order.items) ? order.items.length : toNumber(order.lines),
        quantity: getOrderShipmentQuantity(order),
      };
    });
}
