package com.homestay.xiaozhu.controller;

import com.homestay.xiaozhu.entity.Order;
import com.homestay.xiaozhu.entity.User;
import com.homestay.xiaozhu.entity.UserUpdateDTO;
import com.homestay.xiaozhu.repository.OrderRepository;
import com.homestay.xiaozhu.repository.UserRepository;
import com.homestay.xiaozhu.service.UserService;
import com.homestay.xiaozhu.security.RequireAdmin;
import com.homestay.xiaozhu.security.RequireUser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.HttpURLConnection;
import java.net.URL;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/user")
public class UserController extends BaseController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    // ========== 新增：注入 OrderRepository ==========
    @Autowired
    private OrderRepository orderRepository;

    // ========== 微信小程序配置（从 application.yml 读取） ==========
    @Value("${wechat.miniprogram.appid}")
    private String wechatAppId;

    @Value("${wechat.miniprogram.secret}")
    private String wechatSecret;

    @PostMapping("/login")
    public Map<String, Object> login(@RequestParam String code) {
        return error(410, "旧登录接口已停用，请使用 /user/wxlogin");
    }

    /**
     * 微信小程序一键授权登录接口（标准 OAuth 2.0 四步流程）
     */
    @PostMapping("/wxlogin")
    public Map<String, Object> wxLogin(@RequestBody Map<String, Object> params) {
        Map<String, Object> result = new HashMap<>();
        try {
            // ========== 步骤 2：接收前端传来的 code ==========
            String code = (String) params.get("code");
            Boolean agreed = params.get("agreed") instanceof Boolean ? (Boolean) params.get("agreed") : false;
            if (!agreed) {
                result.put("code", 400);
                result.put("msg", "请先同意用户协议和隐私政策");
                return result;
            }
            if (code == null || code.trim().isEmpty()) {
                result.put("code", 400);
                result.put("msg", "缺少微信 code 参数");
                return result;
            }
            
            System.out.println("【微信登录】收到 code: " + code);
            
            // ========== 步骤 3：后端调用微信接口换取用户身份 ==========
            String appId = wechatAppId;
            String appSecret = wechatSecret;
            
            WechatSessionResult sessionResult = getWechatSession(code, appId, appSecret);
            
            if (sessionResult == null || sessionResult.getOpenid() == null) {
                result.put("code", 500);
                result.put("msg", "微信授权失败，请重试");
                return result;
            }
            
            String openid = sessionResult.getOpenid();
            System.out.println("【微信登录】openid: " + openid);
            
            // ========== 查找或创建用户 ==========
            User user = userRepository.findByOpenid(openid).orElse(null);
            if (user == null) {
                user = new User();
                user.setOpenid(openid);
                user.setNickname("微信用户_" + (System.currentTimeMillis() % 10000));
                user.setStatus(1);
                user = userRepository.save(user);
                System.out.println("【新用户注册】ID: " + user.getId() + ", openid: " + openid);
            } else {
                System.out.println("【老用户登录】ID: " + user.getId() + ", nickname: " + user.getNickname());
            }
            
            // ========== 步骤 4：生成自定义登录态 ==========
            String token = authService.issueUserToken(user.getId());
            
            result.put("code", 200);
            result.put("msg", "登录成功");
            
            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("userId", user.getId());
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("nickname", user.getNickname());
            userData.put("avatarUrl", user.getAvatarUrl());
            
            data.put("userInfo", userData);
            result.put("data", data);
            
            System.out.println("【登录成功】token: " + token);
            
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "登录失败：" + e.getMessage());
            e.printStackTrace();
        }
        return result;
    }

    /**
     * 内部类：微信会话结果
     */
    private static class WechatSessionResult {
        private String openid;
        private String sessionKey;
        
        public WechatSessionResult(String openid, String sessionKey) {
            this.openid = openid;
            this.sessionKey = sessionKey;
        }
        
        public String getOpenid() {
            return openid;
        }
        
        public String getSessionKey() {
            return sessionKey;
        }
    }
    
    /**
     * 调用微信官方接口 jscode2session 换取 openid 和 session_key
     */
    private WechatSessionResult getWechatSession(String code, String appId, String appSecret) {
        try {
            // 构建微信 jscode2session 接口 URL
            String url = "https://api.weixin.qq.com/sns/jscode2session" +
                         "?appid=" + appId +
                         "&secret=" + appSecret +
                         "&js_code=" + code +
                         "&grant_type=authorization_code";
            
            System.out.println("【微信接口】请求 URL: " + url);
            
            // 发起 HTTPS GET 请求
            URL obj = new URL(url);
            HttpURLConnection con = (HttpURLConnection) obj.openConnection();
            con.setRequestMethod("GET");
            con.setConnectTimeout(5000);
            con.setReadTimeout(10000);
            
            // 读取响应
            BufferedReader in = new BufferedReader(new InputStreamReader(con.getInputStream(), "UTF-8"));
            StringBuilder response = new StringBuilder();
            String inputLine;
            
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();
            con.disconnect();
            
            System.out.println("【微信接口】返回：" + response.toString());
            
            // 解析微信返回的 JSON
            ObjectMapper mapper = new ObjectMapper();
            JsonNode jsonNode = mapper.readTree(response.toString());
            
            // 检查是否成功
            if (jsonNode.has("errcode")) {
                int errCode = jsonNode.get("errcode").asInt();
                String errMsg = jsonNode.has("errmsg") ? jsonNode.get("errmsg").asText() : "未知错误";
                System.err.println("【微信接口错误】errcode: " + errCode + ", errmsg: " + errMsg);
                return null;
            }
            
            // 提取 openid 和 session_key
            String openid = jsonNode.get("openid").asText();
            String sessionKey = jsonNode.has("session_key") ? jsonNode.get("session_key").asText() : "";
            
            System.out.println("【微信接口成功】openid: " + openid + 
                             ", session_key: " + sessionKey.substring(0, Math.min(10, sessionKey.length())) + "...");
            
            return new WechatSessionResult(openid, sessionKey);
            
        } catch (Exception e) {
            System.err.println("【调用微信接口失败】" + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * 生成自定义 Token
     */
    @GetMapping("/info")
    @RequireUser
    public Map<String, Object> getUserInfo(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "token", required = false) String token) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Long userId = getCurrentUserId(authorization, token);
            
            // 根据用户ID查询用户信息
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                result.put("code", 404);
                result.put("msg", "用户不存在");
                return result;
            }
            
            result.put("code", 200);
            result.put("msg", "获取成功");
            result.put("data", user);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "获取用户信息失败: " + e.getMessage());
        }
        
        return result;
    }

    @PostMapping("/update")
    @RequireUser
    public Map<String, Object> updateUserInfo(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestHeader(value = "token", required = false) String token,
            @RequestBody UserUpdateDTO updateUserDto) {
        Map<String, Object> result = new HashMap<>();
        
        try {
            Long userId = getCurrentUserId(authorization, token);
            
            // 根据用户ID查询用户信息
            User existingUser = userRepository.findById(userId).orElse(null);
            if (existingUser == null) {
                result.put("code", 404);
                result.put("msg", "用户不存在");
                return result;
            }
            
            // 更新用户信息（只更新允许的字段，确保安全性）
            if (updateUserDto.getNickname() != null) {
                existingUser.setNickname(updateUserDto.getNickname());
            }
            if (updateUserDto.getAvatarUrl() != null) {
                existingUser.setAvatarUrl(updateUserDto.getAvatarUrl());
            }
            if (updateUserDto.getGender() != null) {
                existingUser.setGender(updateUserDto.getGender());
            }
            if (updateUserDto.getBirthday() != null) {
                // 将字符串格式的生日转换为Date类型
                try {
                    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                    sdf.setLenient(false);
                    Date birthdayDate = sdf.parse(updateUserDto.getBirthday());
                    existingUser.setBirthday(birthdayDate);
                } catch (Exception e) {
                    System.out.println("生日格式转换失败: " + e.getMessage());
                    result.put("code", 400);
                    result.put("msg", "生日格式不正确，应为yyyy-MM-dd格式");
                    return result;
                }
            }
            if (updateUserDto.getPhone() != null) {
                existingUser.setPhone(updateUserDto.getPhone());
            }
            if (updateUserDto.getEmail() != null) {
                existingUser.setEmail(updateUserDto.getEmail());
            }
            
            // 保存更新后的用户信息
            User savedUser = userRepository.save(existingUser);
            
            result.put("code", 200);
            result.put("msg", "更新成功");
            result.put("data", savedUser);
        } catch (Exception e) {
            result.put("code", 500);
            result.put("msg", "更新用户信息失败: " + e.getMessage());
        }
        
        return result;
    }

    @GetMapping("/list")
    @RequireAdmin
    public Map<String, Object> getUserList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) Integer status) {

        Map<String, Object> result = new HashMap<>();

        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);

        Page<User> userPage = userRepository.findAll((root, query, cb) -> {
            List<javax.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (nickname != null && !nickname.trim().isEmpty()) {
                predicates.add(cb.like(root.get("nickname"), "%" + nickname.trim() + "%"));
            }
            if (phone != null && !phone.trim().isEmpty()) {
                predicates.add(cb.like(root.get("phone"), "%" + phone.trim() + "%"));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new javax.persistence.criteria.Predicate[0]));
        }, pageable);

        // ========== 新增：给每个用户补充订单总数 ==========
        List<Map<String, Object>> userListWithOrderCount = new ArrayList<>();
        userPage.getContent().forEach(user -> {
            Map<String, Object> userMap = new HashMap<>();
            // 拷贝用户原有属性
            userMap.put("id", user.getId());
            userMap.put("nickname", user.getNickname());
            userMap.put("avatarUrl", user.getAvatarUrl());
            userMap.put("phone", user.getPhone());
            userMap.put("email", user.getEmail());
            userMap.put("gender", user.getGender());
            userMap.put("birthday", user.getBirthday());
            userMap.put("status", user.getStatus());
            userMap.put("createdAt", user.getCreatedAt());
            // 统计有效订单数（排除已取消、已退款）
            Long orderCount = orderRepository.countValidOrdersByUserId(user.getId());
            userMap.put("orderCount", orderCount == null ? 0 : orderCount);
            userListWithOrderCount.add(userMap);
        });

        result.put("code", 200);
        result.put("msg", "获取成功");
        Map<String, Object> data = new HashMap<>();
        data.put("list", userListWithOrderCount); // 替换为补充订单数后的用户列表
        data.put("total", userPage.getTotalElements());
        data.put("page", safePage);
        data.put("size", safeSize);
        result.put("data", data);

        return result;
    }

    // ========== 查询单个用户的历史订单 ==========
    @GetMapping("/{userId}/orders")
    @RequireAdmin
    public Map<String, Object> getUserOrders(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        Map<String, Object> result = new HashMap<>();

        // 验证用户是否存在
        if (!userRepository.existsById(userId)) {
            result.put("code", 404);
            result.put("msg", "用户不存在");
            return result;
        }

        int safePage = Math.max(1, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(safePage - 1, safeSize);
        // 排除已取消、已退款的订单
        List<Integer> excludeStatus = List.of(4, 5);
        Page<Order> orderPage = orderRepository.findByUserIdAndStatusNotInOrderByCreatedAtDesc(userId, excludeStatus, pageable);

        result.put("code", 200);
        result.put("msg", "获取成功");
        Map<String, Object> data = new HashMap<>();
        data.put("list", orderPage.getContent());
        data.put("total", orderPage.getTotalElements());
        data.put("page", safePage);
        data.put("size", safeSize);
        result.put("data", data);

        return result;
    }

    @PutMapping("/{userId}/status")
    @RequireAdmin
    public Map<String, Object> updateUserStatus(@PathVariable Long userId,
                                                 @RequestBody Map<String, Object> body) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return error(404, "用户不存在");
        }
        Object value = body.get("status");
        if (value == null) {
            return error(400, "状态不能为空");
        }
        int status;
        try {
            status = Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return error(400, "状态格式不正确");
        }
        if (status != 0 && status != 1) {
            return error(400, "状态只能为 0 或 1");
        }
        user.setStatus(status);
        userRepository.save(user);
        return success("用户状态更新成功", status);
    }
}
