# ALLAL-ARTICLE — Spring Boot Backend Architecture Study

> قرار معماري مبدئي لمرحلة الباك اند المستقبلية.  
> الهدف من هذا الملف أن يكون مرجعًا مباشرًا لـ Claude Code عند استلام ملفات الباك اند لاحقًا.

## القرار النهائي المقترح

- الباك اند: `Spring Boot 3.x`
- اللغة: `Java 21`
- قاعدة البيانات: `PostgreSQL`
- إدارة الميغريشن: `Flyway`
- الأمان: `Spring Security`
- أسلوب التوثيق: `OpenAPI / Swagger`
- الكاش والمهام الخلفية: `Redis` لاحقًا عند الحاجة
- النشر: `Docker Compose` في البداية، ثم يمكن التوسع لاحقًا

## لماذا Spring Boot لهذا المشروع

هذا المشروع أقرب إلى ERP داخلي وليس CRUD بسيط. النظام يحتوي على:

- طلبيات بحالات متعددة.
- أسطر طلبية قابلة للتعديل مع حفظ الأثر.
- مخزون وحجوزات وحركات.
- زبائن وأرصدة ومدفوعات داخلة وخارجة.
- مشتريات وفواتير طريق ومرتجعات.
- صلاحيات دقيقة بين البائع والإدارة والمالك.
- طباعة وتقارير وإرسال PDF عبر واتساب.
- سجل عمليات Audit لكل تغيير حساس.

Spring Boot مناسب لهذا النوع لأنه قوي في:

- `Transactions`
- `Security`
- `Validation`
- `Service Layer`
- `Testing`
- التكامل مع PostgreSQL و Flyway
- بناء نظام طويل العمر ومنظم.

## أسلوب البناء المطلوب

لا يبدأ المشروع كـ microservices.  
الاختيار الصحيح هو:

```text
Modular Monolith
```

أي مشروع Spring Boot واحد، لكنه مقسم داخليًا إلى modules واضحة. هذا يقلل التعقيد ويترك الباب مفتوحًا لفصل خدمات مستقلة لاحقًا مثل الطباعة أو WhatsApp أو AI.

## الوحدات المقترحة

```text
auth
users
customers
products
inventory
orders
returns
purchases
roadinvoices
payments
reports
printing
whatsapp
settings
audit
ai
```

كل وحدة يجب أن تكون منظمة حول الدومين وليس حول نوع الملف فقط.

مثال:

```text
com.allal.article.orders
  api
  application
  domain
  infrastructure
```

## الطبقات القياسية

- `Controller`: استقبال HTTP فقط، بدون منطق عمل ثقيل.
- `Request DTO`: مدخلات الفرونت مع validation.
- `Response DTO`: مخرجات API للفرونت.
- `Service / UseCase`: منطق العمل الحقيقي.
- `Repository`: الوصول للبيانات.
- `Entity`: تمثيل الجداول.
- `Policy / Security`: التحقق من الصلاحيات.
- `Event`: إشعارات داخلية عند حدوث تغييرات مهمة.
- `Job`: مهام خلفية لاحقًا للطباعة، واتساب، AI.

## قواعد قاعدة البيانات

- PostgreSQL هو الاختيار الرسمي.
- لا يتم الاعتماد على `spring.jpa.hibernate.ddl-auto=update`.
- في التطوير والإنتاج يجب استعمال Flyway migrations.
- في الإنتاج يفضل:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

- كل تعديل schema يكون migration جديد.
- لا يتم تعديل migration قديم بعد تطبيقه.
- يجب أخذ backup قبل migrations الكبيرة في الإنتاج.

## قواعد مهمة للدومين

### الطلبيات

- البائع ينشئ طلبية بحالة `draft` أو `submitted`.
- الإدارة فقط تؤكد الطلبية إلى `confirmed`.
- السطور المحذوفة إداريًا لا تحذف فعليًا.
- كل تعديل في طلبية مؤكدة أو قيد المراجعة يجب أن ينتج سجل audit/event.

