package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long>, JpaSpecificationExecutor<Review> {
    Page<Review> findByRoomIdAndStatusOrderByCreatedAtDesc(Long roomId, Integer status, Pageable pageable);
    Page<Review> findByStatusOrderByCreatedAtDesc(Integer status, Pageable pageable);

    // 查找待审核的评价
    Page<Review> findByStatus(Integer status, Pageable pageable);

    // 根据订单ID和用户ID查找评价
    Optional<Review> findByOrderIdAndUserId(Long orderId, Long userId);

}