package com.allalarticle.backend.auth.dto;

public record LoginResponse(
        String token,
        long userId,
        String email,
        String name,
        String roleCode,
        String type,
        String schema
) {}
