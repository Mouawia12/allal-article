package com.allalarticle.backend.returns.entity;

import com.allalarticle.backend.customers.entity.Customer;
import com.allalarticle.backend.orders.entity.Order;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "returns")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Return {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "return_number", nullable = false, unique = true, length = 50)
    private String returnNumber;

    @Column(name = "origin_channel", nullable = false, length = 40)
    @Builder.Default
    private String originChannel = "manual";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(name = "return_date", nullable = false)
    private LocalDate returnDate;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "pending";

    private String notes;

    @Column(name = "received_by") private Long receivedById;
    @Column(name = "created_by")  private Long createdById;

    @OneToMany(mappedBy = "returnEntity", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReturnItem> items = new ArrayList<>();

    @CreationTimestamp private OffsetDateTime createdAt;
}
