import { translateText } from "i18n";

function getCurrentLocale() {
  try {
    return window.localStorage.getItem("allal-article-locale") || "ar";
  } catch {
    return "ar";
  }
}

function t(key) {
  return translateText(key, getCurrentLocale());
}

export function getApiFieldErrors(error) {
  const fieldErrors = error?.response?.data?.errors;
  if (!Array.isArray(fieldErrors)) return {};

  return fieldErrors.reduce((acc, item) => {
    if (!item?.field) return acc;
    const field = String(item.field);
    acc[field] = item.message ? t(item.message) : t("قيمة غير صحيحة");

    const simpleField = field.split(".").pop();
    if (simpleField && !acc[simpleField]) {
      acc[simpleField] = acc[field];
    }

    return acc;
  }, {});
}

export function getApiErrorMessage(error, fallback = "حدث خطأ أثناء الحفظ") {
  if (!error?.response) return t("تعذر الاتصال بالخادم");

  const data = error.response.data;
  if (data?.message && data.message !== "Validation failed") return t(data.message);
  if (Array.isArray(data?.errors) && data.errors.length > 0) return t("يرجى تصحيح الأخطاء الموضحة في الحقول");

  return t(fallback);
}

export function applyApiErrors(error, setErrors, fallback = "حدث خطأ أثناء الحفظ") {
  setErrors((current = {}) => ({
    ...current,
    ...getApiFieldErrors(error),
    _global: getApiErrorMessage(error, fallback),
  }));
}

export function hasErrors(errors) {
  return Object.values(errors || {}).some(Boolean);
}

export function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === "";
}

export function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}
