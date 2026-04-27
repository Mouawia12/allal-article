package com.allalarticle.backend.reference.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wilayas")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Wilaya {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 3)
    private String code;

    @Column(name = "name_ar", nullable = false, length = 100)
    private String nameAr;

    @Column(name = "name_fr", length = 100)
    private String nameFr;

    @Column(name = "is_active", nullable = false)
    private boolean active;
}
