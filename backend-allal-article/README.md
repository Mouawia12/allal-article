# ALLAL-ARTICLE Backend

Spring Boot backend skeleton organized as a modular monolith.

## التشغيل المحلي

المشروع يعمل مباشرة على الجهاز بدون حاويات.

### المتطلبات

| الأداة | الإصدار | التثبيت |
|---|---|---|
| JDK | 21 | `brew install --cask temurin@21` |
| PostgreSQL | 16 | `brew install postgresql@16` |
| Node.js | 18+ | للفرونت اند فقط |

### أولًا: قاعدة البيانات

`postgresql@16` صيغة keg-only، أضف مسارها إلى `PATH` مرة واحدة:

```bash
echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc
```

ثم شغّل الخدمة (تعمل تلقائيًا عند كل إقلاع):

```bash
brew services start postgresql@16
```

أنشئ المستخدم وقاعدتي التطوير والاختبار مرة واحدة:

```bash
psql -d postgres -c "CREATE ROLE allal_user WITH LOGIN CREATEDB PASSWORD 'allal_pass@39';"
createdb -O allal_user allal_article
createdb -O allal_user allal_article_test
```

### ثانيًا: متغيرات البيئة

```bash
cp .env.example .env
```

عدّل `.env` عند الحاجة. الملف مستثنى من Git ولا يُرفع أبدًا.

يقرأه Spring Boot عبر الآلية المدمجة في `application.yaml`:

```yaml
spring:
  config:
    import: optional:file:.env[.properties]
```

هذه بديل `env_file` الذي كان يوفّره docker-compose، ولا تحتاج أي مكتبة
خارجية، وتعمل من سطر الأوامر ومن داخل IntelliJ و VS Code سواء بسواء.

> ⚠️ **لا تعرّف مفتاحًا بقيمة فارغة.** القيمة الفارغة تتجاوز القيمة
> الافتراضية في `application.yaml` وقد تمنع الإقلاع — مثال: ترك
> `R2_ACCESS_KEY_ID=` فارغًا يُفشل بناء عميل التخزين. اترك المفاتيح
> الاختيارية معلّقة بـ `#` حتى تضع لها قيمة حقيقية.

### ثالثًا: تشغيل الباك اند

```bash
./mvnw spring-boot:run
```

يعمل على المنفذ **8080**. Flyway يطبّق الميغريشن تلقائيًا عند أول تشغيل.

### الاختبارات

```bash
./mvnw test
```

الاختبارات تستخدم قاعدة `allal_article_test` المنفصلة عبر بروفايل `test`،
ولا تمسّ بيانات التطوير.

### أوامر إدارة قاعدة البيانات

```bash
brew services stop postgresql@16      # إيقاف
brew services restart postgresql@16   # إعادة تشغيل
psql -d allal_article                 # فتح الصدفة
```

## Package Root

`com.allalarticle.backend`

## Structure

```text
com.allalarticle.backend
├── common
│   ├── exception
│   └── response
├── config
├── security
├── auth
├── users
├── roles
├── customers
├── products
├── inventory
├── orders
├── invoices
├── returns
├── payments
├── reports
├── attachments
│   └── storage
├── audit
└── settings
```

Each business module should grow around the domain first. Add subpackages such
as `controller`, `service`, `dto`, `entity`, `repository`, `mapper`, `enums`,
`exception`, `validation`, `event`, `facade`, and `specification` only when the
module actually needs them.

## Current Scope

This backend currently contains only the project structure and shared skeletons.
It intentionally does not implement full authentication, CRUD flows, business
logic, migrations, Cloudflare R2 integration, WhatsApp, or AI integrations.

Files and attachments are planned as external assets. The `attachments` module
will store metadata and object-storage references only; provider-specific storage
code should remain behind an internal abstraction.
