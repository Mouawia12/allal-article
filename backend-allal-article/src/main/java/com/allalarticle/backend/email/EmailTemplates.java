package com.allalarticle.backend.email;

import com.allalarticle.backend.products.entity.Product;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Inline-CSS HTML templates tuned for major email clients (Gmail, Outlook, Apple Mail).
 * Layout is RTL Arabic — keep labels short and inline styles only (no <style> blocks).
 */
public final class EmailTemplates {

    private static final DateTimeFormatter DT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withLocale(new Locale("ar"));

    private EmailTemplates() {}

    public static String productCreated(Product product, String actorName, String appUrl) {
        String price = formatPrice(product.getCurrentPriceAmount(), product.getPriceCurrency());
        String body = """
            <h2 style="margin:0 0 12px;font-size:20px;color:#1f2d3d;">تمت إضافة صنف جديد</h2>
            <p style="margin:0 0 18px;color:#67748e;font-size:14px;line-height:1.6;">
                تم إنشاء صنف جديد في المخزون. يمكنك مراجعة تفاصيله من لوحة التحكم.
            </p>
            %s
            %s
            """.formatted(
                detailsCard(new String[][]{
                        {"اسم الصنف", safe(product.getName())},
                        {"الكود (SKU)", safe(product.getSku())},
                        {"الباركود", product.getBarcode() != null ? product.getBarcode() : "—"},
                        {"السعر الحالي", price},
                        {"الحالة", statusLabel(product.getStatus())},
                        {"بواسطة", actorName != null ? actorName : "النظام"}
                }),
                ctaButton(appUrl + "/products/" + product.getId(), "فتح صفحة الصنف")
        );
        return wrap("صنف جديد — " + safe(product.getName()), body, "إضافة صنف", "#27ae60");
    }

    public static String productPriceChanged(Product product, BigDecimal previousPrice,
                                             BigDecimal newPrice, String actorName, String appUrl) {
        String currency = product.getPriceCurrency() != null ? product.getPriceCurrency() : "DZD";
        String prevStr = formatPrice(previousPrice, currency);
        String newStr  = formatPrice(newPrice, currency);
        String diff    = priceDiffBadge(previousPrice, newPrice, currency);

        String body = """
            <h2 style="margin:0 0 12px;font-size:20px;color:#1f2d3d;">تعديل سعر صنف</h2>
            <p style="margin:0 0 18px;color:#67748e;font-size:14px;line-height:1.6;">
                تم تحديث سعر الصنف <strong>%s</strong>.
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%"
                   style="border-collapse:separate;border-spacing:0;background:#f8f9fa;border-radius:10px;padding:16px;margin-bottom:18px;">
                <tr>
                    <td style="padding:12px;text-align:center;">
                        <div style="color:#8392ab;font-size:12px;margin-bottom:6px;">السعر السابق</div>
                        <div style="font-size:18px;color:#67748e;text-decoration:line-through;">%s</div>
                    </td>
                    <td style="padding:12px;text-align:center;font-size:22px;color:#cb0c9f;">←</td>
                    <td style="padding:12px;text-align:center;">
                        <div style="color:#8392ab;font-size:12px;margin-bottom:6px;">السعر الجديد</div>
                        <div style="font-size:20px;color:#1f2d3d;font-weight:700;">%s</div>
                    </td>
                </tr>
            </table>
            <p style="margin:0 0 16px;text-align:center;">%s</p>
            %s
            %s
            """.formatted(
                safe(product.getName()),
                prevStr,
                newStr,
                diff,
                detailsCard(new String[][]{
                        {"الكود (SKU)", safe(product.getSku())},
                        {"بواسطة", actorName != null ? actorName : "النظام"},
                        {"الوقت", DT.format(OffsetDateTime.now().atZoneSameInstant(ZoneId.of("Africa/Algiers")))}
                }),
                ctaButton(appUrl + "/products/" + product.getId(), "عرض سجل الأسعار")
        );
        return wrap("تعديل سعر — " + safe(product.getName()), body, "تعديل سعر", "#3498db");
    }

