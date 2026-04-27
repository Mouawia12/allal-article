package com.allalarticle.backend.storage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "media_assets")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MediaAsset {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", nullable = false, updatable = false)
    @Builder.Default
    private UUID publicId = UUID.randomUUID();

    @Column(name = "owner_type", length = 80)
    private String ownerType;

    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "storage_provider", nullable = false, length = 40)
    @Builder.Default
    private String storageProvider = "cloudflare_r2";

    @Column(name = "bucket_name", nullable = false, length = 120)
    private String bucketName;

    @Column(name = "object_key", nullable = false)
    private String objectKey;

    @Column(name = "public_url")
    private String publicUrl;

    @Column(name = "original_filename", length = 240)
    private String originalFilename;

    @Column(name = "mime_type", length = 120)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    @Column(length = 20)
    private String extension;

    @Column(length = 180)
    private String title;

    @Column(name = "alt_text", length = 240)
    private String altText;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata_json", columnDefinition = "jsonb")
    private Map<String, Object> metadataJson;

    @Column(name = "created_by")
    private Long createdById;

    @CreationTimestamp private OffsetDateTime createdAt;
    @UpdateTimestamp  private OffsetDateTime updatedAt;
    @Column(name = "deleted_at") private OffsetDateTime deletedAt;
}
