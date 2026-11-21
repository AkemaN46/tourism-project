package com.homestay.xiaozhu.service.impl;

import com.homestay.xiaozhu.entity.User;
import com.homestay.xiaozhu.repository.UserRepository;
import com.homestay.xiaozhu.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findByOpenid(String openid) {
        return userRepository.findByOpenid(openid);
    }

    @Override
    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
    }
}