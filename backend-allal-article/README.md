# ALLAL-ARTICLE Backend

Spring Boot backend skeleton organized as a modular monolith.

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
