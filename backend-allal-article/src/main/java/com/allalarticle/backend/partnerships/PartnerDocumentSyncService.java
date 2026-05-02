package com.allalarticle.backend.partnerships;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.purchases.entity.PurchaseOrder;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Year;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PartnerDocumentSyncService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final PartnerSupplierLinkResolver supplierLinkResolver;

    public PurchaseToSaleSyncResult syncPurchaseOrderToPartnerSale(PurchaseOrder purchaseOrder) {
        if (purchaseOrder == null || purchaseOrder.getSupplier() == null) return null;

        var link = supplierLinkResolver.resolveForSupplier(purchaseOrder.getSupplier()).orElse(null);
        if (link == null) return null;

        supplierLinkResolver.applyToSupplier(purchaseOrder.getSupplier(), link, purchaseOrder.getCreatedById());

        if (!link.hasPermission("create_purchase_link")) {
            return null;
        }
        if (!TenantContext.isValidSchema(link.providerSchema())) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Invalid partner tenant schema", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        String sourceSchema = quoteSchema(TenantContext.get());
        String targetSchema = quoteSchema(link.providerSchema());
        List<Map<String, Object>> sourceItems = sourceItems(sourceSchema, purchaseOrder.getId());
        if (sourceItems.isEmpty()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "لا يمكن مزامنة أمر شراء بدون أصناف", HttpStatus.BAD_REQUEST);
        }

        List<TargetLine> targetLines = resolveTargetLines(targetSchema, sourceItems);
        BigDecimal total = targetLines.stream()
                .map(TargetLine::lineSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        String idempotencyKey = "purchase_to_sale:" + link.requesterTenantId() + ":" + purchaseOrder.getPublicId();
        var existing = existingLink(idempotencyKey);
        if (existing != null) {
            return existing;
        }

        String sourceSnapshot = toJson(sourceSnapshot(purchaseOrder, link, sourceItems, total));
        Map<String, Object> linkRow = jdbc.queryForMap(
                """
                insert into platform.partner_document_links
                  (partnership_id, direction, source_tenant_id, source_document_type, source_document_public_id,
                   target_tenant_id, target_document_type, status, idempotency_key, source_snapshot_json,
                   last_event_type)
                values (?, 'purchase_to_sale', ?, 'purchase_order', ?::uuid,
                        ?, 'order', 'pending_target_confirmation', ?, ?::jsonb,
                        'SOURCE_PURCHASE_CREATED')
                returning id, public_id::text as public_id
                """,
                link.partnershipId(),
                link.requesterTenantId(),
                purchaseOrder.getPublicId().toString(),
                link.providerTenantId(),
                idempotencyKey,
                sourceSnapshot);

        Long documentLinkId = longValue(linkRow.get("id"));
        UUID documentLinkPublicId = uuid(linkRow.get("public_id"));
        Long customerId = resolveTargetCustomer(targetSchema, link);

        Map<String, Object> orderRow = jdbc.queryForMap(String.format("""
                insert into %s.orders
                  (order_number, customer_id, origin_channel, linked_partner_uuid,
                   partner_document_link_public_id, partner_source_document_public_id, partner_sync_status,
                   order_status, shipping_status, payment_status, price_currency, notes, internal_notes, total_amount)
                values ('TEMP', ?, 'partner_purchase', ?::uuid,
                        ?::uuid, ?::uuid, 'synced',
                        'draft', 'pending', 'unpaid', 'DZD', ?, ?, ?)
                returning id, public_id::text as public_id
                """, targetSchema),
                customerId,
                link.requesterUuid().toString(),
                documentLinkPublicId.toString(),
                purchaseOrder.getPublicId().toString(),
                "طلبية منشأة تلقائياً من أمر شراء عند " + safeText(link.requesterName()),
                "Partner purchase order " + purchaseOrder.getPoNumber(),
                total);

        Long targetOrderId = longValue(orderRow.get("id"));
        UUID targetOrderPublicId = uuid(orderRow.get("public_id"));
        String orderNumber = "ORD-" + Year.now() + "-" + String.format("%06d", targetOrderId);
        jdbc.update(String.format("update %s.orders set order_number = ?, updated_at = now() where id = ?", targetSchema),
                orderNumber, targetOrderId);

        int lineNumber = 1;
        for (TargetLine line : targetLines) {
            jdbc.update(String.format("""
                    insert into %s.order_items
                      (order_id, product_id, line_number, line_status, requested_qty, approved_qty,
                       shipped_qty, returned_qty, cancelled_qty, pricing_source, base_unit_price, unit_price,
                       line_subtotal, customer_note, internal_note)
                    values (?, ?, ?, 'pending', ?, ?, 0, 0, 0, 'partner_purchase', ?, ?, ?, ?, ?)
                    """, targetSchema),
                    targetOrderId,
                    line.productId(),
                    lineNumber++,
                    line.qty(),
                    line.qty(),
                    line.unitPrice(),
                    line.unitPrice(),
                    line.lineSubtotal(),
                    line.notes(),
                    "Source purchase item " + line.sourceItemId());
        }

        jdbc.update(String.format("""
                insert into %s.order_events (order_id, event_type, payload_json, performed_by)
                values (?, 'ORDER_CREATED', ?::jsonb, null)
                """, targetSchema), targetOrderId, toJson(Map.of("origin", "partner_purchase")));

        String targetSnapshot = toJson(targetSnapshot(orderNumber, targetOrderPublicId, targetLines, total));
        jdbc.update(
                """
                update platform.partner_document_links
                set target_document_public_id = ?::uuid,
                    target_snapshot_json = ?::jsonb,
                    last_event_type = 'TARGET_ORDER_CREATED',
                    updated_at = now()
                where id = ?
                """,
                targetOrderPublicId.toString(),
                targetSnapshot,
                documentLinkId);

        jdbc.update(
                """
                insert into platform.partner_document_events
                  (document_link_id, event_type, actor_tenant_id, payload_json)
                values (?, 'TARGET_ORDER_CREATED', ?, ?::jsonb)
                """,
                documentLinkId,
                link.requesterTenantId(),
                toJson(Map.of("targetOrderPublicId", targetOrderPublicId.toString(), "orderNumber", orderNumber)));

        return new PurchaseToSaleSyncResult(
                link.providerUuid(),
                documentLinkPublicId,
                targetOrderPublicId,
                "synced");
    }

    private List<Map<String, Object>> sourceItems(String sourceSchema, Long purchaseOrderId) {
        return jdbc.queryForList(String.format("""
                select poi.id,
                       p.public_id::text as product_public_id,
                       p.sku,
                       p.name,
                       poi.ordered_qty,
                       poi.unit_price,
                       poi.line_subtotal,
                       poi.notes
                from %s.purchase_order_items poi
                join %s.products p on p.id = poi.product_id
                where poi.purchase_order_id = ?
                order by poi.id
                """, sourceSchema, sourceSchema), purchaseOrderId);
    }

    private List<TargetLine> resolveTargetLines(String targetSchema, List<Map<String, Object>> sourceItems) {
        List<TargetLine> lines = new ArrayList<>();
        for (Map<String, Object> item : sourceItems) {
            String sku = textOrNull(item.get("sku"));
            if (sku == null) {
                throw new AppException(ErrorCode.CONFLICT, "تعذر مزامنة صنف بدون SKU مع الشريك", HttpStatus.CONFLICT);
            }
            Map<String, Object> product;
            try {
                product = jdbc.queryForMap(String.format("""
                        select id, public_id::text as public_id, sku, name
                        from %s.products
                        where sku = ?
                          and deleted_at is null
                          and status = 'active'
                        order by id
                        limit 1
                        """, targetSchema), sku);
            } catch (EmptyResultDataAccessException e) {
                throw new AppException(ErrorCode.CONFLICT,
                        "تعذر إنشاء طلبية عند الشريك: الصنف غير موجود عند الشريك (" + sku + ")",
                        HttpStatus.CONFLICT);
            }

            BigDecimal qty = decimal(item.get("ordered_qty"));
            BigDecimal unitPrice = decimal(item.get("unit_price"));
            BigDecimal lineSubtotal = decimal(item.get("line_subtotal"));
            if (lineSubtotal.compareTo(BigDecimal.ZERO) == 0) {
                lineSubtotal = unitPrice.multiply(qty);
            }
            lines.add(new TargetLine(
                    longValue(item.get("id")),
                    longValue(product.get("id")),
                    uuid(product.get("public_id")),
                    sku,
                    textOrNull(product.get("name")),
                    qty,
                    unitPrice,
                    lineSubtotal,
                    textOrNull(item.get("notes"))));
        }
        return lines;
    }

    private Long resolveTargetCustomer(String targetSchema, ResolvedPartnerSupplierLink link) {
        String email = textOrNull(link.requesterEmail());
        String name = textOrNull(link.requesterName()) != null ? textOrNull(link.requesterName()) : "شريك تجاري";

        if (email != null) {
            List<Map<String, Object>> matches = jdbc.queryForList(String.format("""
                    select id from %s.customers
                    where deleted_at is null
                      and lower(email) = lower(?)
                    order by id
                    limit 1
                    """, targetSchema), email);
            if (!matches.isEmpty()) return longValue(matches.get(0).get("id"));
        }

        return jdbc.queryForObject(String.format("""
                insert into %s.customers (name, phone, email, status, notes)
                values (?, ?, ?, 'active', ?)
                returning id
                """, targetSchema), Long.class,
                name,
                textOrNull(link.requesterPhone()),
                email,
                "أنشئ تلقائياً من ربط الشركاء");
    }

    private PurchaseToSaleSyncResult existingLink(String idempotencyKey) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                """
                select source_partner.public_id::text as partner_uuid,
                       l.public_id::text as document_link_public_id,
                       l.target_document_public_id::text as target_document_public_id
                from platform.partner_document_links l
                join platform.tenants source_partner on source_partner.id = l.target_tenant_id
                where l.idempotency_key = ?
                limit 1
                """,
                idempotencyKey);
        if (rows.isEmpty()) return null;
        Map<String, Object> row = rows.get(0);
        Object target = row.get("target_document_public_id");
        if (target == null) {
            throw new AppException(ErrorCode.CONFLICT, "رابط الشريك موجود لكنه غير مكتمل", HttpStatus.CONFLICT);
        }
        return new PurchaseToSaleSyncResult(
                uuid(row.get("partner_uuid")),
                uuid(row.get("document_link_public_id")),
                uuid(target),
                "synced");
    }

    private Map<String, Object> sourceSnapshot(
            PurchaseOrder po,
            ResolvedPartnerSupplierLink link,
            List<Map<String, Object>> sourceItems,
            BigDecimal total) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("poNumber", po.getPoNumber());
        snapshot.put("purchaseOrderPublicId", po.getPublicId().toString());
        snapshot.put("requesterName", link.requesterName());
        snapshot.put("supplierName", po.getSupplierName());
        snapshot.put("totalAmount", total);
        snapshot.put("items", sourceItems);
        return snapshot;
    }

    private Map<String, Object> targetSnapshot(
            String orderNumber,
            UUID targetOrderPublicId,
            List<TargetLine> targetLines,
            BigDecimal total) {
        Map<String, Object> snapshot = new LinkedHashMap<>();
        snapshot.put("orderNumber", orderNumber);
        snapshot.put("orderPublicId", targetOrderPublicId.toString());
        snapshot.put("totalAmount", total);
        snapshot.put("itemsCount", targetLines.size());
        return snapshot;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Invalid partner document payload", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private static String quoteSchema(String schema) {
        if (!TenantContext.isValidSchema(schema)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Invalid tenant schema", HttpStatus.BAD_REQUEST);
        }
        return "\"" + schema + "\"";
    }

    private static BigDecimal decimal(Object value) {
        if (value == null) return BigDecimal.ZERO;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        return new BigDecimal(value.toString());
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

    private static String safeText(String value) {
        return value != null && !value.isBlank() ? value : "الشريك";
    }

    public record PurchaseToSaleSyncResult(
            UUID linkedPartnerUuid,
            UUID documentLinkPublicId,
            UUID targetDocumentPublicId,
            String syncStatus
    ) {
    }

    private record TargetLine(
            Long sourceItemId,
            Long productId,
            UUID productPublicId,
            String sku,
            String name,
            BigDecimal qty,
            BigDecimal unitPrice,
            BigDecimal lineSubtotal,
            String notes
    ) {
    }
}
