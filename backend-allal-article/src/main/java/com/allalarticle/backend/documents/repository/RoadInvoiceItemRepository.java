package com.allalarticle.backend.documents.repository;

import com.allalarticle.backend.documents.entity.RoadInvoiceItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoadInvoiceItemRepository extends JpaRepository<RoadInvoiceItem, Long> {
    List<RoadInvoiceItem> findByRoadInvoiceId(Long roadInvoiceId);
}
