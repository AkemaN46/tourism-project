package com.homestay.xiaozhu.util;

import java.util.regex.Pattern;

/**
 * 数据验证工具类
 * 提供常用输入验证方法，确保数据安全性和有效性
 */
public class ValidationUtil {
    
    /**
     * 手机号正则表达式（中国大陆）
     */
    private static final Pattern PHONE_PATTERN = Pattern.compile("^1[3-9]\\d{9}$");
    
    /**
     * 邮箱正则表达式
     */
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\\.[a-zA-Z0-9_-]+)+$");
    
    /**
     * 身份证号码正则表达式（简化版）
     */
    private static final Pattern ID_CARD_PATTERN = Pattern.compile("^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$");
    
    /**
     * 验证手机号
     * 
     * @param phone 手机号
     * @return true 如果格式正确
     */
    public static boolean isValidPhone(String phone) {
        return phone != null && PHONE_PATTERN.matcher(phone).matches();
    }
    
    /**
     * 验证邮箱
     * 
     * @param email 邮箱地址
     * @return true 如果格式正确
     */
    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email).matches();
    }
    
    /**
     * 验证身份证号码
     * 
     * @param idCard 身份证号码
     * @return true 如果格式正确
     */
    public static boolean isValidIdCard(String idCard) {
        return idCard != null && ID_CARD_PATTERN.matcher(idCard).matches();
    }
    
    /**
     * 验证字符串是否为空
     * 
     * @param str 待检查的字符串
     * @return true 如果为空或只包含空白字符
     */
    public static boolean isBlank(String str) {
        return str == null || str.trim().isEmpty();
    }
    
    /**
     * 验证字符串是否不为空
     * 
     * @param str 待检查的字符串
     * @return true 如果不为空且包含非空白字符
     */
    public static boolean isNotBlank(String str) {
        return !isBlank(str);
    }
    
    /**
     * 验证字符串长度是否在指定范围内
     * 
     * @param str 待检查的字符串
     * @param min 最小长度
     * @param max 最大长度
     * @return true 如果长度在范围内
     */
    public static boolean isValidLength(String str, int min, int max) {
        if (str == null) {
            return false;
        }
        int length = str.length();
        return length >= min && length <= max;
    }
    
    /**
     * 验证数字是否在指定范围内
     * 
     * @param number 数字值
     * @param min 最小值
     * @param max 最大值
     * @return true 如果在范围内
     */
    public static boolean isValidRange(Number number, Number min, Number max) {
        if (number == null || min == null || max == null) {
            return false;
        }
        double num = number.doubleValue();
        return num >= min.doubleValue() && num <= max.doubleValue();
    }
}
