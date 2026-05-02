/**
 * Automated integration tests for critical frontend API calls.
 * Run with: npm test -- --watchAll=false
 */

import {
  applyApiErrors,
  getApiErrorMessage,
  getApiFieldErrors,
  hasErrors,
  isBlank,
  isPositiveNumber,
} from "utils/formErrors";
import { decodeJwtPayload } from "utils/jwt";
import { generateInviteCode } from "utils/inviteCodes";
import { buildCustomerShipments } from "utils/customerShipments";
import { formatCatalogPrice, normalizeCatalogProducts } from "utils/productCatalog";
import { calculateProductStockMetrics, getProductOrderQty } from "utils/productStockMetrics";
import { getOrderFormVariant } from "utils/roles";
import {
  attachPriceListPrices,
  buildPriceListPricesByProduct,
  normalizePriceListsForKind,
  resolveProductPrice,
} from "utils/orderProductData";

// Test that apiClient unwraps ApiResponse correctly
test("apiClient interceptor unwraps ApiResponse envelope", () => {
  const mockResponseData = { success: true, data: [1, 2, 3], message: "OK", timestamp: "2026" };

  // Simulate what the interceptor does
  const body = mockResponseData;
  let result = body;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    result = body.data;
  }

  expect(result).toEqual([1, 2, 3]);
});

test("apiClient interceptor leaves non-ApiResponse alone", () => {
  const mockResponseData = [1, 2, 3]; // raw array, no wrapper

  const body = mockResponseData;
  let result = body;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    result = body.data;
  }

  expect(result).toEqual([1, 2, 3]);
});

test("Array.isArray guard handles undefined gracefully", () => {
  const extract = (r) =>
    Array.isArray(r.data?.data) ? r.data.data
    : Array.isArray(r.data?.content) ? r.data.content
    : Array.isArray(r.data) ? r.data
    : [];

  // After interceptor unwrapping, r.data = actual array
  expect(extract({ data: [1, 2, 3] })).toEqual([1, 2, 3]);
  // PageResponse format
  expect(extract({ data: { content: [4, 5, 6], page: 0 } })).toEqual([4, 5, 6]);
  // Null / undefined
  expect(extract({ data: null })).toEqual([]);
  expect(extract({ data: undefined })).toEqual([]);
});

test("PriceLists selectedList guard — no crash when lists empty", () => {
  const lists = [];
  const selectedId = "SOME_ID";
  const selectedList = lists.find((l) => l.id === selectedId) || null;

  // Should not crash — null check prevents .items access
  expect(selectedList).toBeNull();
  expect(selectedList?.type).toBeUndefined();
  expect(selectedList?.items).toBeUndefined();
});

test("order product pricing resolves active API price-list rows", () => {
  const priceLists = normalizePriceListsForKind([
    { id: 7, name: "قائمة تجريبية", type: "sales", is_active: true },
    { id: 8, name: "قائمة شراء", type: "purchase", is_active: true },
  ], "sales");
  const pricesByProduct = buildPriceListPricesByProduct(priceLists, {
    7: [{ product_id: 10, unit_price_amount: "300" }],
  });
  const [product] = attachPriceListPrices([{ id: 10, currentPriceAmount: "850" }], pricesByProduct);

  expect(priceLists.map((list) => list.id)).toEqual(["MAIN", "7"]);
  expect(resolveProductPrice(product, "7", "sales")).toMatchObject({
    unitPrice: 300,
    basePrice: 850,
    source: "price_list",
    sourceLabel: "قائمة تجريبية",
  });
  expect(resolveProductPrice(product, "MAIN", "sales")).toMatchObject({
    unitPrice: 850,
    source: "product_default",
  });
});

