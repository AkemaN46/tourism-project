package com.homestay.xiaozhu.service;

import com.homestay.xiaozhu.entity.Admin;

import java.util.Optional;

public interface AdminService {
    Admin save(Admin admin);
    Optional<Admin> findByUsername(String username);
    Optional<Admin> findById(Long id);
}
