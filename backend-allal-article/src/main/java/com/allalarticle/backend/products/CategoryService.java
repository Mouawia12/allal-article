package com.allalarticle.backend.products;

import com.allalarticle.backend.common.exception.AppException;
import com.allalarticle.backend.common.exception.ErrorCode;
import com.allalarticle.backend.common.response.PageResponse;
import com.allalarticle.backend.products.dto.CategoryRequest;
import com.allalarticle.backend.products.dto.CategoryResponse;
import com.allalarticle.backend.products.entity.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepo;

    @Transactional(readOnly = true)
    public List<CategoryResponse> listAll() {
        return categoryRepo.findByActiveTrueOrderBySortOrderAscNameAsc()
                .stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<CategoryResponse> search(String q, Pageable pageable) {
        return PageResponse.from(
                categoryRepo.findByActiveTrueAndNameContainingIgnoreCase(q, pageable)
                        .map(CategoryResponse::from));
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        return categoryRepo.findById(id)
                .filter(Category::isActive)
                .map(CategoryResponse::from)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        var builder = Category.builder()
                .name(req.name())
                .slug(req.slug())
                .description(req.description())
                .sortOrder(req.sortOrder());

        if (req.parentId() != null) {
            var parent = categoryRepo.findById(req.parentId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Parent category not found", HttpStatus.NOT_FOUND));
            builder.parent(parent);
        }

        return CategoryResponse.from(categoryRepo.save(builder.build()));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        var cat = categoryRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
        cat.setName(req.name());
        cat.setSlug(req.slug());
        cat.setDescription(req.description());
        cat.setSortOrder(req.sortOrder());
        if (req.parentId() != null) {
            var parent = categoryRepo.findById(req.parentId())
                    .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Parent category not found", HttpStatus.NOT_FOUND));
            cat.setParent(parent);
        } else {
            cat.setParent(null);
        }
        return CategoryResponse.from(categoryRepo.save(cat));
    }

    @Transactional
    public void deactivate(Long id) {
        var cat = categoryRepo.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND));
        cat.setActive(false);
        categoryRepo.save(cat);
    }
}