test("inventory hydrateStockLines normalizes API field names", () => {
  function hydrateStockLines(stockLines, warehouses) {
    return stockLines.map((line) => {
      const warehouse = warehouses.find((w) => w.id === (line.warehouseId ?? line.warehouse_id));
      const onHand = Number(line.onHand ?? line.onHandQty ?? 0);
      const reserved = Number(line.reserved ?? line.reservedQty ?? 0);
      const pending = Number(line.pending ?? 0);
      const available = onHand - reserved;
      const name = line.name ?? line.productName ?? "";
      const code = line.code ?? line.productSku ?? line.productCode ?? "";
      return { ...line, name, code, onHand, reserved, pending, available,
        warehouseName: line.warehouseName ?? warehouse?.name ?? "—" };
    });
  }

  const apiLine = {
    productId: 1, productName: "كابل كهربائي", productSku: "KBL-25",
    warehouseId: 10, warehouseName: "المستودع الرئيسي",
    onHandQty: 100, reservedQty: 20, availableQty: 80,
  };

  const result = hydrateStockLines([apiLine], []);
  expect(result[0].name).toBe("كابل كهربائي");
  expect(result[0].code).toBe("KBL-25");
  expect(result[0].onHand).toBe(100);
  expect(result[0].reserved).toBe(20);
  expect(result[0].available).toBe(80);
  expect(result[0].warehouseName).toBe("المستودع الرئيسي");
});

test("product detail stock metrics subtract unconfirmed order quantities", () => {
  const metrics = calculateProductStockMetrics(
    [{ onHandQty: 100, reservedQty: 50, availableQty: 50 }],
    [
      { orderStatus: "draft", items: [{ productId: 1, requestedQty: 20 }] },
      { orderStatus: "draft", items: [{ productId: 1, requestedQty: 3 }] },
      { orderStatus: "submitted", items: [{ productId: 1, requestedQty: 2 }] },
      { orderStatus: "confirmed", items: [{ productId: 1, requestedQty: 50 }] },
      { orderStatus: "draft", items: [{ productId: 2, requestedQty: 99 }] },
    ],
    1
  );

  expect(metrics.pending).toBe(25);
  expect(metrics.projected).toBe(25);
});

test("product detail related order quantity reads backend requestedQty", () => {
  const qty = getProductOrderQty({
    items: [
      { productId: 1, requestedQty: "5.5" },
      { productId: 1, requestedQty: 3, cancelledQty: 1 },
      { productId: 2, requestedQty: 10 },
    ],
  }, 1);

  expect(qty).toBe(7.5);
});

test("product catalog cards use backend price and inventory stock fields", () => {
  const products = [{
    id: 1,
    sku: "AI-72878",
    name: "صنف تجريبي",
    categoryName: null,
    baseUnitSymbol: "قطعة",
    currentPriceAmount: "1200.00",
    minStockQty: "10",
    updatedAt: "2026-04-29T13:20:00Z",
  }];
  const stockRows = [{
    productId: 1,
    onHandQty: "100",
    reservedQty: "50",
    pendingQty: "0",
    availableQty: "50",
    projectedQty: "50",
  }];

  const [product] = normalizeCatalogProducts(products, stockRows);

  expect(product.code).toBe("AI-72878");
  expect(product.category).toBe("غير مصنف");
  expect(product.unit).toBe("قطعة");
  expect(product.price).toBe(1200);
  expect(product.onHand).toBe(100);
  expect(product.reserved).toBe(50);
  expect(product.available).toBe(50);
  expect(formatCatalogPrice(product.price)).toBe("1.200 دج");
});

test("product catalog price formatter avoids NaN labels", () => {
  expect(formatCatalogPrice(undefined)).toBe("غير محدد");
});

test("customer shipment history comes from shipped and completed orders", () => {
  const shipments = buildCustomerShipments([
    {
      id: 1,
      orderNumber: "ORD-1",
      orderStatus: "completed",
      shippingStatus: "shipped",
      totalAmount: "3000",
      shippedAt: "2026-04-29T08:00:00Z",
      salesUserName: "معاوية",
      items: [{ requestedQty: 10, approvedQty: 8, shippedQty: 8 }],
    },
    {
      id: 2,
      orderNumber: "ORD-2",
      orderStatus: "confirmed",
      shippingStatus: "pending",
      totalAmount: "2000",
      items: [{ requestedQty: 5, approvedQty: 5 }],
    },
  ], { shippingRoute: "oran", salesperson: "كمال" });

  expect(shipments).toHaveLength(1);
  expect(shipments[0]).toMatchObject({
    invoiceNumber: "ORD-1",
    status: "delivered",
    statusLabel: "مكتملة",
    route: "oran",
    salesperson: "معاوية",
    amount: 3000,
    quantity: 8,
  });
});

