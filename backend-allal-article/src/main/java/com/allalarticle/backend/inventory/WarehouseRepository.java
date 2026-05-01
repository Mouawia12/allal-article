package com.allalarticle.backend.inventory;

import com.allalarticle.backend.inventory.entity.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WarehouseRepository extends JpaRepository<Warehouse, Long> {

    List<Warehouse> findByActiveTrueOrderByNameAsc();

    Optional<Warehouse> findByCode(String code);

    Optional<Warehouse> findByIsDefaultTrue();

    boolean existsByCode(String code);
}
