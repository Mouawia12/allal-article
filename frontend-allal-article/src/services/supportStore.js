import { supportMessages, supportTickets } from "data/mock/supportMock";

export const SUPPORT_STORAGE_KEY = "allal.supportCenter.state.v1";
const SUPPORT_STORE_EVENT = "allal:support-store-changed";

function cloneTickets() {
  return supportTickets.map((ticket) => ({ ...ticket }));
}

function cloneMessages() {
  return Object.fromEntries(
    Object.entries(supportMessages).map(([ticketId, messages]) => [
      ticketId,
      messages.map((message) => ({
        ...message,
        attachments: (message.attachments || []).map((attachment) => ({ ...attachment })),
      })),
    ])
  );
}

function defaultState() {
  return {
    tickets: cloneTickets(),
    messagesByTicket: cloneMessages(),
  };
}

function normalizeState(value) {
  if (!value || !Array.isArray(value.tickets) || typeof value.messagesByTicket !== "object") {
    return defaultState();
  }

  return {
    tickets: value.tickets.map((ticket) => ({ ...ticket })),
    messagesByTicket: Object.fromEntries(
      Object.entries(value.messagesByTicket).map(([ticketId, messages]) => [
        ticketId,
        Array.isArray(messages)
          ? messages.map((message) => ({
              ...message,
              attachments: (message.attachments || []).map((attachment) => ({ ...attachment })),
            }))
          : [],
      ])
    ),
  };
}

export function readSupportState() {
  if (typeof window === "undefined") {
    return defaultState();
  }

  try {
    const raw = window.localStorage.getItem(SUPPORT_STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function writeSupportState(nextState) {
  const normalized = normalizeState(nextState);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      throw new Error("تعذر حفظ مرفقات الدعم. قلل حجم الملف أو التسجيل ثم حاول مرة أخرى");
    }
    window.dispatchEvent(new CustomEvent(SUPPORT_STORE_EVENT, { detail: normalized }));
  }

  return normalized;
}

export function updateSupportState(updater) {
  const current = readSupportState();
  const next = typeof updater === "function" ? updater(current) : updater;
  return writeSupportState(next);
}

export function subscribeSupportState(listener) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const notify = (state) => listener(normalizeState(state));
  const onLocalChange = (event) => notify(event.detail);
  const onStorage = (event) => {
    if (event.key !== SUPPORT_STORAGE_KEY) return;
    notify(event.newValue ? JSON.parse(event.newValue) : defaultState());
  };

  window.addEventListener(SUPPORT_STORE_EVENT, onLocalChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(SUPPORT_STORE_EVENT, onLocalChange);
    window.removeEventListener("storage", onStorage);
  };
}
