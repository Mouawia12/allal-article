import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";

import theme from "assets/theme";
import { SoftUIControllerProvider } from "context";
import { I18nProvider } from "i18n";
import OwnerSupport from "layouts/owner/support";
import SupportCenter from "layouts/support";
import { SUPPORT_STORAGE_KEY } from "services";

jest.mock("examples/LayoutContainers/DashboardLayout", () => ({ children }) => (
  <div data-testid="dashboard-layout">{children}</div>
));
jest.mock("examples/Navbars/DashboardNavbar", () => () => <div data-testid="dashboard-navbar" />);
jest.mock("examples/Footer", () => () => <div data-testid="footer" />);
jest.mock("examples/LayoutContainers/OwnerLayout", () => ({ children }) => (
  <div data-testid="owner-layout">{children}</div>
));
jest.mock("@mui/material/Tooltip", () => ({ children }) => children);
jest.mock("@mui/material/TextField", () => {
  const React = require("react");

  return function MockTextField({
    disabled,
    label,
    multiline,
    onChange,
    onKeyDown,
    placeholder,
    value,
  }) {
    const inputProps = {
      "aria-label": label || placeholder,
      disabled,
      onChange,
      onKeyDown,
      placeholder,
      value: value ?? "",
    };
    const field = multiline
      ? React.createElement("textarea", inputProps)
      : React.createElement("input", inputProps);

    return label ? React.createElement("label", null, label, field) : field;
  };
});

function renderWithProviders(ui) {
  return render(
    <MemoryRouter>
      <SoftUIControllerProvider>
        <I18nProvider>
          <ThemeProvider theme={theme}>{ui}</ThemeProvider>
        </I18nProvider>
      </SoftUIControllerProvider>
    </MemoryRouter>
  );
}

function expectAtLeastOneText(text) {
  expect(screen.getAllByText((content) => content.includes(text)).length).toBeGreaterThan(0);
}

function expectAtLeastOneTextMatching(pattern) {
  expect(screen.getAllByText((content) => pattern.test(content)).length).toBeGreaterThan(0);
}

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.localStorage.removeItem(SUPPORT_STORAGE_KEY);

  const audioTrack = { stop: jest.fn() };
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [audioTrack],
      }),
    },
  });

  class MockMediaRecorder {
    constructor(stream) {
      this.stream = stream;
      this.state = "inactive";
      this.mimeType = "audio/webm";
    }

    start() {
      this.state = "recording";
    }

    stop() {
      this.state = "inactive";
      this.ondataavailable?.({
        data: new Blob(["audio-data"], { type: "audio/webm" }),
      });
      this.onstop?.();
    }
  }

  window.MediaRecorder = MockMediaRecorder;
  global.MediaRecorder = MockMediaRecorder;
});

test("tenant support opens a new ticket with image and audio attachments", async () => {
  const user = userEvent.setup();
  renderWithProviders(<SupportCenter />);

  await user.click(screen.getByRole("button", { name: /تذكرة جديدة/ }));
  await user.type(await screen.findByLabelText("عنوان المشكلة"), "تجربة فتح تذكرة آلية");
  await user.type(screen.getByLabelText("تفاصيل المشكلة"), "رسالة افتتاحية لاختبار الدعم");
  await user.upload(
    screen.getByLabelText("اختيار صورة للتذكرة"),
    new File(["ticket-image"], "ticket-real.png", { type: "image/png" })
  );
  await user.click(screen.getByLabelText("بدء تسجيل صوت للتذكرة"));
  await user.click(await screen.findByLabelText("إيقاف تسجيل صوت للتذكرة وإرساله"));
  await user.click(screen.getByText("فتح التذكرة").closest("button"));

  expectAtLeastOneText("تجربة فتح تذكرة آلية");
  expect(screen.getByText("رسالة افتتاحية لاختبار الدعم")).toBeInTheDocument();
  expect(screen.getByText("ticket-real.png")).toBeInTheDocument();
  expect(screen.getByAltText("ticket-real.png")).toBeInTheDocument();
  expectAtLeastOneTextMatching(/ticket-voice-\d+\.webm/);
  expect(await screen.findByLabelText(/تشغيل ticket-voice-\d+\.webm/)).toBeInTheDocument();
  expectAtLeastOneText("TCK-2026-004");
});

