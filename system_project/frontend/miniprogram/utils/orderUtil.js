const imageUtil = require('./imageUtil');

/**
 * 从后端返回的日期字符串中提取日期部分（去除时间）
 * @param {string} dateStr 日期字符串（可能包含时间）
 * @returns {string} 仅日期部分
 */
const parseDateOnly = (dateStr) => {
  if (!dateStr) return '';
  // 如果包含空格，只取日期部分
  return dateStr.split(' ')[0];
};

/**
 * 格式化订单列表中的日期字段
 * @param {Array} orderList 订单列表
 * @returns {Array} 格式化后的订单列表
 */
const formatOrderDates = (orderList) => {
  return orderList.map(order => {
    const formattedOrder = { ...order };
    
    // 格式化入住和离店日期
    if (formattedOrder.checkInDate) {
      formattedOrder.checkInDate = parseDateOnly(formattedOrder.checkInDate);
    }
    if (formattedOrder.checkOutDate) {
      formattedOrder.checkOutDate = parseDateOnly(formattedOrder.checkOutDate);
    }
    
    // 确保 reviewed 字段存在
    if (formattedOrder.reviewed === undefined || formattedOrder.reviewed === null) {
      formattedOrder.reviewed = false;
    }
    formattedOrder.roomImage = imageUtil.resolveRoomImage(formattedOrder.roomImage, formattedOrder.roomId);
    
    return formattedOrder;
  });
};

/**
 * 格式化单个订单的日期字段
 * @param {Object} order 订单对象
 * @returns {Object} 格式化后的订单对象
 */
const formatSingleOrderDate = (order) => {
  if (!order) return null;
  
  const formattedOrder = { ...order };
  
  // 格式化入住和离店日期
  if (formattedOrder.checkInDate) {
    formattedOrder.checkInDate = parseDateOnly(formattedOrder.checkInDate);
  }
  if (formattedOrder.checkOutDate) {
    formattedOrder.checkOutDate = parseDateOnly(formattedOrder.checkOutDate);
  }
  formattedOrder.roomImage = imageUtil.resolveRoomImage(formattedOrder.roomImage, formattedOrder.roomId);
  
  return formattedOrder;
};

module.exports = {
  parseDateOnly,
  formatOrderDates,
  formatSingleOrderDate
};