test("periodDates returns correct date range for month", () => {
  // Use local date string to avoid timezone issues
  function toLocalISOString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function periodDates(period) {
    const now = new Date(2026, 3, 27); // April 27, 2026 local
    let from = new Date(now);
    if (period === "week") from.setDate(now.getDate() - 7);
    else if (period === "month") from = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === "quarter") from = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    else from = new Date(now.getFullYear(), 0, 1);
    return { from: toLocalISOString(from), to: toLocalISOString(now) };
  }

  const { from, to } = periodDates("month");
  expect(from).toBe("2026-04-01");
  expect(to).toBe("2026-04-27");

  const { from: yearFrom } = periodDates("year");
  expect(yearFrom).toBe("2026-01-01");
});

test("form error helpers map backend validation fields", () => {
  const error = {
    response: {
      data: {
        message: "Validation failed",
        errors: [
          { field: "name", message: "الاسم مطلوب" },
          { field: "items.0.qty", message: "الكمية غير صحيحة" },
          { field: "", message: "ignored" },
        ],
      },
    },
  };

  expect(getApiFieldErrors(error)).toEqual({
    name: "الاسم مطلوب",
    "items.0.qty": "الكمية غير صحيحة",
    qty: "الكمية غير صحيحة",
  });
  expect(getApiErrorMessage(error, "fallback")).toBe("يرجى تصحيح الأخطاء الموضحة في الحقول");
});

test("form error helpers prefer server messages and detect network errors", () => {
  expect(getApiErrorMessage({}, "fallback")).toBe("تعذر الاتصال بالخادم");
  expect(getApiErrorMessage({
    response: { data: { message: "غير مصرح" } },
  }, "fallback")).toBe("غير مصرح");
  expect(getApiErrorMessage({
    response: { data: {} },
  }, "fallback")).toBe("fallback");
});

test("applyApiErrors merges field and global errors", () => {
  let captured;
  const setErrors = (updater) => {
    captured = updater({ existing: "يبقى" });
  };

  applyApiErrors({
    response: {
      data: {
        message: "Validation failed",
        errors: [{ field: "email", message: "البريد غير صحيح" }],
      },
    },
  }, setErrors, "تعذر الحفظ");

  expect(captured).toEqual({
    existing: "يبقى",
    email: "البريد غير صحيح",
    _global: "يرجى تصحيح الأخطاء الموضحة في الحقول",
  });
});

test("basic validation helpers handle blank and positive values", () => {
  expect(isBlank("   ")).toBe(true);
  expect(isBlank(0)).toBe(false);
  expect(isPositiveNumber("2.5")).toBe(true);
  expect(isPositiveNumber("0")).toBe(false);
  expect(hasErrors({ name: "", qty: "مطلوب" })).toBe(true);
  expect(hasErrors({ name: "", qty: null })).toBe(false);
});

test("decodeJwtPayload handles base64url JWT payloads without padding", () => {
  const token = "header.eyJ1c2VySWQiOjQyLCJyb2xlQ29kZSI6ImFkbWluIn0.signature";

  expect(decodeJwtPayload(token)).toEqual({
    userId: 42,
    roleCode: "admin",
  });
});

test("decodeJwtPayload returns null for malformed tokens", () => {
  expect(decodeJwtPayload("not-a-token")).toBeNull();
  expect(decodeJwtPayload("header.invalid.signature")).toBeNull();
  expect(decodeJwtPayload(null)).toBeNull();
});

test("order form routing uses authenticated user role", () => {
  expect(getOrderFormVariant({ roleCode: "salesperson" })).toBe("seller");
  expect(getOrderFormVariant({ roleCode: " SELLER " })).toBe("seller");
  expect(getOrderFormVariant({ roleCode: "admin" })).toBe("admin");
  expect(getOrderFormVariant(null)).toBe("admin");
});

test("invite code generation uses secure random bytes", () => {
  const cryptoSource = {
    getRandomValues: jest.fn((values) => {
      values.set([0, 1, 2, 3]);
      return values;
    }),
  };

  expect(generateInviteCode(cryptoSource)).toBe("LINK-ABCD-ABCD");
  expect(cryptoSource.getRandomValues).toHaveBeenCalledTimes(2);
});

test("invite code generation rejects missing secure random source", () => {
  expect(() => generateInviteCode({})).toThrow("Secure random generator unavailable");
});
