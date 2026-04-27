package com.allalarticle.backend.storage.controller;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.storage.dto.MediaAssetResponse;
import com.allalarticle.backend.storage.service.R2StorageService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final R2StorageService storageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MediaAssetResponse>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) Long ownerId,
            Authentication auth) {
        var asset = storageService.upload(file, ownerType, ownerId, extractUserId(auth));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(MediaAssetResponse.from(asset)));
    }

    @GetMapping("/by-owner")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<MediaAssetResponse>>> byOwner(
            @RequestParam String ownerType,
            @RequestParam Long ownerId) {
        var assets = storageService.findByOwner(ownerType, ownerId).stream()
                .map(MediaAssetResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(assets));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'media.delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        storageService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
