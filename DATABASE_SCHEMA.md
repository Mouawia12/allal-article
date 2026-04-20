# مخطط قاعدة البيانات — ALLAL-ARTICLE

> آخر تحديث: 2026-04-20  
> قاعدة البيانات المعتمدة: PostgreSQL  
> الباك إند المستقبلي: Spring Boot 3.x + Java 21  
> الميغريشن: Flyway

---

## جداول المستخدمين والصلاحيات

### `users`
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(150) NOT NULL
email           VARCHAR(200) UNIQUE NOT NULL
password_hash   TEXT NOT NULL
role            ENUM('owner','admin','salesperson','view_only') NOT NULL
user_type       ENUM('admin_user','seller') DEFAULT 'seller'  -- يحدد واجهة إضافة الطلبية
phone           VARCHAR(20)
avatar_url      TEXT
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### `permissions`
```sql
id              SERIAL PRIMARY KEY
user_id         INT REFERENCES users(id)
permission_key  VARCHAR(100) NOT NULL   -- مثال: orders.create, orders.confirm, reports.view
granted         BOOLEAN DEFAULT true
```

---

## جدول الولايات

### `wilayas`
```sql
id              SERIAL PRIMARY KEY
code            VARCHAR(3) NOT NULL UNIQUE   -- "01" إلى "58"
name_ar         VARCHAR(100) NOT NULL
name_fr         VARCHAR(100)
is_active       BOOLEAN DEFAULT true
updated_at      TIMESTAMP DEFAULT NOW()
updated_by      VARCHAR(50)                  -- 'ai' أو 'manual'
```

---

## جداول الزبائن

### `customers`
```sql
id                  SERIAL PRIMARY KEY
name                VARCHAR(200) NOT NULL
phone               VARCHAR(20)
phone2              VARCHAR(20)
email               VARCHAR(200)
wilaya_id           INT REFERENCES wilayas(id)
address             TEXT
shipping_route      VARCHAR(200)          -- مسار الشحن (مثال: وهران - الساحل)
opening_balance     DECIMAL(15,2) DEFAULT 0  -- الرصيد الافتتاحي
salesperson_id      INT REFERENCES users(id)
status              ENUM('active','inactive') DEFAULT 'active'
notes               TEXT
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### `customer_payments`
```sql
id                  SERIAL PRIMARY KEY
customer_id         INT REFERENCES customers(id)
amount              DECIMAL(15,2) NOT NULL
direction           ENUM('in','out') NOT NULL   -- in: استلام / out: إرجاع
payment_method      ENUM('cash','bank','cheque') NOT NULL
reference_number    VARCHAR(100)               -- رقم الشيك أو التحويل
received_by         INT REFERENCES users(id)   -- من استلم (موظف الشركة)
payer_name          VARCHAR(200)               -- من دفع / استلم من الزبائن
payment_date        DATE NOT NULL
notes               TEXT
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
```

---

## جداول الأصناف

### `products`
```sql
id                  SERIAL PRIMARY KEY
code                VARCHAR(100) UNIQUE NOT NULL
name                VARCHAR(200) NOT NULL
category            VARCHAR(100)
unit                VARCHAR(50)              -- قطعة، متر، لفة...
weight_per_unit     DECIMAL(10,4)            -- وزن القطعة الواحدة بالكغ
units_per_package   INT DEFAULT 1            -- عدد القطع في العلبة/الكرطون
package_unit        VARCHAR(50) DEFAULT 'علبة'  -- علبة، كرطون، ساشيه...
price               DECIMAL(15,2)
min_stock           INT DEFAULT 0
image_url           TEXT
description         TEXT
is_active           BOOLEAN DEFAULT true
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### `product_price_history`
```sql
id                  SERIAL PRIMARY KEY
product_id          INT REFERENCES products(id)
old_price           DECIMAL(15,2)
new_price           DECIMAL(15,2)
changed_by          INT REFERENCES users(id)
changed_at          TIMESTAMP DEFAULT NOW()
reason              TEXT
```

### `stock_movements`
```sql
id                  SERIAL PRIMARY KEY
product_id          INT REFERENCES products(id)
movement_type       ENUM('in','out','reserved','released','adjustment')
quantity            INT NOT NULL
reference_type      VARCHAR(50)   -- 'order', 'purchase', 'return', 'adjustment'
reference_id        INT
notes               TEXT
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
```

