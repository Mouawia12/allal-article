package com.allalarticle.backend.accounting.controller;

import com.allalarticle.backend.accounting.dto.*;
import com.allalarticle.backend.accounting.service.AccountBalanceService;
import com.allalarticle.backend.common.response.ApiResponse;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounting/reports")
@RequiredArgsConstructor
public class ReportController {

    private final AccountBalanceService service;

    @GetMapping("/trial-balance")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.reports')")
    public ResponseEntity<ApiResponse<TrialBalanceResponse>> trialBalance(
            @RequestParam Long fiscalYearId, @RequestParam Long periodId) {
        return ResponseEntity.ok(ApiResponse.ok(service.trialBalance(fiscalYearId, periodId)));
    }

    @GetMapping("/balance-sheet")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.reports')")
    public ResponseEntity<ApiResponse<BalanceSheetResponse>> balanceSheet(
            @RequestParam Long fiscalYearId, @RequestParam Long periodId) {
        return ResponseEntity.ok(ApiResponse.ok(service.balanceSheet(fiscalYearId, periodId)));
    }

    @GetMapping("/income-statement")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.reports')")
    public ResponseEntity<ApiResponse<IncomeStatementResponse>> incomeStatement(
            @RequestParam Long fiscalYearId, @RequestParam Long periodId) {
        return ResponseEntity.ok(ApiResponse.ok(service.incomeStatement(fiscalYearId, periodId)));
    }

    @GetMapping("/general-ledger")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.reports')")
    public ResponseEntity<ApiResponse<GeneralLedgerResponse>> generalLedger(
            @RequestParam Long accountId, @RequestParam Long fiscalYearId) {
        return ResponseEntity.ok(ApiResponse.ok(service.generalLedger(accountId, fiscalYearId)));
    }

    @PostMapping("/opening-balances")
    @PreAuthorize("@permChecker.hasPermission(authentication, 'accounting.manage')")
    public ResponseEntity<ApiResponse<Void>> saveOpeningBalances(
            @Valid @RequestBody OpeningBalanceRequest req, Authentication auth) {
        service.saveOpeningBalances(req, extractUserId(auth));
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private Long extractUserId(Authentication auth) {
        if (auth instanceof UsernamePasswordAuthenticationToken t && t.getDetails() instanceof Claims claims) {
            return claims.get("userId", Long.class);
        }
        return null;
    }
}
