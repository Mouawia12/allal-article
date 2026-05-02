package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.accounting.entity.JournalBook;
import com.allalarticle.backend.accounting.repository.JournalBookRepository;
import com.allalarticle.backend.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounting/journal-books")
@RequiredArgsConstructor
public class JournalBookController {

    private final JournalBookRepository repo;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> list() {
        List<Map<String, Object>> books = repo.findAll().stream()
                .map(b -> Map.<String, Object>of(
                        "id",               b.getId(),
                        "code",             b.getCode(),
                        "type",             b.getBookType(),
                        "name",             b.getNameAr(),
                        "prefix",           b.getDefaultPrefix(),
                        "yearFormat",       b.getYearFormat(),
                        "requireApproval",  b.isRequiresApproval(),
                        "allowManual",      b.isAllowsManual(),
                        "isSystem",         b.isSystem(),
                        "active",           b.isActive()
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(books));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        repo.findById(id).ifPresent(b -> {
            if (body.containsKey("name"))           b.setNameAr((String) body.get("name"));
            if (body.containsKey("prefix"))         b.setDefaultPrefix((String) body.get("prefix"));
            if (body.containsKey("requireApproval")) b.setRequiresApproval(Boolean.TRUE.equals(body.get("requireApproval")));
            if (body.containsKey("allowManual"))    b.setAllowsManual(Boolean.TRUE.equals(body.get("allowManual")));
            if (body.containsKey("active"))         b.setActive(Boolean.TRUE.equals(body.get("active")));
            repo.save(b);
        });
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
