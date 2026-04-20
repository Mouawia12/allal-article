/* eslint-disable */
// ─── Company Profile Mock (per tenant) ────────────────────────────────────────

export const mockCompanyProfile = {
  nameAr: "شركة التوزيع الشمالي",
  nameFr: "Société de Distribution du Nord",
  legalForm: "SARL",          // SARL | EURL | SPA | SNC | auto_entrepreneur
  tradeRegisterNumber: "16/00-0123456B19",   // RC
  taxId: "001234567890123",                  // NIF — 15 digits
  statisticalId: "160100123456789",          // NIS
  articleImposition: "16123456",
  address: "Lot 12, Zone Industrielle, Rouiba",
  wilaya: "الجزائر",
  postalCode: "16012",
  phone: "023-12-34-56",
  mobile: "0555-123-456",
  fax: "023-12-34-57",
  email: "contact@north-dist.dz",
  website: "www.north-dist.dz",
  bankName: "BNA",
  bankBranch: "Agence Rouiba",
  rib: "002 00015 0000012345678 50",         // Relevé d'Identité Bancaire
  capitalSocial: 1000000,
  logoUrl: null,
  stampImageUrl: null,
  signatureImageUrl: null,
  invoiceFooterAr: "شكراً لتعاملكم معنا — يُرجى الدفع خلال 30 يوماً",
  invoiceFooterFr: "Merci de votre confiance — Paiement sous 30 jours",
};

export const LEGAL_FORMS = [
  { value: "SARL",              label: "شركة ذات مسؤولية محدودة (SARL)" },
  { value: "EURL",              label: "مؤسسة ذات شخص وحيد (EURL)" },
  { value: "SPA",               label: "شركة مساهمة (SPA)" },
  { value: "SNC",               label: "شركة اسم جماعي (SNC)" },
  { value: "auto_entrepreneur", label: "مستثمر ذاتي (Auto-entrepreneur)" },
  { value: "other",             label: "أخرى" },
];

export const ALGERIAN_BANKS = [
  "BNA — البنك الوطني الجزائري",
  "CPA — القرض الشعبي الجزائري",
  "BEA — بنك الجزائر الخارجي",
  "BADR — بنك الفلاحة والتنمية الريفية",
  "BDL — بنك التنمية المحلية",
  "CNEP — الصندوق الوطني للتوفير والاحتياط",
  "CNMA — الصندوق الوطني للتعاون الفلاحي",
  "AGB — بنك الخليج الجزائر",
  "SGA — سوسيتيه جنرال الجزائر",
  "BNP Paribas El Djazaïr",
  "Natixis Algérie",
  "Gulf Bank Algeria",
  "Housing Bank Algeria",
  "أخرى",
];