### المخزون

- لا تجعل رقم المخزون في جدول المنتجات هو الحقيقة الوحيدة.
- الحقيقة الأساسية تكون من:
  - `stock_movements`
  - `stock_reservations`
  - جدول summary سريع للقراءة مثل `product_stocks`
- تأكيد الطلبية وحجز المخزون يجب أن يتم داخل `@Transactional`.
- عند حجز كميات يجب استخدام locking مناسب في PostgreSQL لمنع بيع نفس الكمية مرتين.

### المدفوعات ورصيد الزبون

- الرصيد لا يكون رقمًا يدويًا فقط.
- الأفضل بناء ledger:
  - opening balance
  - order debits
  - payment in
  - payment out
  - payment allocations
- توزيع المدفوعات على الطلبيات يجب أن يكون منظمًا وقابلًا للتتبع.

### فواتير الطريق

- فاتورة الطريق قد ترتبط بطلبية واحدة أو عدة طلبيات.
- اختيار عدة طلبيات يجب أن يتحقق من الولاية.
- الزبون التلقائي حسب الولاية يأتي من الإعدادات.
- دمج الأصناف يجب أن يحفظ أثر الأصناف الأصلية أو تفاصيل المصدر.

## Dependencies مبدئية في Spring Initializr

ابدأ بهذه:

```text
Spring Web
Spring Data JPA
PostgreSQL Driver
Flyway Migration
Spring Security
Validation
Spring Boot Actuator
Lombok
Springdoc OpenAPI
```

لاحقًا حسب الحاجة:

```text
Redis
Spring WebSocket
Spring Mail
RabbitMQ
Quartz أو Spring Batch
```

## قواعد API

- كل endpoints تكون تحت:

```text
/api/v1
```

- شكل الرد يجب أن يكون موحدًا قدر الإمكان:

```json
{
  "data": {},
  "message": "OK",
  "meta": {}
}
```

- الأخطاء يجب أن تكون واضحة:

```json
{
  "error": {
    "code": "ORDER_INVALID_STATUS",
    "message": "Cannot confirm this order from current status",
    "details": {}
  }
}
```

## الاختبارات

هذا المشروع يحتاج اختبارات حقيقية، خصوصًا في:

- تأكيد الطلبية.
- حجز المخزون.
- تعديل سطر طلبية.
- تسجيل دفعة.
- توزيع دفعة على طلبيات.
- إنشاء مرتجع.
- تحويل طلبية إلى فاتورة طريق.
- صلاحيات البائع مقابل الإدارة.

المطلوب لاحقًا:

```text
JUnit 5
Testcontainers PostgreSQL
Spring Security Tests
```

## النشر

المرحلة الأولى:

```text
Docker Compose
Spring Boot API
PostgreSQL
Redis
Nginx / reverse proxy
```

المطلوب لاحقًا:

- ملف `Dockerfile`.
- ملف `docker-compose.yml`.
- profile للتطوير و profile للإنتاج.
- backup يومي لقاعدة البيانات.
- مراقبة logs.

## تعليمات مهمة لـ Claude Code عند بدء الباك اند

عند إضافة مشروع الباك اند لاحقًا:

1. لا تستخدم `ddl-auto=update`.
2. أنشئ أول migration عبر Flyway.
3. ابدأ بـ users/roles/permissions ثم customers/products ثم inventory/orders.
4. لا تبني CRUD عشوائي قبل تثبيت الدومين والحالات.
5. استخدم DTOs ولا تعرض Entities مباشرة للفرونت.
6. أي عملية مالية أو مخزنية يجب أن تكون داخل `@Transactional`.
7. أي تعديل حساس يجب أن يكتب audit log.
8. حافظ على modular monolith ولا تبدأ microservices.
9. اربط React الحالي تدريجيًا ولا تعيد بناء الواجهة من الصفر.

