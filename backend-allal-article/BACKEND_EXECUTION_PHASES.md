# Backend Execution Phases — ALLAL-ARTICLE

> آخر تحديث: 2026-04-27  
> المبدأ: مرحلة واحدة في كل مرة — بناء تدريجي محكم — لا انتقال إلا بعد Definition of Done

---

## الوضع الحالي للمشروع

| المرحلة | الحالة | التاريخ |
|---------|--------|---------|
| Phase 1 — Project Foundation | ✅ مكتملة | 2026-04-27 |
| Phase 2 — Database Foundation | ✅ مكتملة | 2026-04-27 |
| Phase 3 — Auth + Multi-tenant Context | ✅ مكتملة | 2026-04-27 |
| Phase 4 — Core Master Data APIs | ✅ مكتملة | 2026-04-27 |
| Phase 5 — Inventory Foundation | ✅ مكتملة | 2026-04-27 |
| Phase 6 — Orders Foundation | ✅ مكتملة | 2026-04-27 |
| Phase 7 — Purchases + Returns | ✅ مكتملة | 2026-04-27 |
| Phase 8 — Accounting Foundation | ✅ مكتملة | 2026-04-27 |
| Phase 9 — Documents + Road Invoices | ✅ مكتملة | 2026-04-27 |
| Phase 10 — Manufacturing | ✅ مكتملة | 2026-04-27 |
| Phase 11 — External Integrations | ✅ مكتملة | 2026-04-27 |
| **Frontend Integration Phases** | | |
| FE-1 — Auth Integration | ⏳ | بعد Phase 3 |
| FE-2 — Master Data Integration | ⏳ | بعد Phase 4 |
| FE-3 — Orders Integration | ⏳ | بعد Phase 6 |
| FE-4 — Inventory Integration | ⏳ | بعد Phase 5 |
| FE-5 — Accounting Integration | ⏳ | بعد Phase 8 |

---

## ما تم إنجازه

### ✅ Phase 1 — Project Foundation
**ما تم:**
- `BackendAllalArticleApplication.java` — entry point نظيف
- `common/exception/AppException.java` — runtime exception موحدة
- `common/exception/ErrorCode.java` — enum لأكواد الأخطاء
- `common/exception/GlobalExceptionHandler.java` — handler يعترض كل الأخطاء
- `common/response/ApiResponse<T>` — wrapper موحد للاستجابات الناجحة
- `common/response/ErrorResponse` — wrapper موحد لاستجابات الخطأ
- `config/SecurityConfig.java` — BCryptPasswordEncoder + security chain مؤقت
- Build نظيف بدون أخطاء

### ✅ Phase 2 — Database Foundation
**ما تم:**
- Platform migrations V1–V8 تعمل على PostgreSQL
- 32 جدول في `platform` schema
- Seed data: plans (trial/basic/professional/enterprise) + features + plan_features
- Tenant template scripts T01–T19 جاهزة (19 ملف SQL)
- `TenantSchemaService.java` — يُنشئ schema المشترك برمجياً
- `DataInitializer.java` — يزرع مالك المنصة عند أول تشغيل
- `flyway.schema_history` في `platform` مسجل وصحيح

---

## المراحل التفصيلية

---

### Phase 3 — Auth + Multi-tenant Context
**الهدف:** الدخول الآمن بـ JWT لمستخدمي المنصة ومستخدمي المشتركين، مع routing صحيح بين schemas.

**ما يدخل:**
- `JwtProperties` — config record (secret + expiration)
- `JwtService` — generate/validate JWT (JJWT 0.12.x)
- `TenantContext` — ThreadLocal للـ schema الحالي
- `JwtAuthFilter` — يفك JWT ويضبط SecurityContext + TenantContext
- `PlatformUserDetails` + `PlatformUserDetailsService` — JDBC من `platform.platform_users`
- `TenantUserDetails` + `TenantUserDetailsService` — JDBC من `<schema>.users`
- `AuthController`:
  - `POST /api/platform/auth/login` — لمستخدمي المنصة
  - `POST /api/auth/login` مع header `X-Tenant-ID` — لمستخدمي المشتركين
- تحديث `SecurityConfig` لحماية endpoints بـ JWT
- تحديث `ErrorCode` بـ UNAUTHORIZED + FORBIDDEN + CONFLICT