test("tenant support receives existing replies and sends text image and audio messages", async () => {
  const user = userEvent.setup();
  renderWithProviders(<SupportCenter />);

  expect(screen.getByText("وصلت الصورة. نحتاج رقم الطلبية المرتبطة ومعرف الشريك من صفحة التفاصيل.")).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText("اكتب رسالتك هنا..."), "رسالة عادية من المشترك");
  await user.click(screen.getByRole("button", { name: "إرسال رسالة من المشترك" }));
  expect(screen.getByText("رسالة عادية من المشترك")).toBeInTheDocument();

  await user.upload(
    screen.getByLabelText("اختيار صورة من جهاز المشترك"),
    new File(["tenant-image"], "tenant-real.png", { type: "image/png" })
  );
  expect(await screen.findByText("tenant-real.png")).toBeInTheDocument();
  expect(screen.getByAltText("tenant-real.png")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "بدء تسجيل صوت من المشترك" }));
  await user.click(await screen.findByRole("button", { name: "إيقاف تسجيل صوت من المشترك وإرساله" }));
  await screen.findByText((content) => /tenant-voice-\d+\.webm/.test(content));
  expect(await screen.findByLabelText(/تشغيل tenant-voice-\d+\.webm/)).toBeInTheDocument();
});

test("tenant support persists a message after remount", async () => {
  const user = userEvent.setup();
  const view = renderWithProviders(<SupportCenter />);

  await user.type(screen.getByPlaceholderText("اكتب رسالتك هنا..."), "رسالة محفوظة بعد التحديث");
  await user.click(screen.getByRole("button", { name: "إرسال رسالة من المشترك" }));
  expect(screen.getByText("رسالة محفوظة بعد التحديث")).toBeInTheDocument();

  view.unmount();
  renderWithProviders(<SupportCenter />);

  expect(screen.getByText("رسالة محفوظة بعد التحديث")).toBeInTheDocument();
});

test("tenant support message reaches owner support queue", async () => {
  const user = userEvent.setup();
  const view = renderWithProviders(<SupportCenter />);

  await user.type(screen.getByPlaceholderText("اكتب رسالتك هنا..."), "رسالة يجب أن تصل للمالك");
  await user.click(screen.getByRole("button", { name: "إرسال رسالة من المشترك" }));
  view.unmount();

  renderWithProviders(<OwnerSupport />);

  expect(screen.getByText("رسالة يجب أن تصل للمالك")).toBeInTheDocument();
});

test("owner support receives tenant image and audio then sends text image and audio replies", async () => {
  const user = userEvent.setup();
  renderWithProviders(<OwnerSupport />);

  expect(screen.getByText("عند تأكيد طلبية مرتبطة تظهر عند المورد لكن لا تتغير الحالة عندنا.")).toBeInTheDocument();
  expect(screen.getByText("order-sync-error.png")).toBeInTheDocument();
  expect(screen.getByText("voice-note.m4a")).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText("اكتب رداً على المشترك..."), "رد عادي من الدعم");
  await user.click(screen.getByRole("button", { name: "إرسال رسالة من الدعم" }));
  expect(screen.getByText("رد عادي من الدعم")).toBeInTheDocument();

  await user.upload(
    screen.getByLabelText("اختيار صورة من جهاز الدعم"),
    new File(["owner-image"], "owner-real.png", { type: "image/png" })
  );
  expect(await screen.findByText("owner-real.png")).toBeInTheDocument();
  expect(screen.getByAltText("owner-real.png")).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "بدء تسجيل صوت من الدعم" }));
  await user.click(await screen.findByRole("button", { name: "إيقاف تسجيل صوت من الدعم وإرساله" }));
  await screen.findByText((content) => /owner-voice-\d+\.webm/.test(content));
  expect(await screen.findByLabelText(/تشغيل owner-voice-\d+\.webm/)).toBeInTheDocument();
});
