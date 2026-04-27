package com.allalarticle.backend.reference.dto;

import com.allalarticle.backend.reference.entity.Wilaya;

public record WilayaResponse(Long id, String code, String nameAr, String nameFr, boolean active) {
    public static WilayaResponse from(Wilaya w) {
        return new WilayaResponse(w.getId(), w.getCode(), w.getNameAr(), w.getNameFr(), w.isActive());
    }
}