**ما لا يدخل (عمداً):**
- ❌ Refresh tokens
- ❌ Password reset / forgot password
- ❌ Email verification
- ❌ 2FA / device management
- ❌ JPA entities (لا تزال JDBC فقط)
- ❌ Registration endpoint (المشترك يُنشأ من platform admin)

**Dependencies المطلوبة:**
- Phase 1 ✅, Phase 2 ✅
- JJWT 0.12.x في pom.xml

**Acceptance Criteria:**
- `POST /api/platform/auth/login` يُرجع JWT صحيح لـ owner@allal.dz
- `POST /api/auth/login` مع X-Tenant-ID يُرجع JWT صحيح لمستخدم مشترك
- JWT منتهي الصلاحية يُرجع 401
- Request بلا token على محمي يُرجع 401
- Build ناجح، لا أخطاء compilation

**Definition of Done:**
- [ ] `./mvnw compile` ✓
- [ ] `./mvnw test` ✓ (أو لا test failures جديدة)
- [ ] Platform login endpoint يعمل يدوياً أو بـ test
- [ ] JWT decoded يحتوي على `sub`, `type`, `schema`, `roleCode`
- [ ] TenantContext cleared بعد كل request
- [ ] لا secrets hardcoded في الكود

**Frontend Integration:** بعد Phase 3 → FE-1 (auth integration)

---

### Phase 4 — Core Master Data APIs
**الهدف:** CRUD كامل لأساسيات النظام التشغيلية مع validation وpagination وsearch.

**ما يدخل:**
- JPA entities: `User`, `Role`, `Permission`, `Customer`, `Category`, `Product`, `ProductUnitsCatalog`, `Wilaya`
- Repositories (Spring Data JPA)
- Services + Controllers لكل entity
- Validation (`@Valid` + custom validators)
- Pagination, sorting, filtering (Pageable)
- `@PreAuthorize` على endpoints (باستخدام JWT claims)
- DTOs منفصلة عن entities

**ما لا يدخل:**
- ❌ Product variants complex logic
- ❌ Price lists complex engine
- ❌ Inventory mutations
- ❌ Media/file upload (metadata فقط إن احتاج)
- ❌ Price history trigger

**Dependencies:** Phase 3 ✅

**Acceptance Criteria:**
- CRUD للـ 7 entities يعمل
- Pagination يعمل على كل list endpoint
- Search بالاسم/الكود يعمل
- Role-based access صحيح (مثلاً `products.create` يحتاج permission)
- Build + tests ✓

**Frontend Integration:** بعد Phase 4 → FE-2 (master data integration)

---

### Phase 5 — Inventory Foundation
**الهدف:** نموذج المخزون القابل للقراءة والتعديل الآمن.

**ما يدخل:**
- JPA entities: `Warehouse`, `ProductStock`, `StockMovement`, `StockReservation`
- `InventoryService` — read model + adjustment logic
- `StockMovementService` — حركات مخزون مع audit
- `WarehouseController` + `InventoryController`
- Warehouse-level stock summary
- Initial stock entry (first-time setup per product)
- Inventory validation (لا نقل أكثر من available_qty)

**ما لا يدخل:**
- ❌ Stock transfers (Phase 5b أو 6 فأكثر)
- ❌ Manufacturing integration
- ❌ Reservation engine الكامل (يأتي مع Orders)

**Dependencies:** Phase 4 ✅

**Frontend Integration:** بعد Phase 5 → FE-4 (inventory integration)

---

### Phase 6 — Orders Foundation
**الهدف:** دورة حياة الطلبية الكاملة من draft إلى completed.

**ما يدخل:**
- JPA entities: `Order`, `OrderItem`, `OrderEvent`, `OrderItemEvent`
- State machine واضح (draft→submitted→confirmed→shipped→completed)
- `OrderService` — transitions + validation
- `OrderItemService` — line logic (approved/cancelled quantities)
- Auto-complete job (scheduled, shipped→completed بعد 3 أيام)
- Stock reservation عند التأكيد
- Stock release عند الإلغاء
- `OrderController` مع endpoints لكل transition

**ما لا يدخل:**
- ❌ Returns (Phase 7)
- ❌ Partner orders (inter-tenant)
- ❌ Price list engine كامل (fallback فقط)
- ❌ Road invoices

**Dependencies:** Phase 4 ✅, Phase 5 ✅

**Frontend Integration:** بعد Phase 6 → FE-3 (orders integration)

---

