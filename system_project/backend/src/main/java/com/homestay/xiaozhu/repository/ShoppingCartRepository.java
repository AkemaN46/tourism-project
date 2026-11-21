package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.ShoppingCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Repository
public interface ShoppingCartRepository extends JpaRepository<ShoppingCart, Long> {
    ShoppingCart findByUserIdAndRoomIdAndCheckInDate(Long userId, Long roomId, Date checkInDate);

    ShoppingCart findByIdAndUserId(Long id, Long userId);

    void deleteByUserId(Long userId);

    void deleteByIdAndUserId(Long id, Long userId);

    @Query(value = "SELECT sc.id as id, sc.user_id as userId, sc.room_id as roomId, " +
                   "sc.check_in_date as checkInDate, sc.check_out_date as checkOutDate, sc.created_at as createdAt, " +
                   "r.name as roomName, r.cover_image as coverImage, r.price as price, " +
                   "DATEDIFF(sc.check_out_date, sc.check_in_date) as nights " +
                   "FROM shopping_cart sc " +
                   "LEFT JOIN rooms r ON sc.room_id = r.id " +
                   "WHERE sc.user_id = :userId", nativeQuery = true)
    List<Map<String, Object>> findCartItemsByUserId(@Param("userId") Long userId);
}
