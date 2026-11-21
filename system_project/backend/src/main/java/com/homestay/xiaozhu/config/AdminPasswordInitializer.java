package com.homestay.xiaozhu.config;

import com.homestay.xiaozhu.entity.Admin;
import com.homestay.xiaozhu.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminPasswordInitializer implements CommandLineRunner {
    private static final String LEGACY_PLACEHOLDER_PREFIX = "$2a$10$2a.0fQJz";

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.initial-password:admin123}")
    private String initialPassword;

    public AdminPasswordInitializer(AdminRepository adminRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        adminRepository.findAll().stream()
                .filter(admin -> admin.getPassword() == null
                        || admin.getPassword().startsWith(LEGACY_PLACEHOLDER_PREFIX))
                .forEach(admin -> {
                    admin.setPassword(passwordEncoder.encode(initialPassword));
                    adminRepository.save(admin);
                });
    }
}
