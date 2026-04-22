import { linkedSuppliers, mockActivePartnerships } from "./partnershipMock";

export const supplierMatchLabels = {
  partnerUuid: "معرف الشريك",
  taxNumber: "الرقم الضريبي",
  commercialRegister: "السجل التجاري",
  email: "البريد الإلكتروني",
  phone: "رقم الهاتف",
  manual: "ربط يدوي من بطاقة المورد",
};

export const mockSuppliers = [
  {
    id: "SUP-001",
    name: "مصنع الصلب الجزائري",
    legalName: "مصنع الصلب الجزائري ش.ذ.أ",
    phone: "0550-110-220",
    email: "sales@steel-dz.dz",
    taxNumber: "NIF-160120240011",
    commercialRegister: "RC-16B-440128",
    nisNumber: "NIS-1600044028",
    wilaya: "الجزائر",
    address: "الجزائر العاصمة، المنطقة الصناعية",
    category: "مواد أولية",
    status: "active",
    paymentTerms: "آجل 30 يوم",
    totalPurchases: 5650000,
    paidAmount: 3200000,
    openingBalance: 0,
    lastPurchase: "2024-01-22",
    partnerUuid: null,
    manualPartnerUuid: null,
    orders: ["PUR-2024-001", "PUR-2024-005"],
    payments: [
      { id: "SP-001", date: "2024-01-12", amount: 1800000, type: "bank", direction: "out", receiver: "مصنع الصلب الجزائري", payer: "الإدارة" },
      { id: "SP-002", date: "2024-01-18", amount: 1400000, type: "cash", direction: "out", receiver: "مصنع الصلب الجزائري", payer: "الصندوق" },
    ],
  },
  {
    id: "SUP-002",
    name: "شركة المعدن والأدوات",
    legalName: "شركة المعدن والأدوات للتجارة",
    phone: "0551-880-330",
    email: "contact@metal-tools.dz",
    taxNumber: "NIF-190120240076",
    commercialRegister: "RC-19A-330781",
    nisNumber: "NIS-1900033078",
    wilaya: "سطيف",
    address: "سطيف، المنطقة التجارية",
    category: "أدوات",
    status: "active",
    paymentTerms: "تسبيق ثم تسوية",
    totalPurchases: 850000,
    paidAmount: 300000,
    openingBalance: 0,
    lastPurchase: "2024-01-20",
    partnerUuid: null,
    manualPartnerUuid: null,
    orders: ["PUR-2024-002"],
    payments: [
      { id: "SP-010", date: "2024-01-20", amount: 300000, type: "cash", direction: "out", receiver: "شركة المعدن والأدوات", payer: "أحمد محمد" },
    ],
  },
  {
    id: "SUP-003",
    name: "موردون الكهرباء الوطنية",
    legalName: "موردون الكهرباء الوطنية",
    phone: "0552-120-440",
    email: "orders@electric-national.dz",
    taxNumber: "NIF-090120240045",
    commercialRegister: "RC-09B-120440",
    nisNumber: "NIS-0900012044",
    wilaya: "البليدة",
    address: "البليدة، طريق الصناعة",
    category: "كهرباء",
    status: "active",
    paymentTerms: "نقدي",
    totalPurchases: 1120000,
    paidAmount: 1120000,
    openingBalance: 0,
    lastPurchase: "2024-01-18",
    partnerUuid: null,
    manualPartnerUuid: null,
    orders: ["PUR-2024-003"],
    payments: [
      { id: "SP-020", date: "2024-01-18", amount: 1120000, type: "bank", direction: "out", receiver: "موردون الكهرباء الوطنية", payer: "الحساب البنكي" },
    ],
  },
  {
    id: "SUP-004",
    name: "شركة السباكة والري",
    legalName: "شركة السباكة والري وهران",
    phone: "0553-620-715",
    email: "billing@plumbing-irrigation.dz",
    taxNumber: "NIF-310120240063",
    commercialRegister: "RC-31B-620715",
    nisNumber: "NIS-3100062071",
    wilaya: "وهران",
    address: "وهران، حي الأعمال",
    category: "سباكة",
    status: "active",
    paymentTerms: "آجل 15 يوم",
    totalPurchases: 340000,
    paidAmount: 0,
    openingBalance: 0,
    lastPurchase: "2024-01-15",
    partnerUuid: null,
    manualPartnerUuid: null,
    orders: ["PUR-2024-004"],
    payments: [],
  },
  {
    id: "SUP-005",
    name: "مستلزمات الدهانات الفاخرة",
    legalName: "مستلزمات الدهانات الفاخرة",
    phone: "0554-740-210",
    email: "sales@premium-paints.dz",
    taxNumber: "NIF-250120240021",
    commercialRegister: "RC-25A-740210",
    nisNumber: "NIS-2500074021",
    wilaya: "قسنطينة",
    address: "قسنطينة، طريق الخروب",
    category: "دهانات",
    status: "active",
    paymentTerms: "نقدي",
    totalPurchases: 560000,
    paidAmount: 560000,
    openingBalance: 0,
    lastPurchase: "2024-01-08",
    partnerUuid: null,
    manualPartnerUuid: null,
    orders: ["PUR-2024-006"],
    payments: [
      { id: "SP-030", date: "2024-01-08", amount: 560000, type: "cash", direction: "out", receiver: "مستلزمات الدهانات الفاخرة", payer: "الصندوق" },
    ],
  },
  {
    id: "SUP-006",
    name: "شركة البيان للإلكترونيات",
    legalName: "شركة البيان للإلكترونيات",
    phone: "0556-420-110",
    email: "contact@albayan.dz",
    taxNumber: "NIF-160120260001",
    commercialRegister: "RC-23A-458921",
    nisNumber: "NIS-2300045892",
    wilaya: "عنابة",
    address: "عنابة، المنطقة التقنية",
    category: "شريك مرتبط",
    status: "active",
    paymentTerms: "حسب اتفاق الربط",
    totalPurchases: 0,
    paidAmount: 0,
    openingBalance: 0,
    lastPurchase: "—",
    partnerUuid: "c7d8e9f0-a1b2-c3d4-e5f6-789012345678",
    manualPartnerUuid: null,
    orders: [],
    payments: [],
  },
  {
    id: "SUP-007",
    name: "مؤسسة الخير للتجارة",
    legalName: "مؤسسة الخير للتجارة",
    phone: "0558-230-900",
    email: "owner@alkhayr.dz",
    taxNumber: "NIF-310120260077",
    commercialRegister: "RC-31A-221908",
    nisNumber: "NIS-3100022190",
    wilaya: "وهران",
    address: "وهران، المنطقة الغربية",
    category: "شريك مرتبط",
    status: "active",
    paymentTerms: "عرض مخزون فقط",
    totalPurchases: 0,
    paidAmount: 0,
    openingBalance: 0,
    lastPurchase: "—",
    partnerUuid: null,
    manualPartnerUuid: "d4e5f6a7-b8c9-0123-def0-123456789abc",
    orders: [],
    payments: [],
  },
];