    public static String productLowStock(Product product, BigDecimal currentQty, String appUrl) {
        String currency = product.getPriceCurrency() != null ? product.getPriceCurrency() : "DZD";
        String body = """
            <h2 style="margin:0 0 12px;font-size:20px;color:#cb0c9f;">⚠ تنبيه — مخزون منخفض</h2>
            <p style="margin:0 0 18px;color:#67748e;font-size:14px;line-height:1.6;">
                وصل الصنف <strong>%s</strong> إلى الحد الأدنى للمخزون. يُفضّل إعادة الطلب قبل النفاد.
            </p>
            %s
            %s
            """.formatted(
                safe(product.getName()),
                detailsCard(new String[][]{
                        {"الكود (SKU)", safe(product.getSku())},
                        {"الكمية الحالية", currentQty != null ? currentQty.stripTrailingZeros().toPlainString() : "—"},
                        {"الحد الأدنى", product.getMinStockQty() != null ? product.getMinStockQty().stripTrailingZeros().toPlainString() : "—"},
                        {"السعر", formatPrice(product.getCurrentPriceAmount(), currency)}
                }),
                ctaButton(appUrl + "/products/" + product.getId(), "إعادة الطلب")
        );
        return wrap("مخزون منخفض — " + safe(product.getName()), body, "تنبيه مخزون", "#f5365c");
    }

    public static String bulkImportSummary(int created, int updated, int failed,
                                           List<String> sampleProductLines,
                                           String actorName, String appUrl,
                                           boolean attachmentIncluded) {
        int total = created + updated + failed;
        String sample = sampleProductLines == null || sampleProductLines.isEmpty()
                ? "<p style='color:#8392ab;font-size:13px;text-align:center;margin:0;'>لا توجد عينة لعرضها.</p>"
                : sampleListBlock(sampleProductLines);

        String attachmentNote = attachmentIncluded
                ? "<p style='margin:14px 0 0;text-align:center;color:#67748e;font-size:13px;'>📎 القائمة الكاملة مرفقة بهذه الرسالة كملف CSV.</p>"
                : "";

        String body = """
            <h2 style="margin:0 0 12px;font-size:20px;color:#1f2d3d;">ملخص استيراد الأصناف</h2>
            <p style="margin:0 0 18px;color:#67748e;font-size:14px;line-height:1.6;">
                اكتملت عملية الاستيراد بواسطة <strong>%s</strong>. فيما يلي ملخص ما تمت معالجته:
            </p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%"
                   style="border-collapse:separate;border-spacing:8px;margin-bottom:18px;">
                <tr>
                    %s
                    %s
                    %s
                </tr>
            </table>
            <h3 style="margin:18px 0 8px;font-size:14px;color:#67748e;">عينة من الأصناف:</h3>
            %s
            %s
            %s
            """.formatted(
                actorName != null ? actorName : "النظام",
                statBox("تمت إضافتها", created, "#27ae60"),
                statBox("تم تحديثها", updated, "#3498db"),
                statBox("فشلت", failed, failed > 0 ? "#f5365c" : "#8392ab"),
                sample,
                attachmentNote,
                ctaButton(appUrl + "/products", "فتح قائمة الأصناف")
        );
        return wrap("ملخص استيراد — " + total + " صنف", body, "استيراد أصناف", "#cb0c9f");
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static String wrap(String preheader, String inner, String chipLabel, String chipColor) {
        String now = DT.format(OffsetDateTime.now().atZoneSameInstant(ZoneId.of("Africa/Algiers")));
        return """
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin:0;padding:0;background:#f4f6fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Cairo','Tajawal',Arial,sans-serif;">
                <span style="display:none;visibility:hidden;opacity:0;color:transparent;">%s</span>
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f6fb;padding:24px 12px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                                   style="max-width:600px;width:100%%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06);">
                                <tr>
                                    <td style="background:linear-gradient(135deg,#cb0c9f 0%%,#7928ca 100%%);padding:22px 28px;color:#ffffff;">
                                        <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size:18px;font-weight:700;letter-spacing:0.3px;">ALLAL — إدارة الأصناف</td>
                                                <td align="left" style="font-size:11px;opacity:0.9;">%s</td>
                                            </tr>
                                        </table>
                                        <div style="margin-top:10px;">
                                            <span style="display:inline-block;background:%s;color:#ffffff;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;">%s</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:28px;">
                                        %s
                                    </td>
                                </tr>
                                <tr>
                                    <td style="background:#f8f9fa;padding:16px 28px;text-align:center;color:#8392ab;font-size:11px;line-height:1.6;">
                                        رسالة آلية من نظام ALLAL لإدارة الأصناف. يمكنك إيقاف هذه الإشعارات من إعدادات الأصناف.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """.formatted(safe(preheader), safe(preheader), now, chipColor, safe(chipLabel), inner);
    }

    private static String detailsCard(String[][] rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table role='presentation' cellpadding='0' cellspacing='0' border='0' width='100%' " +
                "style=\"border:1px solid #e9ecef;border-radius:10px;border-collapse:separate;border-spacing:0;margin-bottom:18px;\">");
        for (int i = 0; i < rows.length; i++) {
            String bg = i % 2 == 0 ? "#ffffff" : "#fafbfc";
            sb.append(String.format(
                    "<tr><td style=\"padding:11px 16px;background:%s;color:#8392ab;font-size:12px;width:38%%;border-bottom:1px solid #f1f3f5;\">%s</td>" +
                    "<td style=\"padding:11px 16px;background:%s;color:#1f2d3d;font-size:13px;font-weight:600;border-bottom:1px solid #f1f3f5;\">%s</td></tr>",
                    bg, safe(rows[i][0]), bg, safe(rows[i][1])));
        }
        sb.append("</table>");
        return sb.toString();
    }

