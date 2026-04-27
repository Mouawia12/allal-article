package com.allalarticle.backend.documents.entity;

import com.allalarticle.backend.customers.entity.Customer;
import com.allalarticle.backend.reference.entity.Wilaya;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "road_invoice_wilaya_defaults")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class RoadInvoiceWilayaDefault {

    @Id
    @Column(name = "wilaya_id")
    private Long wilayaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wilaya_id", insertable = false, updatable = false)
    private Wilaya wilaya;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "updated_by")
    private Long updatedById;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