### Phase 7 — Purchases + Returns
**ما يدخل:**
- JPA entities: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseReturn`, `Return`, `ReturnItem`
- CRUD + status transitions لكل entity
- Stock impact عند الاستلام والمرتجع
- `SupplierController`, `PurchaseController`, `ReturnController`
- `SupplierPayment` (تسجيل دفعات للموردين) — simple ledger entry

**ما لا يدخل:**
- ❌ Accounting journal entries تلقائية
- ❌ Partner purchase integration

**Dependencies:** Phase 5 ✅, Phase 6 ✅

---

### Phase 8 — Accounting Foundation
**الهدف:** نظام محاسبة كامل مع قيود يومية وتقارير.

**ما يدخل:**
- JPA entities: `FiscalYear`, `AccountingPeriod`, `Account`, `Journal`, `JournalItem`
- Chart of accounts deployment من template
- `AccountService` — شجرة الحسابات + CRUD
- `JournalService` — إنشاء قيود يدوية
- Auto-entry rules لعمليات البيع/الشراء/الدفع
- `AccountBalanceService` — حساب الأرصدة
- Reports: ميزانية عمومية، قائمة دخل، ميزان مراجعة
- Opening balances entry

**ما لا يدخل:**
- ❌ Year closing automation
- ❌ Bank reconciliation UI
- ❌ Tax reports

**Dependencies:** Phase 6 ✅, Phase 7 ✅

**Frontend Integration:** بعد Phase 8 → FE-5 (accounting integration)

---

### Phase 9 — Documents + Road Invoices + Reports
**ما يدخل:**
- `RoadInvoice` entity + CRUD + print logic
- PDF generation foundation (أو template metadata)
- Advanced reports (sales by customer, salesperson, product, wilaya)
- Export to PDF/Excel readiness (structure فقط)

**Dependencies:** Phase 6 ✅

---

### Phase 10 — Manufacturing
**ما يدخل:**
- `ManufacturingRequest` lifecycle كامل
- Materials + quality checks + receipts
- Integration مع stock (reserve/consume/receive)

**Dependencies:** Phase 5 ✅, Phase 6 ✅

---

### Phase 11 — External Integrations
**ما يدخل:**
- Cloudflare R2 file upload service (media_assets)
- WhatsApp API client (إرسال فاتورة طريق)
- AI job queue foundation

**Dependencies:** Phase 9 ✅

---

## Frontend Integration Phases

### FE-1 — Auth Integration
- بعد: Phase 3
- ما يُربط: login, logout, JWT storage, role-based UI gating
- Contract: `POST /api/auth/login` → `{ token, user { id, name, email, roleCode } }`

### FE-2 — Master Data Integration
- بعد: Phase 4
- ما يُربط: products list/create/edit, customers, categories, units
- Endpoints: `GET/POST/PUT/DELETE /api/v1/products`, customers, categories

### FE-3 — Orders Integration
- بعد: Phase 6
- ما يُربط: new order flow, order list, order detail, status transitions
- Endpoints: `/api/v1/orders` + transitions

### FE-4 — Inventory Integration
- بعد: Phase 5
- ما يُربط: stock levels, stock adjustment, warehouse management
- Endpoints: `/api/v1/warehouses`, `/api/v1/inventory`

### FE-5 — Accounting Integration
- بعد: Phase 8
- ما يُربط: chart of accounts, journals, reports
- Endpoints: `/api/v1/accounting/**`

---

## قواعد عامة للتطوير

```
✅ DO:
- Pagination على كل list endpoint (default 20, max 100)
- Validation على كل input DTO
- @Transactional على operations تكتب أكثر من جدول
- SQL indexes على كل FK + search columns
- Audit log للعمليات الحساسة
- أكواد HTTP صحيحة (201 Created, 404 Not Found, ...)
- Consistent response shape: ApiResponse<T>

❌ DON'T:
- N+1 queries (استخدم JOIN أو fetch join)
- Business logic في Controller
- Catch Exception بشكل عشوائي
- Hardcode secrets في الكود
- Skip validation على trust internal calls
- Mix platform and tenant logic في نفس service
```

---

## Definition of Done العام (لكل مرحلة)

```
1. ./mvnw compile  → BUILD SUCCESS
2. ./mvnw test     → لا test failures جديدة
3. لا TODO عالق أو stub غير مكتمل
4. لا secrets/passwords في الكود
5. الـ endpoints الجديدة تُرجع ApiResponse<T> موحد
6. Error cases تُرجع ErrorResponse موحد
7. هذا الملف محدث بحالة المرحلة
```
