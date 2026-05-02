const productColors = ["#17c1e8", "#82d616", "#fb8c00", "#7928ca", "#344767", "#ea0606"];

export function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

export function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function normalizePriceListId(value, fallback = "MAIN") {
  if (value == null || value === "") return fallback;
  return String(value);
}

export function samePriceListId(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function priceListType(list) {
  return list?.type ?? list?.priceListType ?? list?.price_list_type ?? "";
}

function isPriceListActive(list) {
  return list?.isActive ?? list?.is_active ?? true;
}

export function normalizePriceListsForKind(priceLists = [], kind = "sales") {
  const fallback =
    kind === "purchase"
      ? { id: "PURCHASE_MAIN", name: "السعر الرئيسي", description: "أسعار الشراء الرئيسية" }
      : { id: "MAIN", name: "السعر الرئيسي", description: "أسعار البيع الرئيسية" };

  const typedLists = priceLists
    .filter((list) => {
      const type = priceListType(list);
      return isPriceListActive(list) && (type === kind || type === "both");
    })
    .map((list) => ({
      ...list,
      id: normalizePriceListId(list.id),
      type: priceListType(list),
      name: list.name || list.code || `#${list.id}`,
    }));

  return [fallback, ...typedLists];
}

export function buildPriceListPricesByProduct(priceLists = [], itemsByListId = {}) {
  const listNames = new Map(priceLists.map((list) => [normalizePriceListId(list.id, ""), list.name || list.code || "قائمة أسعار"]));

  return Object.entries(itemsByListId).reduce((byProduct, [listId, rows]) => {
    const normalizedListId = normalizePriceListId(listId, "");
    (rows || []).forEach((row) => {
      const productId = row.product_id ?? row.productId;
      const unitPrice = toNumber(row.unit_price_amount ?? row.unitPrice, 0);
      if (productId == null || unitPrice <= 0) return;

      const productKey = String(productId);
      byProduct[productKey] = {
        ...(byProduct[productKey] || {}),
        [normalizedListId]: {
          unitPrice,
          listName: listNames.get(normalizedListId) || "قائمة أسعار",
        },
      };
    });
    return byProduct;
  }, {});
}

export function attachPriceListPrices(products = [], pricesByProduct = {}) {
  return products.map((product) => ({
    ...product,
    priceListPrices: {
      ...(product.priceListPrices || {}),
      ...(pricesByProduct[String(product.id)] || {}),
    },
  }));
}

export function buildStockByProduct(stockRows = []) {
  return stockRows.reduce((map, row) => {
    const productId = row.productId ?? row.product?.id;
    if (productId == null) return map;

    const current = map.get(productId) || { onHandQty: 0, reservedQty: 0, availableQty: 0 };
    const onHandQty = toNumber(row.onHandQty);
    const reservedQty = toNumber(row.reservedQty);
    const availableQty = row.availableQty == null ? onHandQty - reservedQty : toNumber(row.availableQty);

    map.set(productId, {
      onHandQty: current.onHandQty + onHandQty,
      reservedQty: current.reservedQty + reservedQty,
      availableQty: current.availableQty + availableQty,
    });

    return map;
  }, new Map());
}

export function resolveProductPrice(product, priceListId = "MAIN") {
  const unitPrice = toNumber(
    product?.currentPriceAmount ?? product?.sellingPrice ?? product?.purchasePrice ?? product?.price
  );
  const priceListPrice = product?.priceListPrices?.[normalizePriceListId(priceListId, "")];
  const listUnitPrice = toNumber(priceListPrice?.unitPrice, 0);

  if (priceListPrice && listUnitPrice > 0) {
    return {
      unitPrice: listUnitPrice,
      finalPrice: listUnitPrice,
      basePrice: unitPrice,
      source: "price_list",
      sourceLabel: priceListPrice.listName || "قائمة الأسعار",
      listName: priceListPrice.listName || "قائمة الأسعار",
    };
  }

  return {
    unitPrice,
    finalPrice: unitPrice,
    basePrice: unitPrice,
    source: "product_default",
    sourceLabel: "السعر الرئيسي",
    listName: "السعر الرئيسي",
  };
}

export function normalizeProductForOrder(product, stockByProduct = new Map(), index = 0) {
  const stock = stockByProduct.get(product.id) || {};
  const unit = product.baseUnitSymbol || product.baseUnitName || product.unit || "وحدة";
  const unitPrice = resolveProductPrice(product).unitPrice;

  return {
    ...product,
    name: product.name || product.nameAr || `صنف ${product.id}`,
    code: product.sku || product.code || String(product.id),
    category: product.categoryName || product.category || "عام",
    stock: Math.max(0, toNumber(stock.availableQty, toNumber(product.stock))),
    onHandQty: Math.max(0, toNumber(stock.onHandQty, toNumber(product.onHandQty))),
    reservedQty: Math.max(0, toNumber(stock.reservedQty, toNumber(product.reservedQty))),
    availableQty: Math.max(0, toNumber(stock.availableQty, toNumber(product.availableQty ?? product.stock))),
    unit,
    unitName: product.baseUnitName || product.unitName || unit,
    price: unitPrice,
    sellingPrice: unitPrice,
    currentPriceAmount: unitPrice,
    weightPerUnit: toNumber(product.weightPerUnit),
    unitsPerPackage: Math.max(1, toNumber(product.unitsPerPackage, 1)),
    packageUnit: product.packageUnit || "وحدة",
    color: product.color || productColors[index % productColors.length],
    taxRate: product.taxRate ?? 19,
  };
}

export function normalizeProductsForOrder(products = [], stockRows = []) {
  const stockByProduct = buildStockByProduct(stockRows);
  return products.map((product, index) => normalizeProductForOrder(product, stockByProduct, index));
}

export function getAvailableStock(product) {
  return Math.max(0, toNumber(product?.stock ?? product?.availableQty));
}

export function isOutOfStock(product) {
  return !!product && getAvailableStock(product) <= 0;
}

export function validateSalesQuantity(product, qty) {
  if (!product) return "";
  const requestedQty = toNumber(qty);
  const availableQty = getAvailableStock(product);

  if (requestedQty <= 0) return "الكمية يجب أن تكون أكبر من صفر";
  if (availableQty <= 0) return "نفذ المخزون لهذا الصنف";
  if (requestedQty > availableQty) return `الكمية أكبر من المخزون المتاح (${availableQty})`;
  return "";
}

export function clampSalesQty(product, qty) {
  const requestedQty = Math.max(1, toNumber(qty, 1));
  const availableQty = getAvailableStock(product);
  return availableQty > 0 ? Math.min(requestedQty, availableQty) : 1;
}
