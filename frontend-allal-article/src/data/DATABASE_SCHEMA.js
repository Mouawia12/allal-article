/* eslint-disable */
/**
 * ════════════════════════════════════════════════════════════════════════════════
 *  هيكل قاعدة البيانات الكامل — مبني من مراجعة كل واجهات المشروع
 *  PostgreSQL — Multi-tenant (schema-per-tenant)
 *
 *  البنية العامة:
 *    - قاعدة بيانات المنصة (platform DB): plans, tenants, owner_support_*
 *    - قاعدة بيانات كل مشترك (tenant schema): كل الجداول الأخرى
 *
 *  المراجع: src/data/mock/* + src/layouts/*/index.js
 * ════════════════════════════════════════════════════════════════════════════════
 */

// ══════════════════════════════════════════════════════════════════════════════
//  I. قاعدة بيانات المنصة (platform schema)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * plans
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * code            VARCHAR(30) UNIQUE NOT NULL          -- trial | basic | professional | enterprise
 * name_ar         VARCHAR(60) NOT NULL
 * name_en         VARCHAR(60) NOT NULL
 * price_monthly   NUMERIC(10,2)                        -- NULL = تفاوضي (enterprise)
 * duration_days   SMALLINT NOT NULL DEFAULT 30
 * max_users       SMALLINT                             -- NULL = غير محدود
 * max_orders      INTEGER                              -- NULL = غير محدود
 * max_products    INTEGER                              -- NULL = غير محدود
 * max_storage_mb  INTEGER DEFAULT 500
 * features        TEXT[]                               -- ['orders','products','ai',...]
 * color           VARCHAR(10)                          -- لون العرض في UI
 * is_active       BOOLEAN DEFAULT TRUE
 * created_at      TIMESTAMP DEFAULT now()
 * updated_at      TIMESTAMP DEFAULT now()
 */

/**
 * tenants
 * ─────────────────────────────────────────────────────────────────────────────
 * id                    SERIAL PRIMARY KEY
 * uuid                  UUID UNIQUE DEFAULT gen_random_uuid()
 * schema_name           VARCHAR(63) UNIQUE NOT NULL     -- tenant_{uuid_prefix}
 * name                  VARCHAR(150) NOT NULL
 * contact_email         VARCHAR(150) NOT NULL
 * contact_phone         VARCHAR(30)
 * wilaya                VARCHAR(50)
 * status                VARCHAR(20) DEFAULT 'trial'     -- trial | active | suspended | cancelled
 * plan_id               INTEGER REFERENCES plans(id)
 * trial_ends_at         DATE
 * subscription_started_at DATE
 * subscription_renews_at  DATE
 * users_count           SMALLINT DEFAULT 0              -- يُحسب أو يُخزن
 * orders_this_month     INTEGER DEFAULT 0
 * total_orders          INTEGER DEFAULT 0
 * storage_used_mb       INTEGER DEFAULT 0
 * last_activity_at      TIMESTAMP
 * created_at            TIMESTAMP DEFAULT now()
 * updated_at            TIMESTAMP DEFAULT now()
 *
 * INDEX: tenants(status), tenants(plan_id)
 */

/**
 * owner_support_tickets   (تذاكر الدعم على مستوى المنصة)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * public_id       VARCHAR(20) UNIQUE NOT NULL           -- TCK-2026-001
 * tenant_id       INTEGER REFERENCES tenants(id)
 * subject         VARCHAR(200) NOT NULL
 * category        VARCHAR(50)                           -- الطلبيات | الاشتراك | الطباعة ...
 * priority        VARCHAR(10) DEFAULT 'normal'          -- low | normal | high | urgent
 * status          VARCHAR(20) DEFAULT 'open'            -- open | waiting_owner | waiting_tenant | resolved | closed
 * opened_by       VARCHAR(100)                          -- اسم فاتح التذكرة (مشترك)
 * assigned_to     VARCHAR(100)                          -- مسؤول الدعم
 * unread_owner    SMALLINT DEFAULT 0
 * unread_tenant   SMALLINT DEFAULT 0
 * created_at      TIMESTAMP DEFAULT now()
 * last_message_at TIMESTAMP
 * resolved_at     TIMESTAMP
 * closed_at       TIMESTAMP
 *
 * INDEX: owner_support_tickets(tenant_id), owner_support_tickets(status)
 */

/**
 * owner_support_messages
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * ticket_id       INTEGER REFERENCES owner_support_tickets(id) ON DELETE CASCADE
 * sender_type     VARCHAR(10) NOT NULL                  -- owner | tenant
 * sender_name     VARCHAR(100)
 * body            TEXT NOT NULL
 * is_system       BOOLEAN DEFAULT FALSE                 -- رسائل النظام (تغيير حالة...)
 * created_at      TIMESTAMP DEFAULT now()
 *
 * owner_support_attachments
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * message_id      INTEGER REFERENCES owner_support_messages(id) ON DELETE CASCADE
 * type            VARCHAR(10)                           -- image | pdf | file
 * name            VARCHAR(200)
 * url             TEXT NOT NULL
 * size_bytes      BIGINT
 * created_at      TIMESTAMP DEFAULT now()
 */

// ══════════════════════════════════════════════════════════════════════════════
//  II. إعدادات الشركة (company_profile) — جدول واحد per tenant
// ══════════════════════════════════════════════════════════════════════════════

