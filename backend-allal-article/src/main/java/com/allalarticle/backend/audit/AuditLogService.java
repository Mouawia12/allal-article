package com.allalarticle.backend.audit;

import com.allalarticle.backend.notifications.NotificationsService;
import com.allalarticle.backend.tenant.TenantContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final JdbcTemplate jdbc;
    private final ObjectMapper objectMapper;
    private final NotificationsService notificationsService;

    // ── Write ─────────────────────────────────────────────────────────────────

    public void log(Long actorUserId, String entityType, Long entityId,
                    String action, String description, String entityDisplay,
                    String actorRole, Map<String, Object> details) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) return;
        Map<String, Object> safeDetails = details != null ? details : Map.of();
        boolean auditWritten = false;
        try {
            String metaJson = objectMapper.writeValueAsString(Map.of(
                    "description", description != null ? description : "",
                    "entity",      entityDisplay != null ? entityDisplay : "",
                    "role",        actorRole != null ? actorRole : "",
                    "details",     safeDetails
            ));
            jdbc.update(
                    String.format("""
                        INSERT INTO "%s".audit_logs
                            (actor_user_id, entity_type, entity_id, action, meta_json)
                        VALUES (?, ?, ?, ?, ?::jsonb)
                        """, s),
                    actorUserId, entityType, entityId, action, metaJson);
            auditWritten = true;
        } catch (Exception e) {
            log.warn("Failed to write audit log: {}", e.getMessage());
        }
        if (auditWritten) {
            publishAuditNotification(actorUserId, entityType, entityId, action,
                    description, entityDisplay, safeDetails);
        }
    }

    private void publishAuditNotification(Long actorUserId, String entityType, Long entityId,
                                          String action, String description, String entityDisplay,
                                          Map<String, Object> details) {
        try {
            String category = notificationCategory(entityType, action);
            String title = description != null && !description.isBlank()
                    ? description
                    : notificationTitle(action);
            String body = entityDisplay != null && !entityDisplay.isBlank()
                    ? "المرجع: " + entityDisplay
                    : "حدث جديد في النظام";

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("auditAction", action);
            payload.put("entityType", entityType);
            payload.put("entityId", entityId);
            payload.put("entityDisplay", entityDisplay);
            payload.put("details", details);

            String reason = "لأنك مستخدم نشط داخل المؤسسة. النظام يرسل هذا النوع من التنبيهات لكل المعنيين، بما فيهم منفذ العملية.";
            notificationsService.publishToActiveUsers(new NotificationsService.NotificationRequest(
                    category,
                    notificationSeverity(action),
                    title,
                    body,
                    entityType,
                    entityId,
                    actorUserId,
                    action,
                    notificationActionUrl(entityType, entityId, details),
                    reason,
                    reason,
                    payload,
                    null,
                    category + ":" + action
            ));
        } catch (Exception e) {
            log.warn("Failed to publish audit notification: {}", e.getMessage());
        }
    }

    private String notificationCategory(String entityType, String action) {
        String value = entityType != null ? entityType : "";
        String event = action != null ? action : "";
        if (event.contains("payment")) return "payments";
        return switch (value) {
            case "order" -> "orders";
            case "product" -> "products";
            case "stock_movement" -> "inventory";
            case "customer_payment" -> "payments";
            case "purchase_order", "purchase_return" -> "purchases";
            case "return" -> "returns";
            case "customer" -> "customers";
            case "supplier" -> "suppliers";
            default -> "system";
        };
    }

    private String notificationSeverity(String action) {
        String event = action != null ? action.toLowerCase() : "";
        if (event.contains("fail") || event.contains("denied") || event.contains("error")) {
            return "critical";
        }
        if (event.contains("cancel") || event.contains("reject")
                || event.contains("refund") || event.contains("adjustment_out")) {
            return "warning";
        }
        if (event.contains("created") || event.contains("confirmed")
                || event.contains("completed") || event.contains("received")
                || event.contains("posted")) {
            return "success";
        }
        return "info";
    }

    private String notificationTitle(String action) {
        return action != null && !action.isBlank() ? action : "حدث جديد";
    }

    private String notificationActionUrl(String entityType, Long entityId, Map<String, Object> details) {
        if ("order".equals(entityType) && entityId != null) return "/orders/" + entityId;
        if ("product".equals(entityType) && entityId != null) return "/products/" + entityId;
        if ("purchase_order".equals(entityType) && entityId != null) return "/purchases/" + entityId;
        if ("return".equals(entityType)) {
            Long orderId = longDetail(details, "orderId");
            return orderId != null ? "/orders/" + orderId : "/orders";
        }
        if ("stock_movement".equals(entityType)) return "/inventory";
        if ("customer_payment".equals(entityType) || "customer".equals(entityType)) return "/customers";
        if ("purchase_return".equals(entityType)) return "/purchases";
        if ("supplier".equals(entityType)) return "/suppliers";
        return null;
    }

    private Long longDetail(Map<String, Object> details, String key) {
        if (details == null || !details.containsKey(key)) return null;
        Object value = details.get(key);
        if (value instanceof Number number) return number.longValue();
        if (value instanceof String text && !text.isBlank()) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public Map<String, Object> list(String search, String entityType,
                                     String action, String from, String to, String sort,
                                     int page, int size) {
        String s = TenantContext.get();
        if (s == null || s.isBlank()) throw new IllegalStateException("No tenant context");
        backfillMissingBusinessLogs(s);
        String sortDirection = "asc".equalsIgnoreCase(sort) ? "ASC" : "DESC";

        StringBuilder where = new StringBuilder("WHERE 1=1");
        List<Object> params = new ArrayList<>();

        if (action != null && !action.isBlank()) {
            where.append(" AND al.action = ?");
            params.add(action);
        }
        if (entityType != null && !entityType.isBlank()) {
            where.append(" AND al.entity_type = ?");
            params.add(entityType);
        }
        if (search != null && !search.isBlank()) {
            where.append(" AND (al.action ILIKE ? OR al.meta_json::text ILIKE ?)");
            String like = "%" + search + "%";
            params.add(like);
            params.add(like);
        }
        if (from != null && !from.isBlank()) {
            where.append(" AND al.created_at >= ?::timestamptz");
            params.add(from);
        }
        if (to != null && !to.isBlank()) {
            where.append(" AND al.created_at < (?::date + interval '1 day')");
            params.add(to);
        }

        Long total = jdbc.queryForObject(
                String.format("SELECT count(*) FROM \"%s\".audit_logs al %s", s, where),
                Long.class, params.toArray());

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(size);
        dataParams.add((long) page * size);

        List<Map<String, Object>> rows = jdbc.queryForList(
                String.format("""
                    SELECT
                        al.id,
                        al.created_at AS "createdAt",
                        to_char(al.created_at AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD HH24:MI') AS time,
                        COALESCE(u.name, 'النظام') AS "user",
                        COALESCE(al.meta_json->>'role', 'نظام')        AS role,
                        al.action,
                        al.entity_type,
                        al.entity_id,
                        COALESCE(al.meta_json->>'entity', al.entity_type) AS entity,
                        COALESCE(al.meta_json->>'description', al.action) AS description,
                        COALESCE(al.meta_json->'details', '{}')::text     AS details_json
                    FROM "%s".audit_logs al
                    LEFT JOIN "%s".users u ON u.id = al.actor_user_id
                    %s
                    ORDER BY al.created_at %s, al.id %s
                    LIMIT ? OFFSET ?
                    """, s, s, where, sortDirection, sortDirection),
                dataParams.toArray());

        return Map.of(
                "content",       rows,
                "totalElements", total != null ? total : 0L,
                "page",          page,
                "size",          size,
                "totalPages",    total != null ? (int) Math.ceil((double) total / size) : 0
        );
    }

    private void backfillMissingBusinessLogs(String s) {
        try {
            backfillCustomerPayments(s);
            backfillSalesReturns(s);
            backfillPurchaseOrders(s);
            backfillPurchaseReturns(s);
            backfillStockMovements(s);
        } catch (Exception e) {
            log.warn("Failed to backfill audit logs: {}", e.getMessage());
        }
    }

    private void backfillCustomerPayments(String s) {
        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                COALESCE(cp.created_by, cp.received_by),
                'customer_payment',
                cp.id,
                CASE WHEN cp.direction = 'out' THEN 'customer_payment_refund'
                     ELSE 'customer_payment_received' END,
                jsonb_build_object(
                    'description',
                        CASE WHEN cp.direction = 'out' THEN 'دفعة عكسية للزبون '
                             ELSE 'استلام دفعة من ' END || c.name,
                    'entity', COALESCE(NULLIF(cp.reference_number, ''), 'PAY-' || cp.id),
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'amount', cp.amount,
                        'direction', cp.direction,
                        'paymentMethod', cp.payment_method,
                        'referenceNumber', cp.reference_number,
                        'customerId', c.id,
                        'customerName', c.name,
                        'paymentDate', cp.payment_date,
                        'notes', cp.notes
                    )
                ),
                cp.created_at
            FROM "%1$s".customer_payments cp
            JOIN "%1$s".customers c ON c.id = cp.customer_id
            WHERE NOT EXISTS (
                SELECT 1 FROM "%1$s".audit_logs al
                WHERE al.entity_type = 'customer_payment'
                  AND al.entity_id = cp.id
                  AND al.action = CASE WHEN cp.direction = 'out' THEN 'customer_payment_refund'
                                       ELSE 'customer_payment_received' END
            )
            """, s));
    }

    private void backfillSalesReturns(String s) {
        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                r.created_by,
                'return',
                r.id,
                'create_return',
                jsonb_build_object(
                    'description', 'إنشاء مرتجع' || COALESCE(' — ' || c.name, ''),
                    'entity', r.return_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'returnNumber', r.return_number,
                        'status', r.status,
                        'customerId', c.id,
                        'customerName', c.name,
                        'orderId', r.order_id,
                        'returnDate', r.return_date,
                        'itemsCount', COALESCE(items.items_count, 0),
                        'totalReturnedQty', COALESCE(items.total_returned_qty, 0),
                        'notes', r.notes
                    )
                ),
                r.created_at
            FROM "%1$s".returns r
            LEFT JOIN "%1$s".customers c ON c.id = r.customer_id
            LEFT JOIN (
                SELECT return_id, count(*) AS items_count, sum(returned_qty) AS total_returned_qty
                FROM "%1$s".return_items
                GROUP BY return_id
            ) items ON items.return_id = r.id
            WHERE NOT EXISTS (
                SELECT 1 FROM "%1$s".audit_logs al
                WHERE al.entity_type = 'return'
                  AND al.entity_id = r.id
                  AND al.action = 'create_return'
            )
            """, s));

        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                COALESCE(r.received_by, r.created_by),
                'return',
                r.id,
                CASE WHEN r.status = 'rejected' THEN 'reject_return' ELSE 'accept_return' END,
                jsonb_build_object(
                    'description',
                        CASE WHEN r.status = 'rejected' THEN 'رفض مرتجع' ELSE 'قبول مرتجع' END
                        || COALESCE(' — ' || c.name, ''),
                    'entity', r.return_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'returnNumber', r.return_number,
                        'status', r.status,
                        'customerId', c.id,
                        'customerName', c.name,
                        'orderId', r.order_id,
                        'returnDate', r.return_date,
                        'acceptedQty', COALESCE(items.accepted_qty, 0)
                    )
                ),
                r.created_at + interval '1 second'
            FROM "%1$s".returns r
            LEFT JOIN "%1$s".customers c ON c.id = r.customer_id
            LEFT JOIN (
                SELECT return_id, sum(accepted_qty) AS accepted_qty
                FROM "%1$s".return_items
                GROUP BY return_id
            ) items ON items.return_id = r.id
            WHERE r.status IN ('accepted', 'rejected')
              AND NOT EXISTS (
                  SELECT 1 FROM "%1$s".audit_logs al
                  WHERE al.entity_type = 'return'
                    AND al.entity_id = r.id
                    AND al.action = CASE WHEN r.status = 'rejected' THEN 'reject_return' ELSE 'accept_return' END
              )
            """, s));
    }

    private void backfillPurchaseOrders(String s) {
        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                po.created_by,
                'purchase_order',
                po.id,
                'purchase_order_created',
                jsonb_build_object(
                    'description', 'إنشاء أمر شراء — ' || po.supplier_name,
                    'entity', po.po_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'poNumber', po.po_number,
                        'supplierId', po.supplier_id,
                        'supplierName', po.supplier_name,
                        'status', po.status,
                        'totalAmount', po.total_amount,
                        'expectedDate', po.expected_date
                    )
                ),
                po.created_at
            FROM "%1$s".purchase_orders po
            WHERE NOT EXISTS (
                SELECT 1 FROM "%1$s".audit_logs al
                WHERE al.entity_type = 'purchase_order'
                  AND al.entity_id = po.id
                  AND al.action = 'purchase_order_created'
            )
            """, s));

        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                COALESCE(po.received_by, po.created_by),
                'purchase_order',
                po.id,
                'receive_purchase',
                jsonb_build_object(
                    'description', 'استلام مشتريات — ' || po.supplier_name,
                    'entity', po.po_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'poNumber', po.po_number,
                        'supplierId', po.supplier_id,
                        'supplierName', po.supplier_name,
                        'totalAmount', po.total_amount,
                        'receivedDate', po.received_date
                    )
                ),
                COALESCE(po.received_date::timestamptz, po.updated_at)
            FROM "%1$s".purchase_orders po
            WHERE po.status = 'received'
              AND NOT EXISTS (
                  SELECT 1 FROM "%1$s".audit_logs al
                  WHERE al.entity_type = 'purchase_order'
                    AND al.entity_id = po.id
                    AND al.action = 'receive_purchase'
              )
            """, s));

        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                COALESCE(po.cancelled_by, po.created_by),
                'purchase_order',
                po.id,
                'cancel_purchase',
                jsonb_build_object(
                    'description', 'إلغاء أمر شراء — ' || po.supplier_name,
                    'entity', po.po_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'poNumber', po.po_number,
                        'supplierId', po.supplier_id,
                        'supplierName', po.supplier_name,
                        'totalAmount', po.total_amount
                    )
                ),
                COALESCE(po.cancelled_at, po.updated_at)
            FROM "%1$s".purchase_orders po
            WHERE po.status = 'cancelled'
              AND NOT EXISTS (
                  SELECT 1 FROM "%1$s".audit_logs al
                  WHERE al.entity_type = 'purchase_order'
                    AND al.entity_id = po.id
                    AND al.action = 'cancel_purchase'
              )
            """, s));
    }

    private void backfillPurchaseReturns(String s) {
        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                pr.created_by,
                'purchase_return',
                pr.id,
                'purchase_return_created',
                jsonb_build_object(
                    'description', 'إنشاء مرتجع مشتريات — ' || pr.supplier_name,
                    'entity', pr.return_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'returnNumber', pr.return_number,
                        'purchaseOrderId', pr.purchase_order_id,
                        'supplierId', pr.supplier_id,
                        'supplierName', pr.supplier_name,
                        'status', pr.status,
                        'totalAmount', pr.total_amount,
                        'netAmount', pr.net_amount,
                        'returnDate', pr.return_date,
                        'reason', pr.reason
                    )
                ),
                pr.created_at
            FROM "%1$s".purchase_returns pr
            WHERE NOT EXISTS (
                SELECT 1 FROM "%1$s".audit_logs al
                WHERE al.entity_type = 'purchase_return'
                  AND al.entity_id = pr.id
                  AND al.action = 'purchase_return_created'
            )
            """, s));

        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                COALESCE(pr.posted_by, pr.created_by),
                'purchase_return',
                pr.id,
                CASE WHEN pr.status = 'cancelled' THEN 'purchase_return_cancelled'
                     ELSE 'purchase_return_posted' END,
                jsonb_build_object(
                    'description',
                        CASE WHEN pr.status = 'cancelled' THEN 'إلغاء مرتجع مشتريات — '
                             ELSE 'ترحيل مرتجع مشتريات — ' END || pr.supplier_name,
                    'entity', pr.return_number,
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'returnNumber', pr.return_number,
                        'purchaseOrderId', pr.purchase_order_id,
                        'supplierId', pr.supplier_id,
                        'supplierName', pr.supplier_name,
                        'status', pr.status,
                        'netAmount', pr.net_amount,
                        'returnDate', pr.return_date
                    )
                ),
                COALESCE(pr.posted_at, pr.updated_at)
            FROM "%1$s".purchase_returns pr
            WHERE pr.status IN ('posted', 'cancelled')
              AND NOT EXISTS (
                  SELECT 1 FROM "%1$s".audit_logs al
                  WHERE al.entity_type = 'purchase_return'
                    AND al.entity_id = pr.id
                    AND al.action = CASE WHEN pr.status = 'cancelled' THEN 'purchase_return_cancelled'
                                         ELSE 'purchase_return_posted' END
              )
            """, s));
    }

    private void backfillStockMovements(String s) {
        jdbc.update(String.format("""
            INSERT INTO "%1$s".audit_logs
                (actor_user_id, entity_type, entity_id, action, meta_json, created_at)
            SELECT
                sm.performed_by,
                'stock_movement',
                sm.id,
                CASE WHEN sm.movement_type IN ('TRANSFER_IN', 'TRANSFER_OUT') THEN 'stock_transfer'
                     ELSE 'inventory_adjustment' END,
                jsonb_build_object(
                    'description',
                        CASE WHEN sm.movement_type IN ('TRANSFER_IN', 'TRANSFER_OUT') THEN 'تحويل مخزون'
                             ELSE 'تسوية مخزون' END || ' — ' || p.name,
                    'entity', COALESCE(w.name, 'مستودع'),
                    'role', 'إدارة',
                    'details', jsonb_build_object(
                        'movementType', sm.movement_type,
                        'productId', p.id,
                        'productName', p.name,
                        'warehouseId', w.id,
                        'warehouseName', w.name,
                        'qty', sm.qty,
                        'balanceBefore', sm.balance_before,
                        'balanceAfter', sm.balance_after,
                        'notes', sm.notes
                    )
                ),
                sm.created_at
            FROM "%1$s".stock_movements sm
            JOIN "%1$s".products p ON p.id = sm.product_id
            JOIN "%1$s".warehouses w ON w.id = sm.warehouse_id
            WHERE sm.movement_type IN ('ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_OUT')
              AND NOT EXISTS (
                  SELECT 1 FROM "%1$s".audit_logs al
                  WHERE al.entity_type = 'stock_movement'
                    AND al.entity_id = sm.id
                    AND al.action = CASE WHEN sm.movement_type IN ('TRANSFER_IN', 'TRANSFER_OUT') THEN 'stock_transfer'
                                         ELSE 'inventory_adjustment' END
              )
            """, s));
    }
}
