package com.homestay.xiaozhu.service;

import com.homestay.xiaozhu.entity.User;

import java.util.Optional;

public interface UserService {
    User save(User user);
    Optional<User> findById(Long id);
    Optional<User> findByOpenid(String openid);
    Optional<User> findByPhone(String phone);
}