/**
 * company_profile
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * name_ar             VARCHAR(150) NOT NULL
 * name_fr             VARCHAR(150)
 * legal_form          VARCHAR(30)                       -- SARL | EURL | SPA | SNC | auto_entrepreneur | other
 * trade_register_no   VARCHAR(50)                       -- RC
 * tax_id              VARCHAR(20)                       -- NIF (15 أرقام)
 * statistical_id      VARCHAR(20)                       -- NIS
 * article_imposition  VARCHAR(20)                       -- AI
 * address             TEXT
 * wilaya              VARCHAR(50)
 * postal_code         VARCHAR(10)
 * phone               VARCHAR(30)
 * mobile              VARCHAR(30)
 * fax                 VARCHAR(30)
 * email               VARCHAR(150)
 * website             VARCHAR(150)
 * bank_name           VARCHAR(100)
 * bank_branch         VARCHAR(100)
 * rib                 VARCHAR(50)                       -- Relevé d'Identité Bancaire
 * capital_social      NUMERIC(15,2)
 * logo_url            TEXT
 * stamp_image_url     TEXT
 * signature_image_url TEXT
 * invoice_footer_ar   TEXT
 * invoice_footer_fr   TEXT
 * updated_at          TIMESTAMP DEFAULT now()
 */

// ══════════════════════════════════════════════════════════════════════════════
//  III. المستخدمون والصلاحيات
// ══════════════════════════════════════════════════════════════════════════════