export function normalizeIdentity(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-_.]/g, "");
}

export function getSupplierBalance(supplier) {
  if (!supplier) return 0;
  return Math.max(0, (supplier.totalPurchases || 0) - (supplier.paidAmount || 0) + (supplier.openingBalance || 0));
}

export function findSupplierByName(name) {
  const normalized = normalizeIdentity(name);
  return mockSuppliers.find((supplier) => normalizeIdentity(supplier.name) === normalized) || null;
}

export function getSupplierName(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.name || "";
}

export function findSupplierIdentityMatch(identity = {}) {
  const candidates = [
    ["taxNumber", identity.partnerTaxNumber || identity.taxNumber],
    ["commercialRegister", identity.partnerCommercialRegister || identity.commercialRegister],
    ["email", identity.partnerEmail || identity.email],
    ["phone", identity.partnerPhone || identity.phone],
  ];

  for (const [matchedBy, value] of candidates) {
    const normalizedValue = normalizeIdentity(value);
    if (!normalizedValue) continue;

    const matches = mockSuppliers.filter((supplier) => normalizeIdentity(supplier[matchedBy]) === normalizedValue);
    if (matches.length === 1) {
      return { supplier: matches[0], matchedBy, value, duplicateCount: 1, ambiguous: false };
    }
    if (matches.length > 1) {
      return { supplier: matches[0], matchedBy, value, duplicateCount: matches.length, ambiguous: true };
    }
  }

  return null;
}

