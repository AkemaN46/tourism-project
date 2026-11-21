package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByUserIdAndRoomId(Long userId, Long roomId);

    void deleteByUserIdAndRoomId(Long userId, Long roomId);

    boolean existsByUserIdAndRoomId(Long userId, Long roomId);

    @Query("SELECT f FROM Favorite f WHERE f.userId = :userId")
    List<Favorite> findByUserId(@Param("userId") Long userId);

    @Query(value = "SELECT f.id as id, f.user_id as userId, f.room_id as roomId, f.created_at as createdAt, " +
                   "r.name as roomName, r.cover_image as coverImage, r.price as price, r.description as description " +
                   "FROM favorites f " +
                   "LEFT JOIN rooms r ON f.room_id = r.id " +
                   "WHERE f.user_id = :userId", nativeQuery = true)
    List<Map<String, Object>> findFavoritesByUserId(@Param("userId") Long userId);

    // ================== 个性化推荐相关查询 ==================

    /**
     * 统计每个房源被收藏的次数
     * 用于计算房源的全局热门度
     */
    @Query("SELECT f.roomId, COUNT(f) FROM Favorite f GROUP BY f.roomId")
    List<Object[]> countFavoritesByRoom();
}