/**
 * users
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
 * name                VARCHAR(100) NOT NULL
 * email               VARCHAR(150) NOT NULL UNIQUE
 * phone               VARCHAR(20)
 * password_hash       VARCHAR(255) NOT NULL
 * role                VARCHAR(20) NOT NULL              -- owner | admin | salesperson | accountant | viewer
 * status              VARCHAR(20) DEFAULT 'active'      -- active | inactive | suspended
 * assigned_wilaya     VARCHAR(50)                       -- للبائعين فقط
 * max_discount_pct    SMALLINT DEFAULT 0                -- 0-30%
 * can_view_all_orders BOOLEAN DEFAULT FALSE
 * lang                VARCHAR(5) DEFAULT 'ar'           -- ar | fr | en
 * avatar_url          TEXT
 * notes               TEXT
 * last_login          TIMESTAMP
 * created_at          TIMESTAMP DEFAULT now()
 * created_by          UUID REFERENCES users(id)
 *
 * permissions
 * ─────────────────────────────────────────────────────────────────────────────
 * code            VARCHAR(60) PRIMARY KEY               -- e.g. "orders.create"
 * label           VARCHAR(100) NOT NULL
 * module          VARCHAR(40) NOT NULL
 * description     TEXT
 * sort_order      SMALLINT DEFAULT 0
 *
 * role_permissions
 * ─────────────────────────────────────────────────────────────────────────────
 * role              VARCHAR(20) NOT NULL
 * permission_code   VARCHAR(60) REFERENCES permissions(code)
 * PRIMARY KEY (role, permission_code)
 *
 * user_permissions  (تجاوز role_permissions لمستخدم بعينه)
 * ─────────────────────────────────────────────────────────────────────────────
 * user_id           UUID REFERENCES users(id) ON DELETE CASCADE
 * permission_code   VARCHAR(60) REFERENCES permissions(code)
 * granted           BOOLEAN DEFAULT TRUE                -- FALSE = سحب صريح
 * granted_by        UUID REFERENCES users(id)
 * granted_at        TIMESTAMP DEFAULT now()
 * PRIMARY KEY (user_id, permission_code)
 *
 * INDEX: user_permissions(user_id), role_permissions(role)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  IV. الأصناف (Products)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * products
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * code                VARCHAR(50) UNIQUE NOT NULL       -- BRG-010-50
 * name                VARCHAR(200) NOT NULL
 * description_ar      TEXT
 * description_fr      TEXT
 * category            VARCHAR(80)
 * unit                VARCHAR(20) NOT NULL              -- قطعة | متر | لتر | كغ | لفة | علبة
 * color               VARCHAR(10)                       -- لون العرض في UI
 * price               NUMERIC(12,4) NOT NULL DEFAULT 0  -- سعر البيع الرئيسي (دج)
 * purchase_price      NUMERIC(12,4) DEFAULT 0           -- سعر التكلفة/الشراء
 * tax_rate            NUMERIC(5,2) DEFAULT 19           -- نسبة TVA %
 * barcode             VARCHAR(100)
 * weight_kg           NUMERIC(8,3) DEFAULT 0            -- الوزن للوحدة (يستخدم في فواتير الطريق)
 * min_stock           INTEGER DEFAULT 0                 -- حد التنبيه بالمخزون
 * image_urls          JSONB DEFAULT '[]'                -- مصفوفة روابط الصور
 * is_active           BOOLEAN DEFAULT TRUE
 * last_price_updated_at TIMESTAMP
 * default_supplier_id INTEGER REFERENCES suppliers(id)  -- المورد الافتراضي
 * created_by          UUID REFERENCES users(id)
 * created_at          TIMESTAMP DEFAULT now()
 * updated_at          TIMESTAMP DEFAULT now()
 *
 * product_favorites  (مفضلة الأصناف لكل مستخدم)
 * ─────────────────────────────────────────────────────────────────────────────
 * user_id         UUID REFERENCES users(id) ON DELETE CASCADE
 * product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE
 * created_at      TIMESTAMP DEFAULT now()
 * PRIMARY KEY (user_id, product_id)
 *
 * INDEX: products(code), products(category), products(is_active)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  V. المخازن والمخزون
// ══════════════════════════════════════════════════════════════════════════════

/**
 * warehouses
 * ─────────────────────────────────────────────────────────────────────────────
 * id          VARCHAR(20) PRIMARY KEY                   -- WH-MAIN | WH-TOOLS
 * name        VARCHAR(100) NOT NULL
 * type        VARCHAR(30)                               -- مركزي | تشغيلي | حجر/مرتجع
 * city        VARCHAR(50)
 * wilaya      VARCHAR(50)
 * address     TEXT
 * manager     VARCHAR(100)
 * capacity    INTEGER                                   -- السعة الإجمالية (وحدات)
 * is_default  BOOLEAN DEFAULT FALSE
 * is_active   BOOLEAN DEFAULT TRUE
 * created_at  TIMESTAMP DEFAULT now()
 *
 * stock_lines  (المخزون الفعلي لكل صنف في كل مخزن)
 * ─────────────────────────────────────────────────────────────────────────────
 * id           SERIAL PRIMARY KEY
 * product_id   INTEGER REFERENCES products(id)
 * warehouse_id VARCHAR(20) REFERENCES warehouses(id)
 * on_hand      INTEGER NOT NULL DEFAULT 0               -- المتاح الفعلي
 * reserved     INTEGER NOT NULL DEFAULT 0               -- محجوز لطلبيات
 * pending      INTEGER NOT NULL DEFAULT 0               -- في الطريق (مشتريات مؤكدة)
 * updated_at   TIMESTAMP DEFAULT now()
 * UNIQUE (product_id, warehouse_id)
 *
 * stock_movements  (سجل كل حركة مخزون)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * product_id          INTEGER REFERENCES products(id)
 * from_warehouse_id   VARCHAR(20) REFERENCES warehouses(id)  -- NULL = دخول جديد
 * to_warehouse_id     VARCHAR(20) REFERENCES warehouses(id)  -- NULL = خروج
 * qty                 INTEGER NOT NULL
 * type                VARCHAR(20) NOT NULL              -- transfer | adjustment | receive | ship | return | opening
 * reference_type      VARCHAR(20)                       -- order | purchase | road_invoice | manual | manufacturing
 * reference_id        VARCHAR(50)                       -- رقم الطلبية / الشراء / الفاتورة
 * reason              TEXT
 * created_by          UUID REFERENCES users(id)
 * created_at          TIMESTAMP DEFAULT now()
 *
 * INDEX: stock_lines(product_id), stock_lines(warehouse_id)
 * INDEX: stock_movements(product_id, created_at), stock_movements(reference_type, reference_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  VI. قوائم الأسعار
// ══════════════════════════════════════════════════════════════════════════════

/**
 * price_lists
 * ─────────────────────────────────────────────────────────────────────────────
 * id          VARCHAR(30) PRIMARY KEY                   -- MAIN | AHMED | WHOLESALE
 * code        VARCHAR(30) UNIQUE NOT NULL               -- PL-AHMED | PUR-MAIN
 * name        VARCHAR(100) NOT NULL
 * type        VARCHAR(10) NOT NULL DEFAULT 'both'       -- sales | purchase | both
 * description TEXT
 * is_default  BOOLEAN DEFAULT FALSE
 * is_active   BOOLEAN DEFAULT TRUE
 * updated_at  TIMESTAMP DEFAULT now()
 * created_at  TIMESTAMP DEFAULT now()
 *
 * price_list_items  (أسعار خاصة لكل صنف في القائمة)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * price_list_id   VARCHAR(30) REFERENCES price_lists(id) ON DELETE CASCADE
 * product_id      INTEGER REFERENCES products(id)
 * unit_price      NUMERIC(12,4) NOT NULL
 * UNIQUE (price_list_id, product_id)
 *
 * price_list_assignments  (ربط قوائم الأسعار بالزبائن والموردين)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * price_list_id   VARCHAR(30) REFERENCES price_lists(id) ON DELETE CASCADE
 * entity_type     VARCHAR(10) NOT NULL                  -- customer | supplier
 * entity_id       INTEGER NOT NULL                      -- customer.id أو supplier.id
 * assigned_at     TIMESTAMP DEFAULT now()
 * UNIQUE (price_list_id, entity_type, entity_id)
 *
 * INDEX: price_list_assignments(entity_type, entity_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  VII. الزبائن
// ══════════════════════════════════════════════════════════════════════════════

/**
 * customers
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * name                VARCHAR(150) NOT NULL
 * legal_name          VARCHAR(150)                      -- الاسم القانوني
 * phone               VARCHAR(30)
 * phone2              VARCHAR(30)
 * email               VARCHAR(150)
 * address             TEXT
 * wilaya              VARCHAR(50)
 * tax_number          VARCHAR(20)                       -- NIF
 * commercial_register VARCHAR(30)                       -- RC
 * nis_number          VARCHAR(20)                       -- NIS
 * salesperson_id      UUID REFERENCES users(id)         -- البائع المسؤول
 * shipping_route      VARCHAR(100)                      -- وهران - الساحل
 * price_list_id       VARCHAR(30) REFERENCES price_lists(id) -- قائمة الأسعار الافتراضية
 * credit_limit        NUMERIC(15,2) DEFAULT 0           -- حد الائتمان (0 = غير محدود)
 * opening_balance     NUMERIC(15,2) DEFAULT 0           -- رصيد افتتاحي
 * total_amount        NUMERIC(15,2) DEFAULT 0           -- مجموع الفواتير
 * paid_amount         NUMERIC(15,2) DEFAULT 0           -- مجموع المدفوعات
 * status              VARCHAR(10) DEFAULT 'active'      -- active | inactive
 * notes               TEXT
 * orders_count        INTEGER DEFAULT 0
 * last_order_date     DATE
 * created_by          UUID REFERENCES users(id)
 * created_at          TIMESTAMP DEFAULT now()
 * updated_at          TIMESTAMP DEFAULT now()
 *
 * INDEX: customers(wilaya), customers(status), customers(salesperson_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  VIII. الموردون
// ══════════════════════════════════════════════════════════════════════════════

/**
 * suppliers
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  VARCHAR(20) PRIMARY KEY           -- SUP-001
 * name                VARCHAR(150) NOT NULL
 * legal_name          VARCHAR(150)
 * phone               VARCHAR(30)
 * email               VARCHAR(150)
 * tax_number          VARCHAR(20)                       -- NIF
 * commercial_register VARCHAR(30)                       -- RC
 * nis_number          VARCHAR(20)                       -- NIS
 * wilaya              VARCHAR(50)
 * address             TEXT
 * category            VARCHAR(60)                       -- مواد أولية | أدوات | كهرباء
 * status              VARCHAR(10) DEFAULT 'active'      -- active | inactive
 * payment_terms       VARCHAR(100)                      -- آجل 30 يوم | نقدي | تسبيق ثم تسوية
 * price_list_id       VARCHAR(30) REFERENCES price_lists(id) -- قائمة شراء افتراضية
 * opening_balance     NUMERIC(15,2) DEFAULT 0
 * total_purchases     NUMERIC(15,2) DEFAULT 0
 * paid_amount         NUMERIC(15,2) DEFAULT 0
 * last_purchase_date  DATE
 * partner_uuid        UUID                              -- ربط بشبكة الشركاء (إن وجد)
 * manual_partner_uuid UUID                              -- ربط يدوي
 * notes               TEXT
 * created_by          UUID REFERENCES users(id)
 * created_at          TIMESTAMP DEFAULT now()
 * updated_at          TIMESTAMP DEFAULT now()
 *
 * INDEX: suppliers(status), suppliers(partner_uuid)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  IX. المدفوعات (مشتركة بين الزبائن والموردين)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * payments
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * date            DATE NOT NULL
 * amount          NUMERIC(15,2) NOT NULL
 * type            VARCHAR(15) NOT NULL                  -- cash | bank | cheque | virement
 * direction       VARCHAR(3) NOT NULL                   -- in (قبض) | out (صرف)
 * entity_type     VARCHAR(10) NOT NULL                  -- customer | supplier
 * entity_id       INTEGER NOT NULL                      -- customer.id أو supplier.id
 * payer           VARCHAR(100)                          -- من دفع
 * receiver        VARCHAR(100)                          -- من استلم
 * reference_no    VARCHAR(50)                           -- رقم الشيك | رقم التحويل
 * linked_order_id VARCHAR(30)                           -- ORD-XXXX
 * linked_purchase_id VARCHAR(30)                        -- PUR-XXXX
 * notes           TEXT
 * recorded_by     UUID REFERENCES users(id)
 * created_at      TIMESTAMP DEFAULT now()
 *
 * INDEX: payments(entity_type, entity_id), payments(date), payments(direction)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  X. الطلبيات
// ══════════════════════════════════════════════════════════════════════════════

/**
 * orders
 * ─────────────────────────────────────────────────────────────────────────────
 * id              VARCHAR(20) PRIMARY KEY               -- ORD-2024-001
 * customer_id     INTEGER REFERENCES customers(id)
 * salesperson_id  UUID REFERENCES users(id)
 * price_list_id   VARCHAR(30) REFERENCES price_lists(id)
 * warehouse_id    VARCHAR(20) REFERENCES warehouses(id) -- مخزن الشحن
 * date            DATE NOT NULL
 * status          VARCHAR(20) NOT NULL DEFAULT 'draft'  -- draft | submitted | under_review | confirmed | shipped | completed | cancelled | rejected
 * shipping_status VARCHAR(15) DEFAULT 'none'            -- none | pending | shipped
 * shipping_route  VARCHAR(100)
 * discount_pct    NUMERIC(5,2) DEFAULT 0                -- خصم على مستوى الطلبية
 * subtotal        NUMERIC(15,2) DEFAULT 0               -- قبل الضريبة والخصم
 * tax_amount      NUMERIC(15,2) DEFAULT 0
 * total_amount    NUMERIC(15,2) DEFAULT 0
 * notes           TEXT
 * created_by      UUID REFERENCES users(id)
 * confirmed_by    UUID REFERENCES users(id)
 * confirmed_at    TIMESTAMP
 * created_at      TIMESTAMP DEFAULT now()
 * updated_at      TIMESTAMP DEFAULT now()
 *
 * order_lines
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * order_id        VARCHAR(20) REFERENCES orders(id) ON DELETE CASCADE
 * product_id      INTEGER REFERENCES products(id)
 * unit            VARCHAR(20)                           -- وحدة القياس
 * requested_qty   INTEGER NOT NULL DEFAULT 0
 * approved_qty    INTEGER NOT NULL DEFAULT 0
 * shipped_qty     INTEGER NOT NULL DEFAULT 0
 * returned_qty    INTEGER DEFAULT 0
 * cancelled_qty   INTEGER DEFAULT 0
 * unit_price      NUMERIC(12,4) NOT NULL
 * discount_pct    NUMERIC(5,2) DEFAULT 0                -- خصم على مستوى السطر
 * tax_rate        NUMERIC(5,2) DEFAULT 0
 * price_source    VARCHAR(20) DEFAULT 'product_default' -- price_list | product_default | manual_override
 * line_status     VARCHAR(15) DEFAULT 'pending'         -- pending | modified | cancelled | shipped
 * will_ship       BOOLEAN DEFAULT TRUE
 * notes           TEXT
 * sort_order      SMALLINT DEFAULT 0
 *
 * INDEX: orders(customer_id, date), orders(salesperson_id), orders(status)
 * INDEX: order_lines(order_id), order_lines(product_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XI. المشتريات
// ══════════════════════════════════════════════════════════════════════════════

/**
 * purchases
 * ─────────────────────────────────────────────────────────────────────────────
 * id              VARCHAR(20) PRIMARY KEY               -- PUR-2024-001
 * supplier_id     VARCHAR(20) REFERENCES suppliers(id)
 * warehouse_id    VARCHAR(20) REFERENCES warehouses(id)
 * date            DATE NOT NULL
 * expected_date   DATE
 * status          VARCHAR(15) DEFAULT 'pending'         -- pending | confirmed | received | cancelled
 * payment_status  VARCHAR(10) DEFAULT 'unpaid'          -- unpaid | partial | paid
 * total_amount    NUMERIC(15,2) DEFAULT 0
 * invoice_no      VARCHAR(50)                           -- رقم الفاتورة من المورد
 * requested_by    VARCHAR(100)                          -- UUID or name
 * received_by     VARCHAR(100)                          -- UUID or name
 * notes           TEXT
 * created_by      UUID REFERENCES users(id)
 * created_at      TIMESTAMP DEFAULT now()
 * updated_at      TIMESTAMP DEFAULT now()
 *
 * purchase_lines
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * purchase_id     VARCHAR(20) REFERENCES purchases(id) ON DELETE CASCADE
 * product_id      INTEGER REFERENCES products(id)
 * unit            VARCHAR(20)
 * qty             INTEGER NOT NULL
 * received_qty    INTEGER DEFAULT 0
 * returned_qty    INTEGER DEFAULT 0
 * unit_price      NUMERIC(12,4) NOT NULL
 * tax_rate        NUMERIC(5,2) DEFAULT 19
 * sort_order      SMALLINT DEFAULT 0
 *
 * INDEX: purchases(supplier_id, date), purchases(status)
 * INDEX: purchase_lines(purchase_id), purchase_lines(product_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XII. فواتير الطريق
// ══════════════════════════════════════════════════════════════════════════════

/**
 * road_invoices
 * ─────────────────────────────────────────────────────────────────────────────
 * id              VARCHAR(20) PRIMARY KEY               -- FTR-2024-001
 * date            DATE NOT NULL
 * wilaya          VARCHAR(50)
 * customer        VARCHAR(150)                          -- موزع / زبون التسليم
 * driver          VARCHAR(100)
 * driver_phone    VARCHAR(30)
 * vehicle_plate   VARCHAR(20)                           -- رقم لوحة الشاحنة
 * total_weight_kg NUMERIC(8,2) DEFAULT 0                -- الوزن الإجمالي
 * status          VARCHAR(15) DEFAULT 'draft'           -- draft | sent | delivered | cancelled
 * print_count     SMALLINT DEFAULT 0
 * notes           TEXT
 * created_by      UUID REFERENCES users(id)
 * created_at      TIMESTAMP DEFAULT now()
 * updated_at      TIMESTAMP DEFAULT now()
 *
 * road_invoice_orders  (الطلبيات المدمجة في الفاتورة)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * road_invoice_id     VARCHAR(20) REFERENCES road_invoices(id) ON DELETE CASCADE
 * order_id            VARCHAR(20) REFERENCES orders(id)
 * sort_order          SMALLINT DEFAULT 0
 * UNIQUE (road_invoice_id, order_id)
 *
 * road_invoice_lines  (تفاصيل الأصناف للطباعة — منسوخ من الطلبيات)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * road_invoice_id     VARCHAR(20) REFERENCES road_invoices(id) ON DELETE CASCADE
 * order_id            VARCHAR(20)
 * product_id          INTEGER REFERENCES products(id)
 * qty                 INTEGER NOT NULL
 * unit                VARCHAR(20)
 * unit_price          NUMERIC(12,4)
 * weight_kg           NUMERIC(8,3)                      -- وزن هذا الصنف
 *
 * INDEX: road_invoices(date, wilaya), road_invoices(status)
 * INDEX: road_invoice_orders(road_invoice_id), road_invoice_orders(order_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XIII. التصنيع
// ══════════════════════════════════════════════════════════════════════════════

/**
 * manufacturing_requests
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  VARCHAR(20) PRIMARY KEY           -- MFG-2025-001
 * product_id          INTEGER REFERENCES products(id)
 * qty                 INTEGER NOT NULL
 * unit                VARCHAR(20)
 * source_type         VARCHAR(20)                       -- sold_order | stock_replenishment | custom_order
 * sales_order_id      VARCHAR(20) REFERENCES orders(id) -- إن كان مرتبطاً ببيع
 * customer_id         INTEGER REFERENCES customers(id)  -- إن كان مرتبطاً ببيع
 * destination_warehouse_id VARCHAR(20) REFERENCES warehouses(id)
 * factory             VARCHAR(100)
 * production_line     VARCHAR(100)
 * requester_id        UUID REFERENCES users(id)
 * responsible_id      UUID REFERENCES users(id)
 * priority            VARCHAR(10) DEFAULT 'normal'      -- low | normal | high | urgent
 * status              VARCHAR(20) DEFAULT 'draft'       -- draft | approved | queued | in_production | quality_check | ready_to_ship | in_transit | received | cancelled
 * progress            SMALLINT DEFAULT 5                -- 0-100%
 * produced_qty        INTEGER DEFAULT 0
 * received_qty        INTEGER DEFAULT 0
 * deposit_required    BOOLEAN DEFAULT FALSE
 * deposit_amount      NUMERIC(12,2) DEFAULT 0
 * deposit_paid        NUMERIC(12,2) DEFAULT 0
 * deposit_status      VARCHAR(10) DEFAULT 'none'        -- none | pending | partial | paid
 * requested_at        DATE NOT NULL
 * due_date            DATE
 * updated_at          TIMESTAMP DEFAULT now()
 * notes               TEXT
 *
 * manufacturing_materials  (المواد المطلوبة لكل أمر تصنيع)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * request_id          VARCHAR(20) REFERENCES manufacturing_requests(id) ON DELETE CASCADE
 * product_id          INTEGER REFERENCES products(id)
 * name                VARCHAR(200)                      -- احتياطي إن كان المنتج غير موجود
 * unit                VARCHAR(20)
 * planned_qty         NUMERIC(10,3) NOT NULL
 * reserved_qty        NUMERIC(10,3) DEFAULT 0
 * consumed_qty        NUMERIC(10,3) DEFAULT 0
 *
 * manufacturing_quality_checks  (نتائج فحوصات الجودة — قابل للتعدد)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * request_id          VARCHAR(20) REFERENCES manufacturing_requests(id)
 * passed              INTEGER DEFAULT 0
 * rework              INTEGER DEFAULT 0
 * rejected            INTEGER DEFAULT 0
 * checked_by          UUID REFERENCES users(id)
 * checked_at          TIMESTAMP DEFAULT now()
 * notes               TEXT
 *
 * manufacturing_timeline  (سجل أحداث أمر التصنيع)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                  SERIAL PRIMARY KEY
 * request_id          VARCHAR(20) REFERENCES manufacturing_requests(id) ON DELETE CASCADE
 * actor               VARCHAR(100)                      -- اسم المستخدم أو "النظام"
 * actor_id            UUID REFERENCES users(id)
 * title               VARCHAR(200)
 * body                TEXT
 * created_at          TIMESTAMP DEFAULT now()
 *
 * INDEX: manufacturing_requests(status), manufacturing_requests(due_date)
 * INDEX: manufacturing_materials(request_id)
 * INDEX: manufacturing_timeline(request_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XIV. المحاسبة
// ══════════════════════════════════════════════════════════════════════════════

/**
 * fiscal_years
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * name            VARCHAR(60) NOT NULL
 * start_date      DATE NOT NULL
 * end_date        DATE NOT NULL
 * is_closed       BOOLEAN DEFAULT FALSE
 * closed_at       TIMESTAMP
 * closed_by       UUID REFERENCES users(id)
 * reopen_reason   TEXT
 * created_at      TIMESTAMP DEFAULT now()
 *
 * accounts  (شجرة الحسابات)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * code            VARCHAR(10) UNIQUE NOT NULL           -- 1 | 11 | 111 | 131
 * name_ar         VARCHAR(150) NOT NULL
 * name_fr         VARCHAR(150)
 * parent_id       INTEGER REFERENCES accounts(id)
 * level           SMALLINT NOT NULL DEFAULT 1           -- 1 | 2 | 3
 * classification  VARCHAR(15) NOT NULL                  -- asset | liability | equity | revenue | expense
 * normal_balance  VARCHAR(6) NOT NULL                   -- debit | credit
 * is_postable     BOOLEAN DEFAULT FALSE                 -- يقبل قيوداً مباشرة
 * is_control      BOOLEAN DEFAULT FALSE                 -- حساب رقابي (ذمم عملاء/موردين)
 * is_active       BOOLEAN DEFAULT TRUE
 * balance         NUMERIC(15,2) DEFAULT 0               -- يُحسب من الحركات
 * created_at      TIMESTAMP DEFAULT now()
 *
 * journals  (دفتر القيود)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * number          VARCHAR(20) UNIQUE NOT NULL           -- JRN-2025-001
 * date            DATE NOT NULL
 * type            VARCHAR(20) NOT NULL                  -- opening | sales | purchase | payment | manual | adjustment
 * status          VARCHAR(10) DEFAULT 'draft'           -- draft | posted | reversed
 * source          VARCHAR(20)                           -- manual | order | purchase | payment
 * source_id       VARCHAR(30)                           -- رقم الطلبية/الشراء المرجعي
 * description     VARCHAR(250)
 * total_debit     NUMERIC(15,2) NOT NULL DEFAULT 0
 * total_credit    NUMERIC(15,2) NOT NULL DEFAULT 0
 * fiscal_year_id  INTEGER REFERENCES fiscal_years(id)
 * created_by      UUID REFERENCES users(id)
 * created_at      TIMESTAMP DEFAULT now()
 * posted_at       TIMESTAMP
 *
 * journal_lines
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * journal_id      INTEGER REFERENCES journals(id) ON DELETE CASCADE
 * account_id      INTEGER REFERENCES accounts(id)
 * debit           NUMERIC(15,2) NOT NULL DEFAULT 0
 * credit          NUMERIC(15,2) NOT NULL DEFAULT 0
 * description     VARCHAR(250)
 * sort_order      SMALLINT DEFAULT 0
 *
 * opening_balances  (الأرصدة الافتتاحية per fiscal year)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * fiscal_year_id  INTEGER REFERENCES fiscal_years(id)
 * account_id      INTEGER REFERENCES accounts(id)
 * amount          NUMERIC(15,2) NOT NULL DEFAULT 0
 * recorded_by     UUID REFERENCES users(id)
 * recorded_at     TIMESTAMP DEFAULT now()
 * UNIQUE (fiscal_year_id, account_id)
 *
 * accounting_settings  (إعدادات المحاسبة)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                          SERIAL PRIMARY KEY
 * auto_journal_on_order       BOOLEAN DEFAULT TRUE
 * auto_journal_on_purchase    BOOLEAN DEFAULT TRUE
 * auto_journal_on_payment     BOOLEAN DEFAULT TRUE
 * auto_journal_on_road_invoice BOOLEAN DEFAULT FALSE
 * default_sales_account_id    INTEGER REFERENCES accounts(id)
 * default_cogs_account_id     INTEGER REFERENCES accounts(id)
 * default_purchase_account_id INTEGER REFERENCES accounts(id)
 * default_receivable_account_id INTEGER REFERENCES accounts(id)
 * default_payable_account_id  INTEGER REFERENCES accounts(id)
 * default_cash_account_id     INTEGER REFERENCES accounts(id)
 * default_bank_account_id     INTEGER REFERENCES accounts(id)
 * default_tax_account_id      INTEGER REFERENCES accounts(id)
 * default_inventory_account_id INTEGER REFERENCES accounts(id)
 * updated_at                  TIMESTAMP DEFAULT now()
 *
 * INDEX: journals(date, fiscal_year_id), journals(type, status)
 * INDEX: journal_lines(journal_id), journal_lines(account_id)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XV. الإشعارات
// ══════════════════════════════════════════════════════════════════════════════

/**
 * notification_types  (قائمة أنواع الإشعارات — seed data)
 * ─────────────────────────────────────────────────────────────────────────────
 * code            VARCHAR(60) PRIMARY KEY               -- inventory.low_stock
 * category        VARCHAR(30) NOT NULL                  -- products | inventory | orders | payments | ...
 * title_ar        VARCHAR(150) NOT NULL
 * severity        VARCHAR(20) DEFAULT 'info'            -- info | success | warning | critical | action_required
 * channels        TEXT[] DEFAULT '{in_app}'             -- in_app | email | sms
 * digest_mode     VARCHAR(10) DEFAULT 'instant'         -- instant | hourly | daily
 * is_mutable      BOOLEAN DEFAULT TRUE                  -- يمكن للمستخدم تعطيله
 *
 * notification_preferences  (إعدادات كل مستخدم لكل نوع إشعار)
 * ─────────────────────────────────────────────────────────────────────────────
 * user_id         UUID REFERENCES users(id) ON DELETE CASCADE
 * type_code       VARCHAR(60) REFERENCES notification_types(code)
 * in_app          BOOLEAN DEFAULT TRUE
 * email           BOOLEAN DEFAULT FALSE
 * sms             BOOLEAN DEFAULT FALSE
 * PRIMARY KEY (user_id, type_code)
 *
 * notifications  (الإشعارات الفعلية)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * public_id       VARCHAR(20) UNIQUE DEFAULT concat('ntf-', gen_random_uuid()::text)
 * user_id         UUID REFERENCES users(id) ON DELETE CASCADE
 * type_code       VARCHAR(60) REFERENCES notification_types(code)
 * title           VARCHAR(200) NOT NULL
 * body            TEXT
 * action_url      VARCHAR(250)
 * action_label    VARCHAR(60)
 * is_read         BOOLEAN DEFAULT FALSE
 * lifecycle       VARCHAR(15) DEFAULT 'new'             -- new | delivered | read | snoozed | actioned | archived | escalated | expired
 * snoozed_until   TIMESTAMP
 * created_at      TIMESTAMP DEFAULT now()
 * read_at         TIMESTAMP
 *
 * INDEX: notifications(user_id, is_read), notifications(lifecycle), notifications(created_at)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XVI. الشركاء (شبكة الربط بين المشتركين)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * invite_codes  (أكواد الدعوة — يصدرها المشترك)
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * code            VARCHAR(20) UNIQUE NOT NULL           -- NORTH-DIST-K7X2
 * label           VARCHAR(100)
 * permissions     JSONB NOT NULL DEFAULT '{}'           -- {"view_inventory":true, "view_pricing":false, ...}
 * max_uses        SMALLINT                              -- NULL = غير محدود
 * uses_count      SMALLINT DEFAULT 0
 * expires_at      DATE
 * is_active       BOOLEAN DEFAULT TRUE
 * created_by      UUID REFERENCES users(id)
 * created_at      TIMESTAMP DEFAULT now()
 *
 * partnerships  (علاقات الربط النشطة)
 * ─────────────────────────────────────────────────────────────────────────────
 * id                      SERIAL PRIMARY KEY
 * provider_tenant_uuid    UUID NOT NULL                 -- من يمنح الصلاحية
 * requester_tenant_uuid   UUID NOT NULL                 -- من طلب الربط
 * invite_code_id          INTEGER REFERENCES invite_codes(id)
 * matched_by              VARCHAR(20)                   -- invite_code | taxNumber | email | phone | manual
 * permissions             JSONB NOT NULL DEFAULT '{}'
 * status                  VARCHAR(15) DEFAULT 'pending' -- pending | active | suspended | rejected
 * -- بيانات هوية الطرف الطالب (مخزنة وقت الربط)
 * partner_name            VARCHAR(150)
 * partner_email           VARCHAR(150)
 * partner_phone           VARCHAR(30)
 * partner_tax_number      VARCHAR(20)
 * partner_commercial_register VARCHAR(30)
 * partner_wilaya          VARCHAR(50)
 * requested_at            TIMESTAMP DEFAULT now()
 * activated_at            TIMESTAMP
 * updated_at              TIMESTAMP DEFAULT now()
 * UNIQUE (provider_tenant_uuid, requester_tenant_uuid)
 *
 * -- الأصناف المشتركة في شبكة الشركاء
 * partnership_linked_inventory
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * partnership_id  INTEGER REFERENCES partnerships(id) ON DELETE CASCADE
 * product_id      INTEGER REFERENCES products(id)
 * product_code    VARCHAR(50)                           -- للمرجع
 * is_visible      BOOLEAN DEFAULT TRUE
 *
 * INDEX: partnerships(provider_tenant_uuid), partnerships(requester_tenant_uuid), partnerships(status)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XVII. سجل العمليات (Audit Log)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * audit_logs
 * ─────────────────────────────────────────────────────────────────────────────
 * id              BIGSERIAL PRIMARY KEY
 * time            TIMESTAMP NOT NULL DEFAULT now()
 * user_id         UUID REFERENCES users(id)
 * user_name       VARCHAR(100)                          -- مخزن مباشرة لتجنب JOIN
 * user_role       VARCHAR(20)
 * action          VARCHAR(60) NOT NULL                  -- create_order | confirm_order | modify_qty | delete_line | add_customer | update_product | ai_process | ship_order | login | logout | ...
 * entity_type     VARCHAR(30)                           -- order | order_line | customer | product | user | payment | purchase | ...
 * entity_id       VARCHAR(50)                           -- ORD-2024-001 | product:123
 * description     TEXT
 * old_values      JSONB                                 -- القيم قبل التعديل
 * new_values      JSONB                                 -- القيم بعد التعديل
 * ip_address      INET
 * session_id      VARCHAR(100)
 *
 * -- partitioned by month for performance
 * -- PARTITION BY RANGE (time)
 *
 * INDEX: audit_logs(user_id, time), audit_logs(entity_type, entity_id), audit_logs(action)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XVIII. قفل الموارد (Resource Locks — منع التعديل المتزامن)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * resource_locks
 * ─────────────────────────────────────────────────────────────────────────────
 * id              SERIAL PRIMARY KEY
 * resource_type   VARCHAR(30) NOT NULL                  -- order | purchase | product | customer
 * resource_id     VARCHAR(50) NOT NULL                  -- ORD-2024-003
 * user_id         UUID REFERENCES users(id)
 * user_name       VARCHAR(100)
 * locked_at       TIMESTAMP NOT NULL DEFAULT now()
 * expires_at      TIMESTAMP NOT NULL                    -- locked_at + 15 min
 * session_id      VARCHAR(100)
 * UNIQUE (resource_type, resource_id)
 *
 * -- cleanup job: DELETE FROM resource_locks WHERE expires_at < now()
 *
 * INDEX: resource_locks(resource_type, resource_id), resource_locks(expires_at)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XIX. دعم المشتركين (Support داخل التطبيق — بين المشترك والمالك)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * ملاحظة: هذه الجداول موجودة في قاعدة بيانات المنصة (platform DB)
 * وليس في قاعدة بيانات كل مشترك — راجع القسم I أعلاه
 * (owner_support_tickets, owner_support_messages, owner_support_attachments)
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XX. ملخص الفجوات الحالية في البيانات الوهمية (GAP ANALYSIS)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * الحقول الموجودة في الواجهة لكن غير موثقة/مخزنة في الـ Mock حالياً:
 *
 * ① products:
 *    - barcode                 ← يظهر في ProductForm
 *    - description_ar/fr       ← يظهر في ProductDetail
 *    - weight_kg               ← يستخدم في RoadInvoiceForm (mockLines.weight)
 *    - purchase_price          ← يظهر في ProductDetail و purchaseProducts.price
 *    - tax_rate                ← موجود في purchaseProducts لكن غير في mockProducts
 *    - default_supplier_id     ← يظهر في ProductForm
 *    - image_urls[]            ← يظهر في ProductForm (CloudUploadIcon)
 *
 * ② orders:
 *    - price_list_id           ← يظهر في OrderDetail (priceListName)
 *    - discount_pct            ← يظهر في NewOrder (max_discount_pct للمستخدم)
 *    - subtotal / tax / total  ← تُحسب في NewOrder لكن غير محفوظة
 *    - warehouse_id            ← يظهر في NewOrder
 *    - order_lines.unit        ← موجود في بيانات الطلبيات
 *
 * ③ customers:
 *    - email                   ← موجود في suppliers لكن غائب عن mockCustomers
 *    - legal_name              ← موجود في suppliers لكن غائب عن mockCustomers
 *    - tax_number / RC / NIS   ← غائبة عن mockCustomers (موجودة في suppliers)
 *    - price_list_id           ← يُعين من صفحة PriceLists (assignedIds)
 *    - credit_limit            ← لا يوجد حالياً
 *    - notes                   ← لا يوجد في mockCustomers
 *
 * ④ payments:
 *    - مضمنة كمصفوفة في customers/suppliers → يجب نقلها لجدول مستقل
 *    - reference_no (رقم الشيك/التحويل) غير موثق
 *    - linked_order_id / linked_purchase_id غير موثقة
 *
 * ⑤ road_invoices:
 *    - vehicle_plate           ← يظهر في RoadInvoiceForm
 *    - driver_phone            ← يظهر في RoadInvoiceForm
 *    - total_weight_kg         ← يُحسب من mockLines.weight
 *    - road_invoice_orders[]   ← علاقة many-to-many مع orders (pivot table)
 *
 * ⑥ manufacturing:
 *    - manufacturing_quality_checks → يجب أن يكون جدولاً منفصلاً لدعم فحوصات متعددة
 *    - manufacturing_timeline.actor_id → UUID وليس string فقط
 *
 * ⑦ accounting_settings:
 *    - الحسابات الافتراضية (receivable / payable / cash / tax) غير موثقة في الـ mock
 *    - مفاتيح القيود التلقائية (auto_journal_on_*) موجودة في AccountingSettings.js
 *      لكن غير في mockData.js
 *
 * ⑧ audit_logs:
 *    - ip_address / session_id ← غائبة عن mockLogs
 *    - old_values / new_values JSONB ← موجودة كـ details{} في mockLogs ✓
 *
 * ⑨ product_favorites:
 *    - يُخزن حالياً في localStorage عبر useProductFavorites hook
 *    - يجب نقله لجدول product_favorites في قاعدة البيانات
 *
 * ⑩ stock_movements:
 *    - لا يوجد جدول حركات مخزون في الـ mock حالياً
 *    - كل التحويلات تُعدل stock_lines مباشرة بدون سجل
 */