---

## جداول الطلبيات

### `orders`
```sql
id                  SERIAL PRIMARY KEY
order_number        VARCHAR(50) UNIQUE NOT NULL   -- ORD-2024-001
customer_id         INT REFERENCES customers(id)
salesperson_id      INT REFERENCES users(id)
status              ENUM('draft','submitted','under_review','confirmed','partially_fulfilled','fulfilled','cancelled','rejected')
shipping_status     ENUM('pending','in_transit','delivered') DEFAULT 'pending'
notes               TEXT
admin_note          TEXT                         -- ملاحظة الإدارة عند التأكيد/الرفض
total_weight        DECIMAL(10,2)                -- وزن إجمالي الطلبية (كغ)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
confirmed_at        TIMESTAMP
confirmed_by        INT REFERENCES users(id)
rejected_at         TIMESTAMP
rejected_by         INT REFERENCES users(id)
```

### `order_lines`
```sql
id                  SERIAL PRIMARY KEY
order_id            INT REFERENCES orders(id)
product_id          INT REFERENCES products(id)
requested_qty       INT NOT NULL
approved_qty        INT DEFAULT 0
shipped_qty         INT DEFAULT 0
cancelled_qty       INT DEFAULT 0
unit_price          DECIMAL(15,2)
line_weight         DECIMAL(10,3)               -- وزن هذا السطر = qty × weight_per_unit
status              ENUM('pending','approved','modified','partially_allocated','allocated','cancelled','deleted_by_admin')
will_ship           BOOLEAN DEFAULT true
notes               TEXT
deleted_at          TIMESTAMP                    -- NULL = لم يُحذف (السطر يبقى دائماً)
modified_by         INT REFERENCES users(id)
modified_at         TIMESTAMP
```

### `order_activity_log`
```sql
id                  SERIAL PRIMARY KEY
order_id            INT REFERENCES orders(id)
user_id             INT REFERENCES users(id)
action              TEXT NOT NULL
details             JSONB
created_at          TIMESTAMP DEFAULT NOW()
```

---

## جداول المرتجعات

### `returns`
```sql
id                  SERIAL PRIMARY KEY
return_number       VARCHAR(50) UNIQUE NOT NULL
order_id            INT REFERENCES orders(id)
customer_id         INT REFERENCES customers(id)
driver_id           INT REFERENCES users(id)     -- السائق الذي شحن المرتجع
received_by         INT REFERENCES users(id)     -- من استلمه في الإدارة
return_date         DATE NOT NULL
notes               TEXT
status              ENUM('pending','received','cancelled') DEFAULT 'pending'
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
```

### `return_lines`
```sql
id                  SERIAL PRIMARY KEY
return_id           INT REFERENCES returns(id)
order_line_id       INT REFERENCES order_lines(id)
product_id          INT REFERENCES products(id)
returned_qty        INT NOT NULL                  -- لا يتجاوز approved_qty
notes               TEXT
```

---

## جداول المشتريات

### `purchase_orders`
```sql
id                  SERIAL PRIMARY KEY
po_number           VARCHAR(50) UNIQUE NOT NULL   -- PUR-2024-001
supplier_name       VARCHAR(200) NOT NULL
supplier_id         INT                           -- مرجع جدول الموردين (مستقبلاً)
status              ENUM('pending','confirmed','received','cancelled')
payment_status      ENUM('unpaid','partial','paid') DEFAULT 'unpaid'
expected_date       DATE
received_date       DATE
received_by         INT REFERENCES users(id)
total_amount        DECIMAL(15,2)
notes               TEXT
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### `purchase_order_lines`
```sql
id                  SERIAL PRIMARY KEY
po_id               INT REFERENCES purchase_orders(id)
product_id          INT REFERENCES products(id)
ordered_qty         INT NOT NULL
received_qty        INT DEFAULT 0
unit_price          DECIMAL(15,2)
notes               TEXT
```

---

## جداول فواتير الطريق

### `road_invoices`
```sql
id                  SERIAL PRIMARY KEY
invoice_number      VARCHAR(50) UNIQUE NOT NULL   -- FTR-2024-001
invoice_date        DATE NOT NULL
wilaya_id           INT REFERENCES wilayas(id)
customer_id         INT REFERENCES customers(id)
driver_id           INT REFERENCES users(id)
status              ENUM('draft','sent','delivered','cancelled') DEFAULT 'draft'
total_weight        DECIMAL(10,2)               -- كغ
notes               TEXT
print_count         INT DEFAULT 0
last_printed_at     TIMESTAMP
last_printed_by     INT REFERENCES users(id)
whatsapp_sent_at    TIMESTAMP
created_by          INT REFERENCES users(id)
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

