# PORT REGISTRY NOTE

> هذا المشروع موثق في السجل المركزي للمنافذ.

## السجل المركزي

**الملف:** `/Users/mw/Downloads/DEV_PORT_REGISTRY.md`

## منافذ هذا المشروع

| الخدمة | المنفذ | أمر التشغيل |
|--------|:------:|-------------|
| Spring Boot Backend (Java) | **8080** | `./mvnw spring-boot:run` |
| React Frontend (CRA) | **3003** | `PORT=3003 npm start` |
| PostgreSQL (Docker) | **5432** | `docker-compose up` |

## تحذير

- المنفذ **8080** محجوز لـ Spring Boot — لا تشغّل Laravel أو Vite عليه.
- المنفذ **3003** محجوز للـ frontend — استخدم `PORT=3003 npm start` دائماً.
