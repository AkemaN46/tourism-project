package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface RoomStatusRepository extends JpaRepository<RoomStatus, Long> {
    
    // 查询房型在日期范围内的房态
    List<RoomStatus> findByRoomIdAndDateBetween(Long roomId, Date startDate, Date endDate);
    
    // 查询指定日期的房态
    RoomStatus findByRoomIdAndDate(Long roomId, Date date);
}