### `road_invoice_lines`
```sql
id                  SERIAL PRIMARY KEY
invoice_id          INT REFERENCES road_invoices(id)
product_id          INT REFERENCES products(id)
quantity            INT NOT NULL
unit_price          DECIMAL(15,2)
line_weight         DECIMAL(10,3)
notes               TEXT
```

### `road_invoice_orders`
```sql
-- رابط M:M بين فاتورة الطريق والطلبيات المصدر
id                  SERIAL PRIMARY KEY
invoice_id          INT REFERENCES road_invoices(id)
order_id            INT REFERENCES orders(id)
```

### `road_invoice_wilaya_defaults`
-- إعداد الزبون التلقائي لكل ولاية
```sql
id                  SERIAL PRIMARY KEY
wilaya_id           INT REFERENCES wilayas(id) UNIQUE
customer_id         INT REFERENCES customers(id)
updated_by          INT REFERENCES users(id)
updated_at          TIMESTAMP DEFAULT NOW()
```

---

## جداول الإعدادات

### `system_settings`
```sql
key                 VARCHAR(200) PRIMARY KEY
value               TEXT
updated_by          INT REFERENCES users(id)
updated_at          TIMESTAMP DEFAULT NOW()
```

*مثال على المفاتيح:*
- `ai.provider` → `openai`
- `ai.openai_model` → `gpt-4o`
- `company.name` → `شركة علال للتجارة`
- `company.logo_url` → `...`

---

## جداول المساعدة

### `drivers` (اختياري — أو يُستخدم جدول users بدور driver)
```sql
id                  SERIAL PRIMARY KEY
name                VARCHAR(150) NOT NULL
phone               VARCHAR(20)
vehicle_info        TEXT
is_active           BOOLEAN DEFAULT true
```

### `audit_logs`
```sql
id                  SERIAL PRIMARY KEY
user_id             INT REFERENCES users(id)
action              VARCHAR(200) NOT NULL
entity_type         VARCHAR(100)              -- 'order', 'customer', 'product'...
entity_id           INT
old_values          JSONB
new_values          JSONB
ip_address          VARCHAR(50)
created_at          TIMESTAMP DEFAULT NOW()
```

---

## العلاقات الرئيسية

```
customers ─── customer_payments (1:N)
customers ─── orders (1:N)
orders ─── order_lines (1:N)
orders ─── returns (1:N)
returns ─── return_lines (1:N)
orders ─── road_invoice_orders (M:N) ─── road_invoices
road_invoices ─── road_invoice_lines (1:N)
road_invoices ─── wilayas (N:1)
wilayas ─── road_invoice_wilaya_defaults (1:1)
products ─── order_lines (1:N)
products ─── purchase_order_lines (1:N)
products ─── stock_movements (1:N)
users ─── orders (salesperson, 1:N)
users ─── customer_payments (received_by, 1:N)
```

---

---

## جداول المحاسبة

> **ملاحظة:** المحاسبة ستُطبَّق في الباك إند (Spring Boot). الجداول التالية نهائية ومعتمدة.

