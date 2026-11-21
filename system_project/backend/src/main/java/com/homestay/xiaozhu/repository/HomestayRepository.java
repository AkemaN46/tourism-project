package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.Homestay;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, Long>, JpaSpecificationExecutor<Homestay> {
    Page<Homestay> findByStatus(Integer status, Pageable pageable);
    Page<Homestay> findByNameContainingAndStatus(String keyword, Integer status, Pageable pageable);
}