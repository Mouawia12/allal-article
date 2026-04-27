package com.allalarticle.backend.documents.repository;

import com.allalarticle.backend.documents.entity.RoadInvoiceWilayaDefault;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoadInvoiceWilayaDefaultRepository extends JpaRepository<RoadInvoiceWilayaDefault, Long> {
    Optional<RoadInvoiceWilayaDefault> findByWilayaId(Long wilayaId);
}