function getPartnerByUuid(uuid) {
  return mockActivePartnerships.find((partner) => partner.partnerUuid === uuid && partner.status === "active") || null;
}

function getLinkedPartnerRecord(partner) {
  const linked = linkedSuppliers.find((item) => item.uuid === partner?.partnerUuid);
  if (!partner || !linked) return null;

  return {
    uuid: partner.partnerUuid,
    name: partner.partnerName,
    email: partner.partnerEmail,
    phone: partner.partnerPhone,
    taxNumber: partner.partnerTaxNumber,
    commercialRegister: partner.partnerCommercialRegister,
    wilaya: partner.partnerWilaya,
    permissions: linked.permissions,
  };
}

export function resolveSupplierLink(value) {
  const supplier = typeof value === "string" ? findSupplierByName(value) : value;

  if (!supplier) {
    return { isLinked: false, supplier: null, partner: null, matchedBy: null, permissions: {} };
  }

  const directUuid = supplier.partnerUuid || supplier.manualPartnerUuid;
  if (directUuid) {
    const partner = getLinkedPartnerRecord(getPartnerByUuid(directUuid));
    if (partner) {
      return {
        isLinked: true,
        supplier,
        partner,
        matchedBy: supplier.partnerUuid ? "partnerUuid" : "manual",
        permissions: partner.permissions,
      };
    }
  }

  const candidates = [
    ["taxNumber", supplier.taxNumber, "partnerTaxNumber"],
    ["commercialRegister", supplier.commercialRegister, "partnerCommercialRegister"],
    ["email", supplier.email, "partnerEmail"],
    ["phone", supplier.phone, "partnerPhone"],
  ];

  for (const [matchedBy, supplierValue, partnerField] of candidates) {
    const normalizedSupplierValue = normalizeIdentity(supplierValue);
    if (!normalizedSupplierValue) continue;

    const match = mockActivePartnerships.find((partner) => (
      partner.status === "active" &&
      linkedSuppliers.some((linked) => linked.uuid === partner.partnerUuid) &&
      normalizeIdentity(partner[partnerField]) === normalizedSupplierValue
    ));

    const partner = getLinkedPartnerRecord(match);
    if (partner) {
      return {
        isLinked: true,
        supplier,
        partner,
        matchedBy,
        permissions: partner.permissions,
      };
    }
  }

  return { isLinked: false, supplier, partner: null, matchedBy: null, permissions: {} };
}

export function getSupplierOptions() {
  const supplierUuids = new Set(mockSuppliers.flatMap((supplier) => [supplier.partnerUuid, supplier.manualPartnerUuid].filter(Boolean)));
  const partnerOnlySuppliers = linkedSuppliers
    .filter((partner) => !supplierUuids.has(partner.uuid) && !mockSuppliers.some((supplier) => normalizeIdentity(supplier.email) === normalizeIdentity(partner.email)))
    .map((partner) => ({
      id: `LINK-${partner.uuid}`,
      name: partner.name,
      legalName: partner.name,
      phone: "",
      email: "",
      taxNumber: "",
      commercialRegister: "",
      nisNumber: "",
      wilaya: "",
      address: "",
      category: "شريك مرتبط",
      status: "active",
      paymentTerms: "حسب اتفاق الربط",
      totalPurchases: 0,
      paidAmount: 0,
      openingBalance: 0,
      lastPurchase: "—",
      partnerUuid: partner.uuid,
      manualPartnerUuid: null,
      orders: [],
      payments: [],
    }));

  return [...mockSuppliers, ...partnerOnlySuppliers];
}
