const productPalette = ["#17c1e8", "#66BB6A", "#fb8c00", "#7b809a", "#344767", "#ea0606"];

export function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const normalized = typeof value === "string" ? value.replace(",", ".") : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatCatalogPrice(value) {
  const amount = toNumber(value, null);
  if (amount === null) return "غير محدد";
  return `${new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 2 }).format(amount)} دج`;
}

export function formatCatalogDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ar-DZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function productColor(product) {
  const key = String(product?.categoryName ?? product?.category ?? product?.name ?? product?.id ?? "");
  const hash = [...key].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return productPalette[hash % productPalette.length];
}

export function buildProductStockMap(stockRows = []) {
  return stockRows.reduce((map, row) => {
    const productId = row.productId ?? row.product_id;
    if (productId === null || productId === undefined) return map;

    const current = map.get(productId) || {
      onHand: 0,
      reserved: 0,
      pending: 0,
      available: 0,
      projected: 0,
      hasRows: false,
    };
    const onHand = toNumber(row.onHandQty ?? row.onHand);
    const reserved = toNumber(row.reservedQty ?? row.reserved);
    const pending = toNumber(row.pendingQty ?? row.pending);
    const available =
      row.availableQty === null || row.availableQty === undefined
        ? onHand - reserved
        : toNumber(row.availableQty);
    const projected = available - pending;

    map.set(productId, {
      onHand: current.onHand + onHand,
      reserved: current.reserved + reserved,
      pending: current.pending + pending,
      available: current.available + available,
      projected: current.projected + projected,
      hasRows: true,
    });
    return map;
  }, new Map());
}

export function normalizeCatalogProduct(product, stockMap = new Map()) {
  const stock = stockMap.get(product.id) || {};
  const onHand = stock.hasRows ? stock.onHand : toNumber(product.onHandQty ?? product.onHand ?? product.stock);
  const reserved = stock.hasRows ? stock.reserved : toNumber(product.reservedQty ?? product.reserved);
  const pending = stock.hasRows ? stock.pending : toNumber(product.pendingQty ?? product.pending);
  const available = stock.hasRows
    ? stock.available
    : toNumber(product.availableQty ?? product.available, onHand - reserved);
  const projected = stock.hasRows ? stock.projected : available - pending;

  return {
    ...product,
    code: product.sku ?? product.code ?? "—",
    category: product.categoryName ?? product.category ?? "غير مصنف",
    unit: product.baseUnitSymbol ?? product.baseUnitName ?? product.unit ?? "وحدة",
    color: product.color ?? productColor(product),
    image: product.image ?? null,
    price: toNumber(product.currentPriceAmount ?? product.price, null),
    priceCurrency: product.priceCurrency ?? "DZD",
    lastPriceUpdatedAt: product.lastPriceUpdatedAt ?? product.updatedAt ?? product.createdAt ?? null,
    minStockQty: toNumber(product.minStockQty),
    onHand,
    reserved,
    pending,
    available,
    projected,
  };
}

export function normalizeCatalogProducts(products = [], stockRows = []) {
  const stockMap = buildProductStockMap(stockRows);
  return products.map((product) => normalizeCatalogProduct(product, stockMap));
}