### `fiscal_years` — السنوات المالية
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL           -- "السنة المالية 2025"
start_date      DATE NOT NULL
end_date        DATE NOT NULL
is_closed       BOOLEAN DEFAULT false
closed_at       TIMESTAMP
closed_by       INT REFERENCES users(id)
close_reason    TEXT
created_by      INT REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
```

### `accounting_periods` — الفترات الشهرية
```sql
id              SERIAL PRIMARY KEY
fiscal_year_id  INT REFERENCES fiscal_years(id) NOT NULL
period_number   SMALLINT NOT NULL               -- 1..12
start_date      DATE NOT NULL
end_date        DATE NOT NULL
is_closed       BOOLEAN DEFAULT false
closed_at       TIMESTAMP
closed_by       INT REFERENCES users(id)
```

### `accounts` — شجرة الحسابات
```sql
id              SERIAL PRIMARY KEY
code            VARCHAR(20) UNIQUE NOT NULL
name_ar         VARCHAR(200) NOT NULL
name_en         VARCHAR(200)
parent_id       INT REFERENCES accounts(id)
level           SMALLINT NOT NULL DEFAULT 1
path            VARCHAR(500)                    -- materialized path: "1/10/100"
classification  VARCHAR(20) NOT NULL            -- asset|liability|equity|revenue|expense
normal_balance  VARCHAR(10) NOT NULL            -- debit|credit
is_postable     BOOLEAN DEFAULT true            -- false = حساب أب فقط
is_control      BOOLEAN DEFAULT false           -- true = يتطلب sub-ledger
is_active       BOOLEAN DEFAULT true
sort_order      INT DEFAULT 0
created_by      INT REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

### `journals` — رؤوس القيود
```sql
id              SERIAL PRIMARY KEY
journal_number  VARCHAR(50) UNIQUE NOT NULL     -- JRN-2025-001
fiscal_year_id  INT REFERENCES fiscal_years(id) NOT NULL
period_id       INT REFERENCES accounting_periods(id)
journal_date    DATE NOT NULL
type            VARCHAR(20) NOT NULL            -- manual|auto|opening|closing
source          VARCHAR(30)                     -- sale|purchase|payment|return|opening|manual
source_ref_type VARCHAR(50)                     -- 'order'|'customer_payment'|'purchase_order'
source_ref_id   INT
status          VARCHAR(20) DEFAULT 'draft'     -- draft|posted|reversed|void
description     TEXT
total_debit     DECIMAL(18,4) DEFAULT 0
total_credit    DECIMAL(18,4) DEFAULT 0
reversed_by_id  INT REFERENCES journals(id)     -- إذا كان هذا عكس قيد آخر
created_by      INT REFERENCES users(id)
posted_at       TIMESTAMP
posted_by       INT REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

-- INDEX: (fiscal_year_id, journal_date)
-- INDEX: (source_ref_type, source_ref_id)
-- INDEX: (status)
```

### `journal_lines` — أسطر القيود
```sql
id              SERIAL PRIMARY KEY
journal_id      INT REFERENCES journals(id) NOT NULL
account_id      INT REFERENCES accounts(id) NOT NULL
debit           DECIMAL(18,4) DEFAULT 0
credit          DECIMAL(18,4) DEFAULT 0
description     TEXT
sub_ledger_type VARCHAR(30)                     -- 'customer'|'supplier'|null
sub_ledger_id   INT                             -- customer_id أو supplier_id
sort_order      SMALLINT DEFAULT 0

-- CONSTRAINT: CHECK (debit = 0 OR credit = 0)   -- لا يجمع مدين ودائن في نفس السطر
-- CONSTRAINT: CHECK (debit >= 0 AND credit >= 0)
-- INDEX: (journal_id)
-- INDEX: (account_id, journal_id)
-- INDEX: (sub_ledger_type, sub_ledger_id)
```

### `opening_balances` — الأرصدة الافتتاحية
```sql
id              SERIAL PRIMARY KEY
fiscal_year_id  INT REFERENCES fiscal_years(id) NOT NULL
account_id      INT REFERENCES accounts(id) NOT NULL
debit_balance   DECIMAL(18,4) DEFAULT 0
credit_balance  DECIMAL(18,4) DEFAULT 0
notes           TEXT
created_by      INT REFERENCES users(id)
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

UNIQUE (fiscal_year_id, account_id)
```

### `accounting_settings` — ربط الحسابات التلقائي
```sql
key             VARCHAR(100) PRIMARY KEY        -- sales_revenue|cogs|inventory|cash|bank...
account_id      INT REFERENCES accounts(id)
label           VARCHAR(200)
updated_by      INT REFERENCES users(id)
updated_at      TIMESTAMP DEFAULT NOW()
```

