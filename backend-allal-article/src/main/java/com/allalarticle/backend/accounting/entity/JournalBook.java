package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "journal_books")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class JournalBook {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(name = "name_ar", nullable = false, length = 120)
    private String nameAr;

    @Column(name = "book_type", nullable = false, length = 40)
    private String bookType;

    @Column(name = "default_prefix", nullable = false, length = 20)
    private String defaultPrefix;

    @Column(name = "year_format", nullable = false, length = 20)
    @Builder.Default
    private String yearFormat = "YYYY";

    @Column(name = "allows_manual", nullable = false)
    @Builder.Default
    private boolean allowsManual = true;

    @Column(name = "requires_approval", nullable = false)
    @Builder.Default
    private boolean requiresApproval = false;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private boolean system = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
