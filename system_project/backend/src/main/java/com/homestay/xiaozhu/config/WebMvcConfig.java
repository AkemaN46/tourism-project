package com.homestay.xiaozhu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import com.homestay.xiaozhu.security.AuthInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    private final AuthInterceptor authInterceptor;

    public WebMvcConfig(AuthInterceptor authInterceptor) {
        this.authInterceptor = authInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/**");
    }
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 保留原有静态资源映射（图片访问功能不变）
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:./uploads/images/");
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        // 关键：只使用addAllowedOriginPattern（Spring 5.3+推荐，支持通配符）
        // 不要用addAllowedOrigin，避免和通配符冲突
        config.addAllowedOriginPattern("*");
        // 允许所有请求头（包含小程序传递的token等）
        config.addAllowedHeader("*");
        // 允许所有HTTP方法（GET/POST/PUT/DELETE/OPTIONS等）
        config.addAllowedMethod("*");
        // 允许携带Cookie（如果小程序需要传递登录态）
        config.setAllowCredentials(true);
        // 预检请求有效期，减少OPTIONS请求次数
        config.setMaxAge(3600L);
        // 允许暴露自定义响应头（比如token）
        config.addExposedHeader("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // 对所有接口生效
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
