package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.Admin;
import com.homestay.xiaozhu.service.AdminService;
import com.homestay.xiaozhu.security.AuthPrincipal;
import com.homestay.xiaozhu.security.RequireAdmin;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController extends BaseController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestParam String username, @RequestParam String password) {
        Map<String, Object> result = new HashMap<>();
        
        Admin admin = adminService.findByUsername(username == null ? "" : username.trim()).orElse(null);
        boolean passwordValid = false;
        if (admin != null && Integer.valueOf(1).equals(admin.getStatus()) && admin.getPassword() != null) {
            try {
                passwordValid = passwordEncoder.matches(password, admin.getPassword());
            } catch (IllegalArgumentException ignored) {
                passwordValid = false;
            }
        }
        if (passwordValid) {
            admin.setLastLogin(new java.util.Date());
            adminService.save(admin);
            result.put("code", 200);
            result.put("msg", "登录成功");
            Map<String, Object> data = new HashMap<>();
            data.put("token", authService.issueAdminToken(admin.getId()));
            data.put("adminId", admin.getId());
            data.put("role", admin.getRole());
            result.put("data", data);
        } else {
            result.put("code", 401);
            result.put("msg", "用户名或密码错误");
        }
        
        return result;
    }

    @GetMapping("/info")
    @RequireAdmin
    public Map<String, Object> getAdminInfo(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "token", required = false) String token) {
        AuthPrincipal principal = getPrincipal(authorization, token);
        Admin admin = principal == null ? null : adminService.findById(principal.getId()).orElse(null);
        if (admin == null) {
            return error(401, "管理员登录状态无效");
        }
        admin.setPassword(null);
        return success("获取成功", admin);
    }
}