*مفاتيح الإعدادات:*
- `sales_revenue` → حساب إيرادات المبيعات
- `sales_returns` → مردودات المبيعات
- `cogs` → تكلفة البضاعة المباعة
- `inventory` → حساب المخزون
- `customers_control` → ذمم العملاء (رقابي)
- `suppliers_control` → ذمم الموردين (رقابي)
- `cash` → الصندوق
- `bank` → الحساب البنكي
- `tax_payable` → ضرائب ورسوم
- `retained_earnings` → الأرباح المرحلة
- `current_year_profit` → أرباح السنة الحالية
- `discount_given` → خصم ممنوح

### `year_close_runs` — سجل عمليات إغلاق السنة
```sql
id              SERIAL PRIMARY KEY
fiscal_year_id  INT REFERENCES fiscal_years(id) NOT NULL
run_at          TIMESTAMP DEFAULT NOW()
run_by          INT REFERENCES users(id)
status          VARCHAR(20)                     -- success|failed|partial
closing_journal_id   INT REFERENCES journals(id)   -- قيد الإقفال المولّد
opening_journal_id   INT REFERENCES journals(id)   -- قيد الأرصدة الافتتاحية المولّد
notes           TEXT
```

### `fiscal_year_audit_log` — سجل تدقيق السنوات المالية
```sql
id              SERIAL PRIMARY KEY
fiscal_year_id  INT REFERENCES fiscal_years(id) NOT NULL
action          VARCHAR(50) NOT NULL            -- closed|reopened|period_closed
user_id         INT REFERENCES users(id)
reason          TEXT
performed_at    TIMESTAMP DEFAULT NOW()
ip_address      VARCHAR(50)
```

---

## العلاقات المحاسبية الرئيسية
```
fiscal_years ─── accounting_periods (1:N)
fiscal_years ─── journals (1:N)
fiscal_years ─── opening_balances (1:N)
accounts ─── accounts (parent_id, self-ref tree)
accounts ─── journal_lines (1:N)
accounts ─── opening_balances (1:N)
journals ─── journal_lines (1:N)
journals ─── year_close_runs (closing/opening journal)
orders ─── journals (source_ref_type='order', 1:1 auto)
customer_payments ─── journals (source_ref_type='customer_payment', 1:1 auto)
purchase_orders ─── journals (source_ref_type='purchase_order', 1:1 auto)
```

---

## قواعد التصميم المحاسبي

1. **الترحيل على الحسابات** — فقط على حسابات `is_postable=true`؛ الحسابات الأب لا تُرحَّل مباشرة
2. **الحسابات الرقابية** — `is_control=true` لحسابات العملاء والموردين؛ كل سطر يرتبط بـ `sub_ledger_id`
3. **القيود المتوازنة** — `SUM(debit) = SUM(credit)` إلزامي قبل أي ترحيل (تُطبَّق في backend)
4. **السنة المغلقة** — لا يُسمح بأي CRUD على القيود داخل سنة `is_closed=true` (constraint في الباك إند)
5. **عكس القيد** — بدلاً من الحذف: ينشئ قيداً جديداً عكسياً مع ربط `reversed_by_id`
6. **الترقيم التلقائي** — `journal_number` يُولَّد تلقائياً بدالة أو sequence (JRN-YYYY-NNNN)
7. **DECIMAL(18,4)** — لكل الأرصدة والمبالغ المالية؛ لا float أو double
8. **materialized_path** — `path` يُسهّل استعلامات subtree دون recursion (مثال: "1/10/100")

---

## ملاحظات التصميم

1. **السطور لا تُحذف فعلياً** — حقل `deleted_at` فقط، يبقى السطر مرئياً دائماً
2. **رصيد الزبون محسوب** — ليس حقل مخزّن بل يُحسب: `SUM(orders.total) - SUM(payments.in) + opening_balance - SUM(payments.out)`
3. **الوزن في الطلبيات** — يُحسب من `products.weight_per_unit × order_lines.requested_qty`
4. **الولايات قابلة للتحديث** — جدول منفصل مع تاريخ وسبب التحديث (يدوي أو AI)
5. **سجل الأسعار** — كل تغيير في سعر الصنف يُسجل في `product_price_history`
6. **فاتورة الطريق** — يمكن إنشاؤها من طلبية واحدة أو أكثر، مع علاقة M:N عبر `road_invoice_orders`
