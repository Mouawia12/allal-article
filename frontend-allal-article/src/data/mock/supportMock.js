/* eslint-disable */

export const ticketStatusConfig = {
  open: { label: "مفتوحة", color: "#17c1e8", bg: "#e3f8fd" },
  waiting_owner: { label: "بانتظار المالك", color: "#fb8c00", bg: "#fff3e0" },
  waiting_tenant: { label: "بانتظار المشترك", color: "#7928ca", bg: "#f5ecff" },
  resolved: { label: "محلولة", color: "#82d616", bg: "#f0fde4" },
  closed: { label: "مغلقة", color: "#8392ab", bg: "#f8f9fa" },
};

export const ticketPriorityConfig = {
  low: { label: "منخفضة", color: "#8392ab" },
  normal: { label: "عادية", color: "#17c1e8" },
  high: { label: "عالية", color: "#fb8c00" },
  urgent: { label: "عاجلة", color: "#ea0606" },
};

export const supportTickets = [
  {
    id: "TCK-2026-001",
    tenantName: "شركة التوزيع الشمالي",
    subject: "مشكلة في تأكيد طلبية مرتبطة",
    category: "الطلبيات",
    priority: "high",
    status: "waiting_owner",
    openedBy: "أحمد بن سالم",
    assignedTo: "فريق الدعم",
    createdAt: "اليوم 10:24",
    lastMessageAt: "منذ 8 دقائق",
    unreadOwner: 2,
    unreadTenant: 0,
  },
  {
    id: "TCK-2026-002",
    tenantName: "مؤسسة البركة للمواد الغذائية",
    subject: "أريد رفع حد المستخدمين في الخطة",
    category: "الاشتراك",
    priority: "normal",
    status: "waiting_tenant",
    openedBy: "سميرة",
    assignedTo: "مالك المنصة",
    createdAt: "أمس 16:12",
    lastMessageAt: "أمس 17:02",
    unreadOwner: 0,
    unreadTenant: 1,
  },
  {
    id: "TCK-2026-003",
    tenantName: "شركة الساحل للتوزيع",
    subject: "صورة خطأ عند طباعة فاتورة طريق",
    category: "الطباعة",
    priority: "low",
    status: "open",
    openedBy: "يوسف",
    assignedTo: "فريق الدعم",
    createdAt: "2026-04-20 09:15",
    lastMessageAt: "2026-04-20 09:20",
    unreadOwner: 0,
    unreadTenant: 0,
  },
];

export const supportMessages = {
  "TCK-2026-001": [
    {
      id: "msg-001",
      senderType: "tenant",
      senderName: "أحمد بن سالم",
      body: "عند تأكيد طلبية مرتبطة تظهر عند المورد لكن لا تتغير الحالة عندنا.",
      createdAt: "10:24",
      attachments: [],
    },
    {
      id: "msg-002",
      senderType: "tenant",
      senderName: "أحمد بن سالم",
      body: "أرفقت صورة الشاشة، المشكلة تظهر بعد زر التأكيد مباشرة.",
      createdAt: "10:27",
      attachments: [
        { id: "att-001", type: "image", name: "order-sync-error.png", size: "420 KB", preview: "#e3f8fd" },
      ],
    },
    {
      id: "msg-003",
      senderType: "owner",
      senderName: "فريق الدعم",
      body: "وصلت الصورة. نحتاج رقم الطلبية المرتبطة ومعرف الشريك من صفحة التفاصيل.",
      createdAt: "10:31",
      attachments: [],
    },
    {
      id: "msg-004",
      senderType: "tenant",
      senderName: "أحمد بن سالم",
      body: "هذا تسجيل صوتي يشرح الخطوات التي عملتها.",
      createdAt: "10:36",
      attachments: [
        { id: "att-002", type: "audio", name: "voice-note.m4a", size: "00:42" },
      ],
    },
  ],
  "TCK-2026-002": [
    {
      id: "msg-010",
      senderType: "tenant",
      senderName: "سميرة",
      body: "نحتاج إضافة 3 مستخدمين للخطة الحالية.",
      createdAt: "أمس 16:12",
      attachments: [],
    },
    {
      id: "msg-011",
      senderType: "owner",
      senderName: "مالك المنصة",
      body: "يمكن رفع الحد مؤقتاً، أرسلت لك تفاصيل الترقية.",
      createdAt: "أمس 17:02",
      attachments: [],
    },
  ],
  "TCK-2026-003": [
    {
      id: "msg-020",
      senderType: "tenant",
      senderName: "يوسف",
      body: "الطباعة تعمل لكن النص يخرج خارج الجدول في فاتورة الطريق.",
      createdAt: "09:15",
      attachments: [
        { id: "att-020", type: "image", name: "road-invoice-print.jpg", size: "780 KB", preview: "#fff3e0" },
      ],
    },
  ],
};

export function getTicketStats(tickets = supportTickets) {
  return {
    open: tickets.filter((ticket) => !["resolved", "closed"].includes(ticket.status)).length,
    urgent: tickets.filter((ticket) => ticket.priority === "urgent" || ticket.priority === "high").length,
    unreadOwner: tickets.reduce((sum, ticket) => sum + (ticket.unreadOwner || 0), 0),
    unreadTenant: tickets.reduce((sum, ticket) => sum + (ticket.unreadTenant || 0), 0),
  };
}