// ══════════════════════════════════════════════════════════════════════════════
//  XXI. قواعد العمل المهمة (Business Rules)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * ① حل الأسعار (Price Resolution):
 *    function resolvePrice(product, priceListId, kind):
 *      1. ابحث في price_list_items عن (priceListId, product.id) → إن وجد وunitPrice > 0 → استخدمه
 *      2. عد للسعر الرئيسي product.price
 *
 * ② حل صلاحيات المستخدم:
 *    function hasPermission(userId, code):
 *      1. ابحث في user_permissions عن (userId, code) → إن وجد → أرجع granted
 *      2. ابحث في role_permissions عن (user.role, code) → إن وجد → TRUE
 *      3. أرجع FALSE
 *
 * ③ حساب رصيد الزبون/المورد:
 *    balance = total_amount - paid_amount + opening_balance
 *    (양수 = مديون لنا | سالب = نحن مدينون له)
 *
 * ④ إتاحة المخزون:
 *    available = on_hand - reserved
 *    (pending يُضاف عند الاستلام الفعلي)
 *
 * ⑤ تسلسل حالات الطلبية:
 *    draft → submitted → under_review → confirmed → shipped → completed
 *    أي حالة → cancelled | rejected
 *
 * ⑥ تسلسل حالات التصنيع:
 *    draft → approved → queued → in_production → quality_check → ready_to_ship → in_transit → received
 *    أي حالة قبل in_production → cancelled
 *
 * ⑦ Multi-tenant isolation:
 *    كل مشترك له schema منفصل في PostgreSQL
 *    جميع الجداول في هذا الملف (عدا القسم I) تُنشأ داخل schema المشترك
 *    الاتصال يتم عبر: SET search_path = tenant_{uuid_prefix}
 */