    private static String ctaButton(String href, String label) {
        return String.format("""
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%%" style="margin-top:8px;">
                <tr><td align="center">
                    <a href="%s" style="display:inline-block;background:linear-gradient(135deg,#cb0c9f 0%%,#7928ca 100%%);color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:8px;">%s</a>
                </td></tr>
            </table>
            """, href, safe(label));
    }

    private static String statBox(String label, int value, String color) {
        return String.format("""
            <td style="background:#f8f9fa;border-radius:10px;padding:16px 8px;text-align:center;">
                <div style="font-size:24px;color:%s;font-weight:700;">%d</div>
                <div style="font-size:11px;color:#8392ab;margin-top:4px;">%s</div>
            </td>
            """, color, value, safe(label));
    }

    private static String sampleListBlock(List<String> lines) {
        StringBuilder sb = new StringBuilder("<ul style='margin:0 0 18px;padding:0 18px;color:#1f2d3d;font-size:13px;line-height:1.8;'>");
        for (String line : lines) {
            sb.append("<li style='margin-bottom:4px;'>").append(safe(line)).append("</li>");
        }
        sb.append("</ul>");
        return sb.toString();
    }

    private static String priceDiffBadge(BigDecimal prev, BigDecimal next, String currency) {
        if (prev == null || next == null) return "";
        BigDecimal diff = next.subtract(prev);
        int cmp = diff.compareTo(BigDecimal.ZERO);
        if (cmp == 0) return "";
        String arrow = cmp > 0 ? "▲" : "▼";
        String color = cmp > 0 ? "#27ae60" : "#f5365c";
        String absVal = diff.abs().stripTrailingZeros().toPlainString();
        return String.format(
                "<span style='display:inline-block;background:%s;color:#ffffff;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;'>%s %s %s</span>",
                color, arrow, absVal, safe(currency));
    }

    private static String formatPrice(BigDecimal amount, String currency) {
        if (amount == null) return "—";
        String c = currency != null && !currency.isBlank() ? currency : "DZD";
        return amount.stripTrailingZeros().toPlainString() + " " + c;
    }

    private static String statusLabel(String status) {
        if (status == null) return "—";
        return switch (status) {
            case "active" -> "نشِط";
            case "inactive" -> "موقوف";
            case "draft" -> "مسودّة";
            default -> status;
        };
    }

    private static String safe(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
