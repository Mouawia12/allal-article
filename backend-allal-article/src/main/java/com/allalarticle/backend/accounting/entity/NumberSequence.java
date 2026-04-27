package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "number_sequences")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class NumberSequence {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sequence_key", nullable = false, unique = true, length = 80)
    private String sequenceKey;

    @Column(nullable = false, length = 30)
    private String prefix;

    @Column(name = "next_number", nullable = false)
    @Builder.Default
    private long nextNumber = 1L;

    @Column(nullable = false)
    @Builder.Default
    private short padding = 5;

    @Column(name = "fiscal_year_id")
    private Long fiscalYearId;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    public String generateAndIncrement() {
        String num = String.format("%0" + padding + "d", nextNumber++);
        return prefix + "-" + num;
    }
}
