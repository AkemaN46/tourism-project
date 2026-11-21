/**
 * 工具函数统一导出文件
 * 方便一次性导入所有常用工具
 */

const dateUtil = require('./dateUtil');
const orderUtil = require('./orderUtil');
const validateUtil = require('./validateUtil');
const config = require('./config');

module.exports = {
  // 日期工具
  ...dateUtil,
  
  // 订单工具
  ...orderUtil,
  
  // 验证工具
  ...validateUtil,
  
  // 配置常量
  ...config
};

// 单独导出模块，方便按需使用
module.exports.dateUtil = dateUtil;
module.exports.orderUtil = orderUtil;
module.exports.validateUtil = validateUtil;
module.exports.config = config;
