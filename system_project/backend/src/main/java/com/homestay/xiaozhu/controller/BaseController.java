package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.security.AuthPrincipal;
import com.homestay.xiaozhu.security.AuthService;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;

/**
 * 基础 Controller 类
 * 提供通用的认证和响应方法
 */
public class BaseController {
    @Autowired
    protected AuthService authService;
    
    /**
     * 从请求头中获取当前用户 ID
     * 
     * @param authorizationHeader Authorization 请求头
     * @param tokenHeader token 请求头
     * @return 当前用户 ID，如果是管理员则返回 null
     */
    protected Long getCurrentUserId(String authorizationHeader, String tokenHeader) {
        AuthPrincipal principal = authService.authenticate(authorizationHeader, tokenHeader);
        return principal != null && principal.isUser() ? principal.getId() : null;
    }
    
    /**
     * 判断当前用户是否为管理员
     * 
     * @param authorizationHeader Authorization 请求头
     * @param tokenHeader token 请求头
     * @return true 如果是管理员，否则返回 false
     */
    protected boolean isAdmin(String authorizationHeader, String tokenHeader) {
        AuthPrincipal principal = authService.authenticate(authorizationHeader, tokenHeader);
        return principal != null && principal.isAdmin();
    }

    protected AuthPrincipal getPrincipal(String authorizationHeader, String tokenHeader) {
        return authService.authenticate(authorizationHeader, tokenHeader);
    }
    
    /**
     * 构建成功响应
     * 
     * @param data 响应数据
     * @return 响应 Map
     */
    protected Map<String, Object> success(Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", "操作成功");
        result.put("data", data);
        return result;
    }
    
    /**
     * 构建成功响应（自定义消息）
     * 
     * @param msg 成功消息
     * @param data 响应数据
     * @return 响应 Map
     */
    protected Map<String, Object> success(String msg, Object data) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("msg", msg);
        result.put("data", data);
        return result;
    }
    
    /**
     * 构建错误响应
     * 
     * @param code 错误代码
     * @param msg 错误消息
     * @return 响应 Map
     */
    protected Map<String, Object> error(int code, String msg) {
        Map<String, Object> result = new HashMap<>();
        result.put("code", code);
        result.put("msg", msg);
        return result;
    }
    
    /**
     * 构建错误响应（默认 500）
     * 
     * @param msg 错误消息
     * @return 响应 Map
     */
    protected Map<String, Object> error(String msg) {
        return error(500, msg);
    }
}
