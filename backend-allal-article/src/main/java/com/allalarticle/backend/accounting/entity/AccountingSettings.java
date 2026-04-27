package com.allalarticle.backend.accounting.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "accounting_settings")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class AccountingSettings {

    @Id
    @Column(name = "setting_key", nullable = false, length = 80)
    private String settingKey;

    @Column(name = "setting_value", nullable = false, length = 200)
    private String settingValue;

    @Column(length = 300)
    private String description;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
