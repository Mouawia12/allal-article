# مخطط قاعدة البيانات — ALLAL-ARTICLE

> آخر تحديث: 2026-04-20  
> قاعدة البيانات المقترحة: PostgreSQL

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

## ملاحظات التصميم

1. **السطور لا تُحذف فعلياً** — حقل `deleted_at` فقط، يبقى السطر مرئياً دائماً
2. **رصيد الزبون محسوب** — ليس حقل مخزّن بل يُحسب: `SUM(orders.total) - SUM(payments.in) + opening_balance - SUM(payments.out)`
3. **الوزن في الطلبيات** — يُحسب من `products.weight_per_unit × order_lines.requested_qty`
4. **الولايات قابلة للتحديث** — جدول منفصل مع تاريخ وسبب التحديث (يدوي أو AI)
5. **سجل الأسعار** — كل تغيير في سعر الصنف يُسجل في `product_price_history`
6. **فاتورة الطريق** — يمكن إنشاؤها من طلبية واحدة أو أكثر، مع علاقة M:N عبر `road_invoice_orders`
