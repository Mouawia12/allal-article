package com.allalarticle.backend.reference;

import com.allalarticle.backend.reference.entity.Wilaya;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WilayaRepository extends JpaRepository<Wilaya, Long> {

    List<Wilaya> findByActiveTrueOrderByCode();
}
