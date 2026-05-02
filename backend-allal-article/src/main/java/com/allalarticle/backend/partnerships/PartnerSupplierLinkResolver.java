package com.allalarticle.backend.partnerships;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.suppliers.entity.Supplier;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnerSupplierLinkResolver {

    private static final TypeReference<Map<String, Object>> JSON_MAP = new TypeReference<>() {};

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;

    public Optional<ResolvedPartnerSupplierLink> resolveForSupplier(Supplier supplier) {
        if (supplier == null) return Optional.empty();
        Long requesterTenantId = currentTenantId();

        if (supplier.getLinkedPartnerUuid() != null) {
            return queryLinkedByPartnerUuid(requesterTenantId, supplier.getLinkedPartnerUuid(), "manual");
        }

        String email = textOrNull(supplier.getEmail());
        String phone = textOrNull(supplier.getPhone());
        String name = textOrNull(supplier.getLegalName()) != null ? textOrNull(supplier.getLegalName()) : textOrNull(supplier.getName());
        if (email == null && phone == null && name == null) return Optional.empty();

        try {
            Map<String, Object> row = jdbc.queryForMap(
                    """
                    select p.id as partnership_id,
                           provider.id as provider_tenant_id,
                           provider.public_id::text as provider_uuid,
                           provider.schema_name as provider_schema,
                           provider.company_name as provider_name,
                           provider.contact_email as provider_email,
                           requester.id as requester_tenant_id,
                           requester.public_id::text as requester_uuid,
                           requester.company_name as requester_name,
                           requester.contact_email as requester_email,
                           requester.contact_phone as requester_phone,
                           p.permissions_json::text as permissions_json,
                           case
                             when ? is not null and lower(provider.contact_email) = lower(?) then 'email'
                             when ? is not null and provider.contact_phone = ? then 'phone'
                             when ? is not null and lower(provider.company_name) = lower(?) then 'name'
                             else 'auto'
                           end as match_method
                    from platform.tenant_partnerships p
                    join platform.tenants provider on provider.id = p.provider_tenant_id
                    join platform.tenants requester on requester.id = p.requester_tenant_id
                    where p.status = 'active'
                      and p.requester_tenant_id = ?
                      and (
                           (? is not null and lower(provider.contact_email) = lower(?))
                        or (? is not null and provider.contact_phone = ?)
                        or (? is not null and lower(provider.company_name) = lower(?))
                      )
                    order by case
                               when ? is not null and lower(provider.contact_email) = lower(?) then 1
                               when ? is not null and provider.contact_phone = ? then 2
                               else 3
                             end,
                             p.approved_at desc nulls last,
                             p.requested_at desc
                    limit 1
                    """,
                    email, email,
                    phone, phone,
                    name, name,
                    requesterTenantId,
                    email, email,
                    phone, phone,
                    name, name,
                    email, email,
                    phone, phone);
            return Optional.of(fromRow(row));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void applyToSupplier(Supplier supplier, ResolvedPartnerSupplierLink link, Long userId) {
        if (supplier == null || link == null) return;
        supplier.setLinkedPartnerUuid(link.providerUuid());
        supplier.setLinkMatchStatus("confirmed");
        supplier.setLinkMatchMethod(link.matchMethod());
        supplier.setLinkConfirmedById(userId);
        supplier.setLinkConfirmedAt(OffsetDateTime.now());
    }

    private Optional<ResolvedPartnerSupplierLink> queryLinkedByPartnerUuid(
            Long requesterTenantId, UUID providerUuid, String matchMethod) {
        try {
            Map<String, Object> row = jdbc.queryForMap(
                    """
                    select p.id as partnership_id,
                           provider.id as provider_tenant_id,
                           provider.public_id::text as provider_uuid,
                           provider.schema_name as provider_schema,
                           provider.company_name as provider_name,
                           provider.contact_email as provider_email,
                           requester.id as requester_tenant_id,
                           requester.public_id::text as requester_uuid,
                           requester.company_name as requester_name,
                           requester.contact_email as requester_email,
                           requester.contact_phone as requester_phone,
                           p.permissions_json::text as permissions_json,
                           ? as match_method
                    from platform.tenant_partnerships p
                    join platform.tenants provider on provider.id = p.provider_tenant_id
                    join platform.tenants requester on requester.id = p.requester_tenant_id
                    where p.status = 'active'
                      and p.requester_tenant_id = ?
                      and provider.public_id = ?::uuid
                    """,
                    matchMethod,
                    requesterTenantId,
                    providerUuid.toString());
            return Optional.of(fromRow(row));
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    private ResolvedPartnerSupplierLink fromRow(Map<String, Object> row) {
        return new ResolvedPartnerSupplierLink(
                longValue(row.get("partnership_id")),
                longValue(row.get("provider_tenant_id")),
                uuid(row.get("provider_uuid")),
                row.get("provider_schema").toString(),
                textOrNull(row.get("provider_name")),
                textOrNull(row.get("provider_email")),
                longValue(row.get("requester_tenant_id")),
                uuid(row.get("requester_uuid")),
                textOrNull(row.get("requester_name")),
                textOrNull(row.get("requester_email")),
                textOrNull(row.get("requester_phone")),
                readJsonMap((String) row.get("permissions_json")),
                textOrNull(row.get("match_method")));
    }

    private Long currentTenantId() {
        String schema = TenantContext.get();
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant context", HttpStatus.BAD_REQUEST);
        }
        try {
            return jdbc.queryForObject("select id from platform.tenants where schema_name = ?", Long.class, schema);
        } catch (EmptyResultDataAccessException e) {
            throw new AppException(ErrorCode.NOT_FOUND, "Tenant not found", HttpStatus.NOT_FOUND);
        }
    }

    private Map<String, Object> readJsonMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return objectMapper.readValue(json, JSON_MAP);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Invalid partnership permissions", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private static UUID uuid(Object value) {
        return value instanceof UUID id ? id : UUID.fromString(value.toString());
    }

    private static Long longValue(Object value) {
        return value instanceof Number number ? number.longValue() : Long.valueOf(value.toString());
    }

    private static String textOrNull(Object value) {
        if (value == null) return null;
        String text = value.toString().trim();
        return text.isBlank() ? null : text;
    }
}
