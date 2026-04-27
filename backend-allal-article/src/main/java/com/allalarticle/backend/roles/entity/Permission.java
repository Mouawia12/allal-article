package com.allalarticle.backend.roles.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "permissions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class Permission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String code;

    @Column(nullable = false, length = 50)
    private String module;

    @Column(name = "name_ar", nullable = false, length = 150)
    private String nameAr;

    private String description;

    @Column(name = "required_plan_feature_code", length = 80)
    private String requiredPlanFeatureCode;

    @Column(name = "ui_route", length = 180)
    private String uiRoute;

    @Column(name = "ui_action_key", length = 120)
    private String uiActionKey;

    @Column(name = "is_visible_to_all", nullable = false)
    private boolean visibleToAll;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
