package com.homestay.xiaozhu.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // 1. 关闭CSRF（小程序无状态请求，必关）
        http.csrf().disable()
                // 2. 所有请求都允许匿名访问，彻底关闭认证拦截
                .authorizeRequests()
                .anyRequest().permitAll()
                // 3. 关闭表单登录、HTTP Basic认证、会话管理（小程序不需要）
                .and().formLogin().disable()
                .httpBasic().disable()
                .sessionManagement().disable();
    }

    // 保留密码编码器（避免Spring Security启动报错）
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}