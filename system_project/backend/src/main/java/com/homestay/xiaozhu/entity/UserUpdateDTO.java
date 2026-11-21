package com.homestay.xiaozhu.entity;

import lombok.Data;
import java.util.Date;

@Data
public class UserUpdateDTO {
    private String nickname;
    private String avatarUrl;
    private Integer gender;
    private String birthday;  // 字符串格式，便于接收前端传来的日期字符串
    private String phone;
    private String email;
}