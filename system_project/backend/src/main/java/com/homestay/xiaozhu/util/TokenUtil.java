package com.homestay.xiaozhu.util;

/**
 * Token 解析工具类
 * 统一处理用户 token 和管理员 token 的解析逻辑
 */
public class TokenUtil {
    
    /**
     * 从请求头中提取实际 token
     * 支持 Authorization 和 token 两种请求头
     * 
     * @param authorizationHeader Authorization 请求头
     * @param tokenHeader token 请求头
     * @return 实际的 token 值
     */
    public static String extractActualToken(String authorizationHeader, String tokenHeader) {
        // 优先从 Authorization 中提取
        if (authorizationHeader != null && !authorizationHeader.isEmpty()) {
            if (authorizationHeader.startsWith("Bearer ")) {
                return authorizationHeader.substring(7); // 移除 "Bearer " 前缀
            }
            return authorizationHeader;
        }
        
        // 其次从 token 中提取
        if (tokenHeader != null && !tokenHeader.isEmpty()) {
            return tokenHeader;
        }
        
        return null;
    }
}
