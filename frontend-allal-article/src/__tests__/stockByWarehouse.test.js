import React from "react";
import "@testing-library/jest-dom";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import theme from "assets/theme";
import { SoftUIControllerProvider } from "context";
import { I18nProvider } from "i18n";
import StockByWarehouseDialog from "layouts/products/StockByWarehouseDialog";

const product = { name: "مياه معدنية 1.5 لتر", code: "ART-008", unit: "حزمة" };

function renderDialog(stockLines) {
  return render(
    <SoftUIControllerProvider>
      <I18nProvider>
        <ThemeProvider theme={theme}>
          <StockByWarehouseDialog open onClose={() => {}} product={product} stockLines={stockLines} />
        </ThemeProvider>
      </I18nProvider>
    </SoftUIControllerProvider>
  );
}

function bodyRows() {
  return screen.getAllByRole("row").slice(1); // drop the header row
}

describe("StockByWarehouseDialog", () => {
  it("lists one row per warehouse, largest holding first", () => {
    renderDialog([
      { id: 1, warehouseId: 1, warehouseName: "مستودع وهران", onHandQty: 45, reservedQty: 5, availableQty: 40 },
      { id: 2, warehouseId: 2, warehouseName: "المستودع الرئيسي", onHandQty: 120, reservedQty: 30, availableQty: 90 },
      { id: 3, warehouseId: 3, warehouseName: "مستودع قسنطينة", onHandQty: 35, reservedQty: 0, availableQty: 35 },
    ]);

    const rows = bodyRows();
    expect(rows).toHaveLength(4); // three warehouses + totals

    expect(within(rows[0]).getByText("المستودع الرئيسي")).toBeInTheDocument();
    expect(within(rows[1]).getByText("مستودع وهران")).toBeInTheDocument();
    expect(within(rows[2]).getByText("مستودع قسنطينة")).toBeInTheDocument();
  });

  it("shows each warehouse's share of the total on hand", () => {
    renderDialog([
      { id: 1, warehouseId: 1, warehouseName: "أ", onHandQty: 75, reservedQty: 0, availableQty: 75 },
      { id: 2, warehouseId: 2, warehouseName: "ب", onHandQty: 25, reservedQty: 0, availableQty: 25 },
    ]);

    const rows = bodyRows();
    expect(within(rows[0]).getByText("75%")).toBeInTheDocument();
    expect(within(rows[1]).getByText("25%")).toBeInTheDocument();
  });

  it("totals every column across warehouses", () => {
    renderDialog([
      { id: 1, warehouseId: 1, warehouseName: "أ", onHandQty: 120, reservedQty: 30, availableQty: 90 },
      { id: 2, warehouseId: 2, warehouseName: "ب", onHandQty: 45, reservedQty: 5, availableQty: 40 },
    ]);

    const totals = bodyRows().at(-1);
    expect(within(totals).getByText("الإجمالي · 2 مستودع")).toBeInTheDocument();
    expect(within(totals).getByText("165")).toBeInTheDocument(); // on hand
    expect(within(totals).getByText("35")).toBeInTheDocument();  // reserved
    expect(within(totals).getByText("130")).toBeInTheDocument(); // available
  });

  it("derives available from on hand minus reserved when the API omits it", () => {
    renderDialog([
      { id: 1, warehouseId: 1, warehouseName: "أ", onHandQty: 100, reservedQty: 40 },
    ]);

    const row = bodyRows()[0];
    expect(within(row).getByText("60")).toBeInTheDocument();
  });

  it("explains the empty case instead of showing a bare table", () => {
    renderDialog([]);

    expect(screen.getByText("لا يوجد هذا الصنف في أي مستودع بعد")).toBeInTheDocument();
    expect(screen.queryByRole("row")).not.toBeInTheDocument();
  });
});
