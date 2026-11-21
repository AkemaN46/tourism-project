/**
 * 应用配置常量
 * 统一管理全局常量和配置项
 */
module.exports = {
  // API 基础 URL
  // 微信开发者工具本机调试地址。使用 127.0.0.1 避免 localhost 被解析到不可用的 IPv6/代理地址。
  // 真机调试时应替换为电脑的局域网 IP 或已备案的 HTTPS 域名。
  API_BASE_URL: 'http://127.0.0.1:8082',
  
  // Token 存储键名
  TOKEN_STORAGE_KEY: 'token',
  
  // 用户信息存储键名
  USER_INFO_STORAGE_KEY: 'userInfo',
  
  // 请求超时时间（毫秒）
  REQUEST_TIMEOUT: 10000,
  
  // 订单状态映射
  ORDER_STATUS: {
    0: '待支付',
    1: '已支付',
    2: '已入住',
    3: '已完成',
    4: '已取消'
  },
  
  // 酒店入住时间
  HOTEL_CHECK_IN_TIME: '14:00',
  
  // 酒店退房时间
  HOTEL_CHECK_OUT_TIME: '12:00'
};
