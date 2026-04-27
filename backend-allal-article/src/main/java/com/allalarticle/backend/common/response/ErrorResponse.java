package com.allalarticle.backend.common.response;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
        boolean success,
        String code,
        String message,
        List<FieldError> errors,
        Instant timestamp
) {

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(false, code, message, List.of(), Instant.now());
    }

    public static ErrorResponse of(String code, String message, List<FieldError> errors) {
        return new ErrorResponse(false, code, message, errors, Instant.now());
    }

    public record FieldError(String field, String message) {
    }
}
