package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.News;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsRepository extends JpaRepository<News, Long>, JpaSpecificationExecutor<News> {
    Page<News> findByCategoryIdAndStatusOrderBySortOrderDescPublishedAtDesc(Long categoryId, Integer status, Pageable pageable);
    Page<News> findByStatusOrderBySortOrderDescPublishedAtDesc(Integer status, Pageable pageable);
}