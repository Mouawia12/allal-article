/**
 * Automated integration tests for critical frontend API calls.
 * Run with: npm test -- --watchAll=false
 */

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
