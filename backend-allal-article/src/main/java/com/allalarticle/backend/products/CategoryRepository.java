package com.allalarticle.backend.products;

import com.allalarticle.backend.products.entity.Category;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByActiveTrueOrderBySortOrderAscNameAsc();

    Page<Category> findByActiveTrueAndNameContainingIgnoreCase(String name, Pageable pageable);
}
