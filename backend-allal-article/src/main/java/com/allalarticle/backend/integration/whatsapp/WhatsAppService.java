package com.allalarticle.backend.integration.whatsapp;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.documents.entity.RoadInvoice;
import com.allalarticle.backend.documents.repository.RoadInvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class WhatsAppService {

    private final WhatsAppClient client;
    private final RoadInvoiceRepository invoiceRepo;

    @Transactional
    public boolean sendRoadInvoice(Long invoiceId, String toPhone) {
        RoadInvoice invoice = invoiceRepo.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "فاتورة الطريق غير موجودة", HttpStatus.NOT_FOUND));

        String message = buildInvoiceMessage(invoice);
        boolean sent = client.sendTextMessage(toPhone, message);

        if (sent) {
            invoice.setWhatsappSentAt(OffsetDateTime.now());
            invoiceRepo.save(invoice);
        }
        return sent;
    }

    private String buildInvoiceMessage(RoadInvoice invoice) {
        StringBuilder sb = new StringBuilder();
        sb.append("فاتورة طريق رقم: ").append(invoice.getInvoiceNumber()).append("\n");
        sb.append("التاريخ: ").append(invoice.getInvoiceDate()).append("\n");
        if (invoice.getCustomer() != null) {
            sb.append("العميل: ").append(invoice.getCustomer().getName()).append("\n");
        }
        if (invoice.getWilaya() != null) {
            sb.append("الولاية: ").append(invoice.getWilaya().getNameAr()).append("\n");
        }
        sb.append("الوزن الإجمالي: ").append(invoice.getTotalWeight()).append(" كغ\n");
        sb.append("عدد الأصناف: ").append(invoice.getItems().size());
        return sb.toString();
    }
}
