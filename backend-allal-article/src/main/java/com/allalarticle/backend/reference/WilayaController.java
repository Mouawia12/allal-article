package com.allalarticle.backend.reference;

import com.allalarticle.backend.common.response.ApiResponse;
import com.allalarticle.backend.reference.dto.WilayaResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wilayas")
@RequiredArgsConstructor
public class WilayaController {

    private final WilayaRepository wilayaRepo;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WilayaResponse>>> list() {
        var result = wilayaRepo.findByActiveTrueOrderByCode().stream()
                .map(WilayaResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
