export const UNCONFIRMED_ORDER_STATUSES = new Set(["draft", "submitted", "under_review"]);

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function getOrderStatus(order = {}) {
  return order?.orderStatus || order?.status || "draft";
}

export function getProductOrderQty(order = {}, productId) {
  if (order.qty != null && !Array.isArray(order.items)) {
    return Math.max(0, toNumber(order.qty));
  }

  return (order.items || [])
    .filter((item) => String(item.productId) === String(productId))
    .reduce((sum, item) => {
      const requested = item.requestedQty ?? item.orderedQty ?? item.qty ?? item.approvedQty;
      const cancelled = item.cancelledQty == null ? 0 : toNumber(item.cancelledQty);
      return sum + Math.max(0, toNumber(requested) - cancelled);
    }, 0);
}

export function getUnconfirmedProductQty(orders = [], productId) {
  return orders
    .filter((order) => UNCONFIRMED_ORDER_STATUSES.has(getOrderStatus(order)))
    .reduce((sum, order) => sum + getProductOrderQty(order, productId), 0);
}

export function calculateProductStockMetrics(stockLines = [], orders = [], productId) {
  const totals = stockLines.reduce(
    (acc, line) => {
      const onHand = toNumber(line.onHandQty ?? line.onHand);
      const reserved = toNumber(line.reservedQty ?? line.reserved);
      const available = line.availableQty == null && line.available == null
        ? onHand - reserved
        : toNumber(line.availableQty ?? line.available);

      return {
        onHand: acc.onHand + onHand,
        reserved: acc.reserved + reserved,
        available: acc.available + available,
      };
    },
    { onHand: 0, reserved: 0, available: 0 }
  );

  const pending = getUnconfirmedProductQty(orders, productId);

  return {
    ...totals,
    pending,
    projected: totals.available - pending,
  };
}
