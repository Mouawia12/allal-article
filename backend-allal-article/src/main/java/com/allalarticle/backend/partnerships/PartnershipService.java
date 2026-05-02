package com.allalarticle.backend.partnerships;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnershipService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_SEGMENT_LENGTH = 4;
    private static final TypeReference<Map<String, Object>> JSON_MAP = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public Map<String, Object> summary() {
        Long tenantId = currentTenantId();
        return Map.of(
                "activePartnerships", activePartnerships(tenantId),
                "pendingApprovals", pendingApprovals(tenantId),
                "inviteCodes", inviteCodes(tenantId),
                "pendingRequests", pendingRequests(tenantId));
    }

    @Transactional
    public Map<String, Object> createInviteCode(Map<String, Object> body) {
        Long tenantId = currentTenantId();
        Map<String, Object> payload = body != null ? body : Map.of();
        String code = generateInviteCode();
        Map<String, Object> permissions = permissionsFrom(payload.get("permissions"));
        String label = textOrNull(payload.get("label"));
        Integer maxUses = integerOrNull(payload.get("maxUses"));
        if (maxUses != null && maxUses < 1) {
            throw new AppException(ErrorCode.BAD_REQUEST, "عدد الاستخدامات يجب أن يكون أكبر من صفر", HttpStatus.BAD_REQUEST);
        }
        String expiresAt = textOrNull(payload.get("expiresAt"));

        Long id = jdbc.queryForObject(
                """
                insert into platform.tenant_invite_codes
                  (provider_tenant_id, code_hash, label, permissions_json, max_uses, expires_at)
                values (?, ?, ?, ?::jsonb, ?, nullif(?, '')::timestamptz)
                returning id
                """,
                Long.class,
                tenantId,
                hashCode(code),
                label,
                toJson(permissions),
                maxUses,
                expiresAt);

        return Map.of(
                "id", id,
                "code", code,
                "label", label != null ? label : "",
                "permissions", permissions,
                "maxUses", maxUses != null ? maxUses : "",
                "expiresAt", expiresAt != null ? expiresAt : "");
    }

    @Transactional
    public Map<String, Object> submitRequest(Map<String, Object> body) {
        Long requesterTenantId = currentTenantId();
        Map<String, Object> payload = body != null ? body : Map.of();
        String code = normalizeCode(textOrNull(payload.get("code")));
        if (code == null) {
            throw new AppException(ErrorCode.BAD_REQUEST, "كود الربط مطلوب", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> invite;
        try {
            invite = jdbc.queryForMap(
                    """
                    select id, provider_tenant_id, permissions_json::text as permissions_json
                    from platform.tenant_invite_codes
                    where code_hash = ?
                      and is_active = true
                      and (expires_at is null or expires_at > now())
                      and (max_uses is null or uses_count < max_uses)
                    """,
                    hashCode(code));
        } catch (EmptyResultDataAccessException e) {
            throw new AppException(ErrorCode.NOT_FOUND, "كود الربط غير صالح أو منتهي", HttpStatus.NOT_FOUND);
        }

        Long inviteId = longValue(invite.get("id"));
        Long providerTenantId = longValue(invite.get("provider_tenant_id"));
        if (providerTenantId.equals(requesterTenantId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "لا يمكن استعمال كود صادر من نفس المشترك", HttpStatus.BAD_REQUEST);
        }

        Map<String, Object> permissions = readJsonMap((String) invite.get("permissions_json"));
        String message = textOrNull(payload.get("message"));

        try {
            Long id = jdbc.queryForObject(
                    """
                    insert into platform.tenant_partnerships
                      (provider_tenant_id, requester_tenant_id, invite_code_id, status,
                       permissions_json, requested_message)
                    values (?, ?, ?, 'pending', ?::jsonb, ?)
                    returning id
                    """,
                    Long.class,
                    providerTenantId,
                    requesterTenantId,
                    inviteId,
                    toJson(permissions),
                    message);

            jdbc.update(
                    "update platform.tenant_invite_codes set uses_count = uses_count + 1 where id = ?",
                    inviteId);

            return Map.of(
                    "id", id,
                    "status", "pending",
                    "providerTenantId", providerTenantId);
        } catch (DuplicateKeyException e) {
            throw new AppException(ErrorCode.CONFLICT, "يوجد طلب أو ربط سابق مع هذا المشترك", HttpStatus.CONFLICT);
        }
    }

    @Transactional
    public void approveRequest(Long id, Map<String, Object> body) {
        Long tenantId = currentTenantId();
        Map<String, Object> payload = body != null ? body : Map.of();
        Map<String, Object> permissions = permissionsFrom(payload.get("permissions"));
        String supplierDecision = textOrNull(payload.get("supplierLinkDecision"));
        String supplierStatus = switch (supplierDecision != null ? supplierDecision : "") {
            case "accepted" -> "confirmed";
            case "skipped" -> "skipped";
            default -> "none";
        };

        int updated = jdbc.update(
                """
                update platform.tenant_partnerships
                set status = 'active',
                    permissions_json = ?::jsonb,
                    supplier_match_status = ?,
                    supplier_match_reviewed_at = now(),
                    approved_at = now(),
                    revoked_at = null
                where id = ?
                  and provider_tenant_id = ?
                  and status = 'pending'
                """,
                toJson(permissions),
                supplierStatus,
                id,
                tenantId);
        if (updated == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "طلب الربط غير موجود", HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    public void rejectRequest(Long id) {
        Long tenantId = currentTenantId();
        int updated = jdbc.update(
                """
                update platform.tenant_partnerships
                set status = 'rejected'
                where id = ?
                  and provider_tenant_id = ?
                  and status = 'pending'
                """,
                id,
                tenantId);
        if (updated == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "طلب الربط غير موجود", HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    public void revokePartnership(Long id) {
        Long tenantId = currentTenantId();
        int updated = jdbc.update(
                """
                update platform.tenant_partnerships
                set status = 'revoked', revoked_at = now()
                where id = ?
                  and status = 'active'
                  and (provider_tenant_id = ? or requester_tenant_id = ?)
                """,
                id,
                tenantId,
                tenantId);
        if (updated == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "الربط غير موجود", HttpStatus.NOT_FOUND);
        }
    }

    @Transactional
    public void updatePermissions(Long id, Map<String, Object> body) {
        Long tenantId = currentTenantId();
        Map<String, Object> payload = body != null ? body : Map.of();
        Map<String, Object> permissions = permissionsFrom(payload.get("permissions"));

        int updated = jdbc.update(
                """
                update platform.tenant_partnerships
                set permissions_json = ?::jsonb
                where id = ?
                  and (provider_tenant_id = ? or requester_tenant_id = ?)
                  and status = 'active'
                """,
                toJson(permissions),
                id,
                tenantId,
                tenantId);
        if (updated == 0) {
            throw new AppException(ErrorCode.NOT_FOUND, "الربط غير موجود أو لا تملك صلاحية تعديل صلاحياته", HttpStatus.NOT_FOUND);
        }
    }

    public Map<String, Object> linkedInventory(String partnerPublicId) {
        PartnershipAccess access = partnershipAccess(partnerPublicId, "view_inventory");
        boolean canViewPricing = Boolean.TRUE.equals(access.permissions().get("view_pricing"));
        boolean canViewSalesData = Boolean.TRUE.equals(access.permissions().get("view_sales_data"));
        String partnerSchema = quoteSchema(access.partnerSchema());

        List<Map<String, Object>> products = jdbc.queryForList(String.format("""
                select p.id,
                       p.public_id::text as product_uuid,
                       p.sku as code,
                       p.name as name_ar,
                       coalesce(c.name, 'غير مصنف') as category,
                       coalesce(pu.symbol, pu.name, 'وحدة') as unit,
                       coalesce(sum(ps.available_qty), 0) as stock,
                       case when ? then p.current_price_amount else null end as price,
                       case when ? then coalesce(sales.monthly_sales, 0) else null end as monthly_sales
                from %1$s.products p
                left join %1$s.categories c on c.id = p.category_id
                left join %1$s.product_units_catalog pu on pu.id = p.base_unit_id
                left join %1$s.product_stocks ps on ps.product_id = p.id
                left join (
                    select oi.product_id, sum(oi.shipped_qty) as monthly_sales
                    from %1$s.order_items oi
                    join %1$s.orders o on o.id = oi.order_id
                    where oi.deleted_at is null
                      and o.deleted_at is null
                      and o.order_status in ('completed', 'shipped')
                      and coalesce(o.confirmed_at, o.created_at) >= date_trunc('month', now())
                    group by oi.product_id
                ) sales on sales.product_id = p.id
                where p.deleted_at is null
                  and p.status = 'active'
                group by p.id, c.name, pu.symbol, pu.name, sales.monthly_sales
                order by p.name
                limit 200
                """, partnerSchema), canViewPricing, canViewSalesData)
                .stream().map(this::inventoryRow).toList();

        Map<String, Object> partner = new LinkedHashMap<>();
        partner.put("partnerUuid", access.partnerUuid());
        partner.put("partnerName", access.partnerName());
        partner.put("partnerEmail", access.partnerEmail());
        partner.put("partnerWilaya", access.partnerWilaya());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("partner", partner);
        result.put("permissions", access.permissions());
        result.put("products", products);
        return result;
    }

    @Transactional
    public Map<String, Object> cloneProducts(String partnerPublicId, Map<String, Object> body) {
        PartnershipAccess access = partnershipAccess(partnerPublicId, "clone_products");
        List<Long> productIds = productIds(body != null ? body.get("productIds") : null);
        if (productIds.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "حدد صنفاً واحداً على الأقل", HttpStatus.BAD_REQUEST);
        }

        String sourceSchema = quoteSchema(access.partnerSchema());
        String targetSchema = quoteSchema(TenantContext.get());
        boolean copyPrice = Boolean.TRUE.equals(access.permissions().get("view_pricing"));
        String placeholders = String.join(", ", productIds.stream().map(id -> "?").toList());

        jdbc.update(String.format("""
                insert into %2$s.categories (name)
                select distinct c.name
                from %1$s.products p
                join %1$s.categories c on c.id = p.category_id
                where p.deleted_at is null
                  and p.status = 'active'
                  and p.id in (%3$s)
                  and not exists (
                      select 1 from %2$s.categories existing
                      where lower(existing.name) = lower(c.name)
                  )
                """, sourceSchema, targetSchema, placeholders), productIds.toArray());

        jdbc.update(String.format("""
                insert into %2$s.product_units_catalog (name, symbol)
                select distinct pu.name, pu.symbol
                from %1$s.products p
                join %1$s.product_units_catalog pu on pu.id = p.base_unit_id
                where p.deleted_at is null
                  and p.status = 'active'
                  and p.id in (%3$s)
                on conflict (name) do nothing
                """, sourceSchema, targetSchema, placeholders), productIds.toArray());

        List<Object> args = new ArrayList<>();
        args.add(copyPrice);
        args.addAll(productIds);

        Integer clonedCount = jdbc.queryForObject(String.format("""
                with source_products as (
                    select p.sku,
                           p.name,
                           p.barcode,
                           case when ? then p.current_price_amount else null end as current_price_amount,
                           p.price_currency,
                           p.units_per_package,
                           p.min_stock_qty,
                           p.description,
                           p.status,
                           c.name as category_name,
                           pu.name as unit_name,
                           pu.symbol as unit_symbol
                    from %1$s.products p
                    left join %1$s.categories c on c.id = p.category_id
                    left join %1$s.product_units_catalog pu on pu.id = p.base_unit_id
                    where p.deleted_at is null
                      and p.status = 'active'
                      and p.id in (%2$s)
                ),
                upserted as (
                    insert into %3$s.products
                      (sku, name, category_id, base_unit_id, barcode, current_price_amount, price_currency,
                       units_per_package, min_stock_qty, description, status)
                    select sp.sku,
                           sp.name,
                           (
                               select c.id from %3$s.categories c
                               where sp.category_name is not null
                                 and lower(c.name) = lower(sp.category_name)
                               order by c.id
                               limit 1
                           ),
                           (
                               select pu.id from %3$s.product_units_catalog pu
                               where sp.unit_name is not null
                                 and pu.name = sp.unit_name
                               order by pu.id
                               limit 1
                           ),
                           sp.barcode,
                           sp.current_price_amount,
                           sp.price_currency,
                           sp.units_per_package,
                           sp.min_stock_qty,
                           sp.description,
                           sp.status
                    from source_products sp
                    on conflict (sku) do update
                    set name = excluded.name,
                        category_id = excluded.category_id,
                        base_unit_id = excluded.base_unit_id,
                        barcode = excluded.barcode,
                        current_price_amount = excluded.current_price_amount,
                        price_currency = excluded.price_currency,
                        units_per_package = excluded.units_per_package,
                        min_stock_qty = excluded.min_stock_qty,
                        description = excluded.description,
                        status = excluded.status,
                        deleted_at = null,
                        updated_at = now()
                    returning id
                )
                select count(*) from upserted
                """, sourceSchema, placeholders, targetSchema), Integer.class, args.toArray());

        return Map.of("clonedCount", clonedCount != null ? clonedCount : 0);
    }

    private List<Map<String, Object>> activePartnerships(Long tenantId) {
        return jdbc.queryForList(
                """
                select p.id,
                       p.status,
                       case when p.provider_tenant_id = ? then 'provider' else 'requester' end as direction,
                       partner.public_id::text as partner_uuid,
                       partner.company_name as partner_name,
                       partner.contact_email as partner_email,
                       partner.contact_phone as partner_phone,
                       partner.wilaya_code as partner_wilaya,
                       p.permissions_json::text as permissions_json,
                       p.requested_at,
                       p.approved_at
                from platform.tenant_partnerships p
                join platform.tenants partner on partner.id =
                    case when p.provider_tenant_id = ? then p.requester_tenant_id else p.provider_tenant_id end
                where p.status = 'active'
                  and (p.provider_tenant_id = ? or p.requester_tenant_id = ?)
                order by p.approved_at desc nulls last, p.requested_at desc
                """,
                tenantId,
                tenantId,
                tenantId,
                tenantId).stream().map(this::partnershipRow).toList();
    }

    private List<Map<String, Object>> pendingApprovals(Long tenantId) {
        return jdbc.queryForList(
                """
                select p.id,
                       requester.public_id::text as partner_uuid,
                       requester.company_name as partner_name,
                       requester.contact_email as partner_email,
                       requester.contact_phone as partner_phone,
                       requester.wilaya_code as partner_wilaya,
                       p.permissions_json::text as permissions_json,
                       p.requested_message,
                       p.requested_at
                from platform.tenant_partnerships p
                join platform.tenants requester on requester.id = p.requester_tenant_id
                where p.provider_tenant_id = ?
                  and p.status = 'pending'
                order by p.requested_at desc
                """,
                tenantId).stream().map(this::requestRow).toList();
    }

    private List<Map<String, Object>> pendingRequests(Long tenantId) {
        return jdbc.queryForList(
                """
                select p.id,
                       provider.public_id::text as partner_uuid,
                       provider.company_name as partner_name,
                       provider.contact_email as partner_email,
                       provider.contact_phone as partner_phone,
                       provider.wilaya_code as partner_wilaya,
                       p.permissions_json::text as permissions_json,
                       p.requested_message,
                       p.requested_at
                from platform.tenant_partnerships p
                join platform.tenants provider on provider.id = p.provider_tenant_id
                where p.requester_tenant_id = ?
                  and p.status = 'pending'
                order by p.requested_at desc
                """,
                tenantId).stream().map(this::requestRow).toList();
    }

    private List<Map<String, Object>> inviteCodes(Long tenantId) {
        return jdbc.queryForList(
                """
                select id, label, permissions_json::text as permissions_json,
                       max_uses, uses_count, expires_at, is_active, created_at
                from platform.tenant_invite_codes
                where provider_tenant_id = ?
                order by created_at desc
                """,
                tenantId).stream().map(this::inviteCodeRow).toList();
    }

    private Map<String, Object> partnershipRow(Map<String, Object> row) {
        Map<String, Object> result = requestRow(row);
        result.put("direction", row.get("direction"));
        result.put("status", row.get("status"));
        result.put("approvedAt", instant(row.get("approved_at")));
        return result;
    }

    private Map<String, Object> inventoryRow(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", row.get("id"));
        result.put("productUuid", row.get("product_uuid"));
        result.put("code", row.get("code"));
        result.put("nameAr", row.get("name_ar"));
        result.put("category", row.get("category"));
        result.put("unit", row.get("unit"));
        result.put("stock", row.get("stock"));
        result.put("price", row.get("price"));
        result.put("monthlySales", row.get("monthly_sales"));
        return result;
    }

    private Map<String, Object> requestRow(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", row.get("id"));
        result.put("partnerUuid", row.get("partner_uuid"));
        result.put("partnerName", row.get("partner_name"));
        result.put("partnerEmail", row.get("partner_email"));
        result.put("partnerPhone", row.get("partner_phone"));
        result.put("partnerWilaya", row.get("partner_wilaya"));
        result.put("permissions", readJsonMap((String) row.get("permissions_json")));
        result.put("message", row.get("requested_message"));
        result.put("requestedAt", instant(row.get("requested_at")));
        result.put("inviteCode", "يظهر عند الإنشاء فقط");
        return result;
    }

    private Map<String, Object> inviteCodeRow(Map<String, Object> row) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", row.get("id"));
        result.put("code", null);
        result.put("label", row.get("label"));
        result.put("permissions", readJsonMap((String) row.get("permissions_json")));
        result.put("maxUses", row.get("max_uses"));
        result.put("usesCount", row.get("uses_count"));
        result.put("expiresAt", instant(row.get("expires_at")));
        result.put("isActive", row.get("is_active"));
        result.put("createdAt", instant(row.get("created_at")));
        return result;
    }

    private Long currentTenantId() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant context", HttpStatus.BAD_REQUEST);
        }
        try {
            return jdbc.queryForObject(
                    "select id from platform.tenants where schema_name = ?",
                    Long.class,
                    schema);
        } catch (EmptyResultDataAccessException e) {
            throw new AppException(ErrorCode.NOT_FOUND, "Tenant not found", HttpStatus.NOT_FOUND);
        }
    }

    private PartnershipAccess partnershipAccess(String partnerPublicId, String requiredPermission) {
        Long requesterTenantId = currentTenantId();
        String partnerUuid = uuidString(partnerPublicId);

        Map<String, Object> row;
        try {
            row = jdbc.queryForMap(
                    """
                    select p.id as partnership_id,
                           p.permissions_json::text as permissions_json,
                           provider.public_id::text as partner_uuid,
                           provider.company_name as partner_name,
                           provider.contact_email as partner_email,
                           provider.wilaya_code as partner_wilaya,
                           provider.schema_name as partner_schema
                    from platform.tenant_partnerships p
                    join platform.tenants provider on provider.id = p.provider_tenant_id
                    where p.status = 'active'
                      and p.requester_tenant_id = ?
                      and provider.public_id = ?::uuid
                    """,
                    requesterTenantId,
                    partnerUuid);
        } catch (EmptyResultDataAccessException e) {
            throw new AppException(ErrorCode.NOT_FOUND, "لا يوجد ربط نشط يسمح بالوصول لهذا الشريك", HttpStatus.NOT_FOUND);
        }

        Map<String, Object> permissions = readJsonMap((String) row.get("permissions_json"));
        if (!Boolean.TRUE.equals(permissions.get(requiredPermission))) {
            throw new AppException(ErrorCode.FORBIDDEN, "ليست لديك صلاحية تنفيذ هذه العملية", HttpStatus.FORBIDDEN);
        }

        String partnerSchema = row.get("partner_schema").toString();
        if (!TenantContext.isValidSchema(partnerSchema)) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Invalid partner tenant schema", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return new PartnershipAccess(
                row.get("partner_uuid").toString(),
                row.get("partner_name").toString(),
                textOrNull(row.get("partner_email")),
                textOrNull(row.get("partner_wilaya")),
                partnerSchema,
                permissions);
    }

    private static String generateInviteCode() {
        return "LINK-" + randomSegment() + "-" + randomSegment();
    }

    private static String randomSegment() {
        StringBuilder segment = new StringBuilder(CODE_SEGMENT_LENGTH);
        for (int i = 0; i < CODE_SEGMENT_LENGTH; i++) {
            segment.append(CODE_ALPHABET.charAt(SECURE_RANDOM.nextInt(CODE_ALPHABET.length())));
        }
        return segment.toString();
    }

    private static String normalizeCode(String code) {
        if (code == null || code.isBlank()) return null;
        return code.trim().toUpperCase();
    }

    private static String uuidString(String value) {
        try {
            return UUID.fromString(value).toString();
        } catch (RuntimeException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, "معرف الشريك غير صالح", HttpStatus.BAD_REQUEST);
        }
    }

    private static String hashCode(String code) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(normalizeCode(code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> permissionsFrom(Object value) {
        if (value instanceof Map<?, ?> map) {
            return new LinkedHashMap<>((Map<String, Object>) map);
        }
        return new LinkedHashMap<>();
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, JSON_MAP);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Invalid partnership permissions", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String toJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value != null ? value : Map.of());
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Invalid partnership payload", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private static String textOrNull(Object value) {
        if (value == null) return null;
        String text = value.toString().trim();
        return text.isBlank() ? null : text;
    }

    private static Integer integerOrNull(Object value) {
        String text = textOrNull(value);
        if (text == null) return null;
        try {
            return Integer.valueOf(text);
        } catch (NumberFormatException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, "قيمة رقمية غير صالحة", HttpStatus.BAD_REQUEST);
        }
    }

    private static Long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : Long.valueOf(value.toString());
    }

    private static List<Long> productIds(Object value) {
        if (!(value instanceof List<?> values)) return List.of();
        return values.stream()
                .map(PartnershipService::productId)
                .distinct()
                .limit(200)
                .toList();
    }

    private static Long productId(Object value) {
        try {
            long id = value instanceof Number number ? number.longValue() : Long.parseLong(value.toString());
            if (id < 1) {
                throw new NumberFormatException("non-positive id");
            }
            return id;
        } catch (RuntimeException e) {
            throw new AppException(ErrorCode.BAD_REQUEST, "معرف صنف غير صالح", HttpStatus.BAD_REQUEST);
        }
    }

    private static String quoteSchema(String schema) {
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant schema", HttpStatus.BAD_REQUEST);
        }
        return "\"" + schema + "\"";
    }

    private static String instant(Object value) {
        if (value == null) return null;
        if (value instanceof Timestamp timestamp) return timestamp.toInstant().toString();
        if (value instanceof Instant instant) return instant.toString();
        return value.toString();
    }

    private record PartnershipAccess(
            String partnerUuid,
            String partnerName,
            String partnerEmail,
            String partnerWilaya,
            String partnerSchema,
            Map<String, Object> permissions) {
    }
}
