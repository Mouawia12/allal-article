package com.allalarticle.backend.documents.repository;

import com.allalarticle.backend.documents.entity.RoadInvoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.Optional;

public interface RoadInvoiceRepository extends JpaRepository<RoadInvoice, Long> {
    Optional<RoadInvoice> findByInvoiceNumber(String invoiceNumber);

    Page<RoadInvoice> findByStatus(String status, Pageable pageable);

    @Query("SELECT ri FROM RoadInvoice ri WHERE ri.wilaya.id = :wilayaId AND ri.invoiceDate BETWEEN :from AND :to ORDER BY ri.invoiceDate DESC")
    Page<RoadInvoice> findByWilayaAndDateRange(Long wilayaId, LocalDate from, LocalDate to, Pageable pageable);

    Page<RoadInvoice> findByCustomerIdAndInvoiceDateBetween(Long customerId, LocalDate from, LocalDate to, Pageable pageable);
}
