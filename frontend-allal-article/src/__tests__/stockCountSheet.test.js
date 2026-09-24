import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";

import theme from "assets/theme";
import { SoftUIControllerProvider } from "context";
import { I18nProvider } from "i18n";
import StockCountSheet from "layouts/inventory/StockCountSheet";

jest.mock("services", () => ({
  inventoryApi: {
    getCount: jest.fn(),
    saveCountEntries: jest.fn(),
    closeCount: jest.fn(),
    approveCount: jest.fn(),
    cancelCount: jest.fn(),
  },
}));

// eslint-disable-next-line import/first
import { inventoryApi } from "services";

const item = (over = {}) => ({
  id: 1,
  productId: 7,
  productSku: "ART-007",
  productName: "حليب مبستر 1 لتر",
  baseUnitName: "لتر",
  systemQty: null,
  countedQty: null,
  recountQty: null,
  finalQty: null,
  difference: null,
  unitCost: 99.3333,
  differenceValue: null,
  counted: false,
  ...over,
});

const count = (over = {}) => ({
  id: 5,
  reference: "INV-2026-00001",
  warehouseId: 1,
  warehouseName: "المستودع الرئيسي",
  status: "open",
  blind: true,
  totalItems: 1,
  countedItems: 0,
  varianceItems: 0,
  netVarianceQty: 0,
  netVarianceValue: 0,
  itemsWithoutCost: 0,
  journalNumber: null,
  items: [item()],
  ...over,
});

function renderSheet() {
  return render(
    <SoftUIControllerProvider>
      <I18nProvider>
        <ThemeProvider theme={theme}>
          <StockCountSheet countId={5} onBack={() => {}} />
        </ThemeProvider>
      </I18nProvider>
    </SoftUIControllerProvider>
  );
}

const headers = () => screen.getAllByRole("columnheader").map((th) => th.textContent);

/** Intl renders Arabic-Indic digits in the browser and Latin ones under jsdom; compare on Latin. */
const toLatinDigits = (text) =>
  text.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
      .replace(/[\u200e\u200f]/g, "");

const cellWithNumber = (value) =>
  screen.getByText((_, node) => node?.tagName === "SPAN" && toLatinDigits(node.textContent) === value);

/** MUI's pointer-events probe crashes nwsapi under jsdom, so drive inputs directly. */
const typeInto = (input, value) => fireEvent.change(input, { target: { value } });

describe("StockCountSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  it("hides the system quantity while a blind count is still open", async () => {
    inventoryApi.getCount.mockResolvedValue({ data: count() });

    renderSheet();

    await waitFor(() => expect(screen.getByText("INV-2026-00001")).toBeInTheDocument());
    expect(headers()).toEqual(["الصنف", "الوحدة", "الكمية المعدودة"]);
    expect(screen.getByText("عدّ أعمى")).toBeInTheDocument();
  });

  it("reveals the variance columns once the count reaches review", async () => {
    inventoryApi.getCount.mockResolvedValue({
      data: count({
        status: "review",
        countedItems: 1,
        varianceItems: 1,
        netVarianceQty: -8,
        netVarianceValue: -794.67,
        items: [item({ systemQty: 360, countedQty: 352, finalQty: 352, difference: -8, differenceValue: -794.67, counted: true })],
      }),
    });

    renderSheet();

    await waitFor(() => expect(screen.getByText("قيد المراجعة")).toBeInTheDocument());
    expect(headers()).toEqual(["الصنف", "الوحدة", "الكمية الدفترية", "إعادة العدّ", "الفرق", "قيمة الفرق"]);
    expect(cellWithNumber("-8")).toBeInTheDocument();
  });

  it("tells the counter that a blank cell is not a zero", async () => {
    inventoryApi.getCount.mockResolvedValue({ data: count({ totalItems: 10, countedItems: 3 }) });

    renderSheet();

    await waitFor(() =>
      expect(screen.getByText(/بقي 7 صنفاً بلا عدّ/)).toBeInTheDocument());
  });

  it("sends only the lines that were typed into", async () => {
    inventoryApi.getCount.mockResolvedValue({
      data: count({ totalItems: 2, items: [item(), item({ id: 2, productSku: "ART-008" })] }),
    });
    inventoryApi.saveCountEntries.mockResolvedValue({ data: count() });

    renderSheet();
    await waitFor(() => expect(screen.getByText("INV-2026-00001")).toBeInTheDocument());

    typeInto(screen.getAllByPlaceholderText("العدد")[0], "352");
    fireEvent.click(screen.getByRole("button", { name: /حفظ العدّ/ }));

    await waitFor(() => expect(inventoryApi.saveCountEntries).toHaveBeenCalled());
    expect(inventoryApi.saveCountEntries).toHaveBeenCalledWith(5, [{ itemId: 1, countedQty: 352 }]);
  });

  it("saves pending entries before closing, so typed numbers are not lost", async () => {
    inventoryApi.getCount.mockResolvedValue({ data: count() });
    inventoryApi.saveCountEntries.mockResolvedValue({ data: count() });
    inventoryApi.closeCount.mockResolvedValue({ data: count({ status: "review" }) });

    renderSheet();
    await waitFor(() => expect(screen.getByText("INV-2026-00001")).toBeInTheDocument());

    typeInto(screen.getByPlaceholderText("العدد"), "0");
    fireEvent.click(screen.getByRole("button", { name: "إقفال للمراجعة" }));

    await waitFor(() => expect(inventoryApi.closeCount).toHaveBeenCalledWith(5));
    expect(inventoryApi.saveCountEntries).toHaveBeenCalledWith(5, [{ itemId: 1, countedQty: 0 }]);
  });

  it("warns when a variance cannot be valued", async () => {
    inventoryApi.getCount.mockResolvedValue({
      data: count({ status: "review", varianceItems: 1, itemsWithoutCost: 1,
        items: [item({ systemQty: 40, finalQty: 10, difference: -30, unitCost: null, counted: true })] }),
    });

    renderSheet();

    await waitFor(() =>
      expect(screen.getByText(/لن تدخل قيمته في القيد المحاسبي/)).toBeInTheDocument());
    expect(screen.getByText("بلا تكلفة")).toBeInTheDocument();
  });

  it("shows the journal number once the count is approved", async () => {
    inventoryApi.getCount.mockResolvedValue({
      data: count({ status: "approved", journalNumber: "INV-2026-00003", countedItems: 1 }),
    });

    renderSheet();

    await waitFor(() =>
      expect(screen.getByText(/القيد المحاسبي: INV-2026-00003/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: /حفظ العدّ/ })).not.toBeInTheDocument();
  });

  it("says plainly when an approved count needed no entry", async () => {
    inventoryApi.getCount.mockResolvedValue({
      data: count({ status: "approved", journalNumber: null, countedItems: 1 }),
    });

    renderSheet();

    await waitFor(() =>
      expect(screen.getByText(/لا فروق بقيمة تستوجب قيداً/)).toBeInTheDocument());
  });
});
