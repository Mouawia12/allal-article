export function getApiFieldErrors(error) {
  const fieldErrors = error?.response?.data?.errors;
  if (!Array.isArray(fieldErrors)) return {};

  return fieldErrors.reduce((acc, item) => {
    if (!item?.field) return acc;
    const field = String(item.field);
    acc[field] = item.message || "قيمة غير صحيحة";

    const simpleField = field.split(".").pop();
    if (simpleField && !acc[simpleField]) {
      acc[simpleField] = acc[field];
    }

    return acc;
  }, {});
}

export function getApiErrorMessage(error, fallback = "حدث خطأ أثناء الحفظ") {
  if (!error?.response) return "تعذر الاتصال بالخادم";

  const data = error.response.data;
  if (data?.message && data.message !== "Validation failed") return data.message;
  if (Array.isArray(data?.errors) && data.errors.length > 0) return "يرجى تصحيح الأخطاء الموضحة في الحقول";

  return fallback;
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
