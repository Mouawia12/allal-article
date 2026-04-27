package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.products.dto.ProductRequest;
import com.allalarticle.backend.products.dto.ProductResponse;
import com.allalarticle.backend.products.entity.Product;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final ProductUnitRepository unitRepo;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> list(String q, Long categoryId, Pageable pageable) {
        var page = (q != null && !q.isBlank())
                ? productRepo.search(q.trim(), pageable)
                : (categoryId != null)
                    ? productRepo.findByCategory(categoryId, pageable)
                    : productRepo.findByDeletedAtIsNull(pageable);
        return PageResponse.from(page.map(ProductResponse::from));
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        return productRepo.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .map(ProductResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public ProductResponse create(ProductRequest req) {
        if (productRepo.existsBySku(req.sku())) {
            throw new AppException(ErrorCode.CONFLICT, "SKU already exists", HttpStatus.CONFLICT);
        }
        var unit = unitRepo.findById(req.baseUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Unit not found", HttpStatus.NOT_FOUND));

        var builder = Product.builder()
                .sku(req.sku())
                .name(req.name())
                .baseUnit(unit)
                .barcode(req.barcode())
                .currentPriceAmount(req.currentPriceAmount())
                .description(req.description())
                .status(req.status() != null ? req.status() : "active");

        if (req.unitsPerPackage() != null) builder.unitsPerPackage(req.unitsPerPackage());
        if (req.minStockQty()     != null) builder.minStockQty(req.minStockQty());
        if (req.categoryId()      != null) {
            var cat = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
            builder.category(cat);
        }

        return ProductResponse.from(productRepo.save(builder.build()));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest req) {
        var product = productRepo.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));

        if (!product.getSku().equals(req.sku()) && productRepo.existsBySku(req.sku())) {
            throw new AppException(ErrorCode.CONFLICT, "SKU already exists", HttpStatus.CONFLICT);
        }

        var unit = unitRepo.findById(req.baseUnitId())
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Unit not found", HttpStatus.NOT_FOUND));

        product.setSku(req.sku());
        product.setName(req.name());
        product.setBaseUnit(unit);
        product.setBarcode(req.barcode());
        product.setCurrentPriceAmount(req.currentPriceAmount());
        product.setDescription(req.description());
        if (req.status()          != null) product.setStatus(req.status());
        if (req.unitsPerPackage() != null) product.setUnitsPerPackage(req.unitsPerPackage());
        if (req.minStockQty()     != null) product.setMinStockQty(req.minStockQty());
        if (req.categoryId()      != null) {
            var cat = categoryRepo.findById(req.categoryId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
            product.setCategory(cat);
        } else {
            product.setCategory(null);
        }

        return ProductResponse.from(productRepo.save(product));
    }

    @Transactional
    public void delete(Long id) {
        var product = productRepo.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND));
        product.setDeletedAt(OffsetDateTime.now());
        productRepo.save(product);
    }
}
