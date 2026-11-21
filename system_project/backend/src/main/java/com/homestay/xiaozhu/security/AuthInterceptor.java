package com.homestay.xiaozhu.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
public class AuthInterceptor implements HandlerInterceptor {
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public AuthInterceptor(AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        HandlerMethod method = (HandlerMethod) handler;
        boolean requireAdmin = method.hasMethodAnnotation(RequireAdmin.class)
                || method.getBeanType().isAnnotationPresent(RequireAdmin.class);
        boolean requireUser = method.hasMethodAnnotation(RequireUser.class)
                || method.getBeanType().isAnnotationPresent(RequireUser.class);
        boolean requireLogin = method.hasMethodAnnotation(RequireLogin.class)
                || method.getBeanType().isAnnotationPresent(RequireLogin.class);

        if (!requireAdmin && !requireUser && !requireLogin) {
            return true;
        }

        AuthPrincipal principal = authService.authenticate(
                request.getHeader("Authorization"), request.getHeader("token"));
        if (principal == null) {
            writeError(response, 401, "登录状态无效或已过期");
            return false;
        }
        if (requireAdmin && !principal.isAdmin()) {
            writeError(response, 403, "需要管理员权限");
            return false;
        }
        if (requireUser && !principal.isUser()) {
            writeError(response, 403, "需要用户权限");
            return false;
        }
        request.setAttribute("authPrincipal", principal);
        return true;
    }

    private void writeError(HttpServletResponse response, int code, String message) throws Exception {
        response.setStatus(code);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json;charset=UTF-8");
        Map<String, Object> body = new HashMap<>();
        body.put("code", code);
        body.put("msg", message);
        objectMapper.writeValue(response.getWriter(), body);
    }
}
