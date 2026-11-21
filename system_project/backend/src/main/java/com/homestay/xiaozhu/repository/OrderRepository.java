package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order> {
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Order> findByStatusOrderByCreatedAtDesc(Integer status, Pageable pageable);
    Page<Order> findByUserIdAndStatusNotInOrderByCreatedAtDesc(Long userId, List<Integer> excludeStatus, Pageable pageable);

    // 查询今日收入
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE DATE(o.createdAt) = DATE(:date) AND o.status IN (1, 2, 3)")
    BigDecimal findTodayIncome(@Param("date") Date date);
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    // 查询每日收入
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE DATE(o.createdAt) = :date AND o.status IN (1, 2, 3)")
    List<Object[]> findDailyIncome(@Param("date") String date);

    // 统计今日订单数
    @Query("SELECT COUNT(o) FROM Order o WHERE DATE(o.createdAt) = DATE(:date)")
    Long countTodayOrders(@Param("date") Date date);

    // 统计已入住的房间数
    @Query("SELECT COUNT(DISTINCT o.roomId) FROM Order o WHERE o.status = 2 AND DATE(o.checkInDate) <= CURRENT_DATE AND DATE(o.checkOutDate) >= CURRENT_DATE")
    Long countOccupiedRooms();

    // 查找最新订单
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.userId = :userId AND o.status NOT IN (4, 5)")
    Long countValidOrdersByUserId(@Param("userId") Long userId);

    // ================== 个性化推荐相关查询 ==================

    /**
     * 查询用户的历史有效订单（已支付 / 已入住 / 已完成）
     * 用于构建用户行为画像
     */
    @Query("SELECT o FROM Order o WHERE o.userId = :userId AND o.status IN (1, 2, 3)")
    List<Order> findHistoryOrdersByUserId(@Param("userId") Long userId);

    /**
     * 统计每个房源的历史成交次数（已支付 / 已入住 / 已完成）
     * 用于计算房源的全局热门度
     */
    @Query("SELECT o.roomId, COUNT(o) FROM Order o WHERE o.status IN (1, 2, 3) GROUP BY o.roomId")
    List<Object[]> countCompletedOrdersByRoom();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.roomId = :roomId AND o.status IN (0, 1, 2) " +
            "AND DATE(o.checkInDate) <= :date AND DATE(o.checkOutDate) > :date")
    long countActiveBookingsForDate(@Param("roomId") Long roomId, @Param("date") Date date);

}
