package com.homestay.xiaozhu.repository;

import com.homestay.xiaozhu.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<User> {
    Optional<User> findByOpenid(String openid);
    Optional<User> findByPhone(String phone);
    // 统计今日新增用户
    @Query("SELECT COUNT(u) FROM User u WHERE DATE(u.createdAt) = DATE(:date)")
    Long countTodayUsers(@Param("date") Date date);
}
