package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.Room;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import javax.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long>, JpaSpecificationExecutor<Room> {
    Page<Room> findByHomestayId(Long homestayId, Pageable pageable);
    Page<Room> findByHomestayIdAndNameContaining(Long homestayId, String keyword, Pageable pageable);
    void deleteByHomestayId(Long homestayId);
    long countByHomestayId(Long homestayId);

    // 查询房型分布
    @Query("SELECT r.bedType, COUNT(r) FROM Room r GROUP BY r.bedType")
    List<Object[]> findRoomTypeDistribution();

    @Query("SELECT MIN(r.price) FROM Room r WHERE r.homestayId = :homestayId")
    java.math.BigDecimal findMinPriceByHomestayId(Long homestayId);

    @Query("SELECT COUNT(r) FROM Room r")
    long count();

    // ================== 个性化推荐相关查询 ==================

    /**
     * 查询所有在架房源
     */
    List<Room> findByStatus(Integer status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.id = :id")
    Optional<Room> findByIdForUpdate(@Param("id") Long id);
}
