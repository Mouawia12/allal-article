package com.allalarticle.backend.storage.repository;

import com.allalarticle.backend.storage.entity.MediaAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {
    List<MediaAsset> findByOwnerTypeAndOwnerIdAndDeletedAtIsNull(String ownerType, Long ownerId);
}
