/* eslint-disable */

export const mockResourceLocks = [
  {
    publicId: "lock-sales-order-001",
    resourceType: "sales_order",
    resourceId: "ORD-2024-003",
    resourceLabel: "طلبية بيع",
    lockScope: "edit",
    lockedByName: "محمد سعيد",
    lockedByRole: "مسؤول المبيعات",
    deviceLabel: "Chrome / مكتب وهران",
    acquiredAt: "منذ 3 دقائق",
    heartbeatAt: "منذ 20 ثانية",
    expiresIn: "04:40",
    canTakeOver: true,
    blockedActions: ["تعديل", "تأكيد", "رفض", "تحويل إلى فاتورة طريق"],
    message: "محمد سعيد يحرر هذه الطلبية الآن. يمكنك العرض فقط إلى أن يخرج أو ينتهي القفل.",
  },
  {
    publicId: "lock-purchase-001",
    resourceType: "purchase_order",
    resourceId: "PUR-2024-001",
    resourceLabel: "أمر شراء",
    lockScope: "receive",
    lockedByName: "أمين المخزن",
    lockedByRole: "المخزون",
    deviceLabel: "Tablet / المخزن الرئيسي",
    acquiredAt: "منذ 7 دقائق",
    heartbeatAt: "منذ 35 ثانية",
    expiresIn: "02:25",
    canTakeOver: false,
    blockedActions: ["تعديل", "استلام", "إلغاء"],
    message: "أمين المخزن يسجل استلام هذا الأمر. التعديل غير متاح أثناء الاستلام.",
  },
  {
    publicId: "lock-journal-001",
    resourceType: "journal",
    resourceId: "JRN-2026-014",
    resourceLabel: "قيد يومية",
    lockScope: "post",
    lockedByName: "سمير بن علي",
    lockedByRole: "المحاسبة",
    deviceLabel: "Firefox / الإدارة",
    acquiredAt: "منذ 5 دقائق",
    heartbeatAt: "منذ 15 ثانية",
    expiresIn: "03:10",
    canTakeOver: false,
    blockedActions: ["تعديل", "ترحيل", "عكس"],
    message: "القيد مفتوح لدى المحاسب سمير. عمليات الترحيل متوقفة حتى تحرير القفل.",
  },
];

export function getMockResourceLock(resourceType, resourceId) {
  return mockResourceLocks.find(
    (lock) => lock.resourceType === resourceType && lock.resourceId === resourceId
  ) || null;
}
